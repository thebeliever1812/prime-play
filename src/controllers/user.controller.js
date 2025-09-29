import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { UserRegisterSchema } from "../schemas/userRegister.schema.js";
import { UserLoginSchema } from "../schemas/userLogin.schema.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

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

    if (!req.body) {
        throw new ApiError(400, "Request body is missing");
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

    if (!req.body) {
        throw new ApiError(400, "Request body is missing");
    }

    const { email, password } = req.body;

    if ([email, password].some((field) => !field || field.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    // Validation
    const result = UserLoginSchema.safeParse(email, password);

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
        user: loggedInUser,
    } = tokensAndUpdatedUser;

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, "Login successful"));
};

export const handleLogoutUser = async (req, res) => {
    if (!req.user) {
        throw new ApiError(401, "Unauthorized user, please login");
    }

    await User.updateOne(
        { _id: req.user._id },
        {
            $set: { refreshToken: undefined },
        }
    );

    const options = {
        secure: true,
        httpOnly: true,
    };

    res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, "Logout Successfull"));
};
