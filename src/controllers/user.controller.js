import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { UserRegisterSchema } from "../schemas/userRegister.schema.js";
import { UserLoginSchema } from "../schemas/userLogin.schema.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (userId) => {
    if (!userId) {
        return null;
    }
    try {
        const user = await User.findById(userId).select("-password");

        if (!user) {
            return null;
        }

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;

        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken, user };
    } catch (error) {
        throw new ApiError(500, "Failed to generate tokens");
    }
};

export const handleRegisterUser = async (req, res) => {
    if (req.user) {
        throw new ApiError(400, "You are already a logged in user");
    }

    const { username, fullName, email, password } = req.body;

    if (
        [username, fullName, email, password].some(
            (field) => !field || field?.trim() === ""
        )
    ) {
        throw new ApiError(400, "All fields are required");
    }

    // Validation
    const result = UserRegisterSchema.safeParse({
        username,
        fullName,
        email,
        password,
    });

    if (!result.success) {
        throw new ApiError(
            400,
            result.error.issues
                .map((err) => `${err.path[0]} ${err.message.toLowerCase()}`)
                .join(", ")
        );
    }

    // If reached here that means validation is successful
    const validatedData = result.data;

    // Check for existing user
    const isExistingUser = await User.findOne({
        $or: [
            { username: validatedData.username },
            { email: validatedData.email },
        ],
    });

    if (isExistingUser) {
        throw new ApiError(409, "Email or username already exist");
    }

    const { avatar, coverImage } = req.files;

    const avatarLocalFilePath = avatar[0]?.path;
    const coverImageLocalFilePath = coverImage[0]?.path;

    let avatarUrl;
    let coverImageUrl;

    if (avatarLocalFilePath) {
        avatarUrl = (await uploadOnCloudinary(avatarLocalFilePath)).url;
    }

    if (coverImageLocalFilePath) {
        coverImageUrl = (await uploadOnCloudinary(coverImageLocalFilePath)).url;
    }

    // Create user account
    const newUser = await User.create({
        ...validatedData,
        avatar: avatarUrl,
        coverImage: coverImageUrl,
    });

    if (!newUser) {
        throw new ApiError(500, "Failed to create account");
    }

    res.status(201).json(new ApiResponse(201, "Account created successfully"));
};

export const handleLoginUser = async (req, res) => {
    if (req.user) {
        throw new ApiError(400, "You are already a logged in user");
    }

    const { email, password } = req.body;

    if ([email, password].some((field) => !field || field.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    // Validation
    const result = UserLoginSchema.safeParse({ email, password });

    if (!result.success) {
        throw new ApiError(
            400,
            result.error.issues
                .map((err) => `${err.path[0]} ${err.message.toLowerCase()}`)
                .join(", ")
        );
    }

    const validatedData = result.data;

    // First check if user exist or not
    const user = await User.findOne({ email });

    if (!user) {
        throw new ApiError(404, "Account does not exist with this email");
    }

    const isPasswordMatching = await user.matchPassword(validatedData.password);

    if (!isPasswordMatching) {
        throw new ApiError(401, "Incorrect password, try again!");
    }

    const tokensAndUpdatedUser = await generateAccessAndRefreshTokens(user._id);

    if (!tokensAndUpdatedUser) {
        throw new ApiError("Failed to generate tokens, please login again!");
    }

    const {
        accessToken,
        refreshToken,
    } = tokensAndUpdatedUser;

    return res
        .status(200)
        .cookie("accessToken", accessToken, global.cookieOptions)
        .cookie("refreshToken", refreshToken, global.cookieOptions)
        .json(new ApiResponse(200, "Login successful"));
};

export const handleLogoutUser = async (req, res) => {
    if (!req.user) {
        throw new ApiError(401, "Unauthorized user, please login");
    }

    await User.updateOne(
        { _id: req.user._id },
        { $unset: { refreshToken: "" } }
    );

    res.status(200)
        .clearCookie("accessToken", options, global.cookieOptions)
        .clearCookie("refreshToken", options, global.cookieOptions)
        .json(new ApiResponse(200, "Logout Successfull"));
};

export const refreshAccessToken = async (req, res) => {
    if (req.user) {
        throw new ApiError(401, "Access token not expired");
    }

    const currentRefreshToken =
        req.cookies.refreshToken || req.body.refreshToken;

    if (!currentRefreshToken) {
        throw new ApiError(404, "Refresh token not found, please login again");
    }

    try {
        const isVerifiedRefreshToken = jwt.verify(
            currentRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        const userId = isVerifiedRefreshToken._id;

        const user = await User.findById(userId);

        if (!user) {
            throw new ApiError(404, "User not found for this refresh token");
        }

        if (currentRefreshToken !== user?.refreshToken) {
            throw new ApiError(
                401,
                "Unauthorized: Refresh token does not match"
            );
        }

        const {
            accessToken,
            refreshToken: newRefreshToken
        } = await generateAccessAndRefreshTokens(user._id);

        res.status(200)
            .cookie("accessToken", accessToken, global.cookieOptions)
            .cookie("refreshToken", newRefreshToken, global.cookieOptions)
            .json(new ApiResponse(200, "Access token updated"));
    } catch (error) {
        if (error instanceof ApiError) {
            throw new ApiError(error.statusCode, error.message);
        }
        throw new ApiError(401, "Invalid or expired token");
    }
};
