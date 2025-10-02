import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { UserRegisterSchema } from "../schemas/userRegister.schema.js";
import { UserLoginSchema } from "../schemas/userLogin.schema.js";
import { User } from "../models/user.model.js";
import { deleteImageFileFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import { UserPasswordSchema } from "../schemas/userPassword.schema.js";

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
    let avatarImageId;
    let coverImageUrl;
    let coverImageId;

    if (avatarLocalFilePath) {
        const avatarResponse = await uploadOnCloudinary(avatarLocalFilePath)
        avatarUrl = avatarResponse.secure_url
        avatarImageId = avatarResponse.public_id
    }

    if (coverImageLocalFilePath) {
        const coverImageResponse = await uploadOnCloudinary(coverImageLocalFilePath)
        coverImageUrl = coverImageResponse.secure_url;
        coverImageId = coverImageResponse.public_id;
    }

    // Create user account
    const newUser = await User.create({
        ...validatedData,
        avatar: avatarUrl,
        avatarImageId,
        coverImage: coverImageUrl,
        coverImageId
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

    const { accessToken, refreshToken } = tokensAndUpdatedUser;

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
        .clearCookie("accessToken", global.cookieOptions)
        .clearCookie("refreshToken", global.cookieOptions)
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

        const { accessToken, refreshToken: newRefreshToken } =
            await generateAccessAndRefreshTokens(user._id);

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

export const handleChangePassword = async (req, res) => {
    if (!req.user) {
        throw new ApiError(
            401,
            "You are not logged in, please login to change the password"
        );
    }

    const { oldPassword, newPassword } = req.body;

    if (
        [oldPassword, newPassword].some(
            (field) => !field || field?.trim() === ""
        )
    ) {
        throw new ApiError(400, "All fields are required");
    }

    const oldPasswordResult = UserPasswordSchema.safeParse({
        password: oldPassword,
    });

    if (!oldPasswordResult.success) {
        throw new ApiError(
            400,
            `Old password ${oldPasswordResult.error?.issues[0]?.message.toLowerCase()}`
        );
    }

    const newPasswordResult = UserPasswordSchema.safeParse({
        password: newPassword,
    });

    if (!newPasswordResult.success) {
        throw new ApiError(
            400,
            `New password ${newPasswordResult.error?.issues[0]?.message.toLowerCase()}`
        );
    }

    const validatedOldPassword = oldPasswordResult.data.password;
    const validatedNewPassword = newPasswordResult.data.password;

    // Check for correct password from database
    const user = await User.findById(req.user?._id);

    if (!user) {
        throw new ApiError(404, "User not found while changing password");
    }

    const isPasswordMatched = await user.matchPassword(validatedOldPassword);

    if (!isPasswordMatched) {
        throw new ApiError(400, "Incorrect old password");
    }

    user.password = validatedNewPassword;

    await user.save({ validateBeforeSave: false });

    res.status(201).json(new ApiResponse(201, "Password changed successfully"));
};

export const handleGetCurrentUser = async (req, res) => {
    if (!req.user) {
        throw new ApiError(
            401,
            "Unauthorized, please login to get your details"
        );
    }

    const user = await User.findById(req.user?._id).select(
        "-password -refreshToken"
    );

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    res.status(200).json(new ApiResponse(200, "User details found", user));
};

export const handleUpdateAvatar = async (req, res) => {
    if (!req.user) {
        throw new ApiError(401, "Unauthorized, Please login to update avatar");
    }

    const newAvatar = req.file;

    if (!newAvatar) {
        throw new ApiError(400, "Avatar file needed");
    }

    const newAvatarLocalFilePath = newAvatar?.path;

    if (!newAvatarLocalFilePath) {
        throw new ApiError(400, "Avatar file path not found");
    }

    const user = await User.findById(req.user?._id)

    if (!user) {
        throw new ApiError(404, "User not found when deleting old avatar image")
    }

    const oldAvatarImageId = user?.avatarImageId

    const isDeletedAvatar = await deleteImageFileFromCloudinary(oldAvatarImageId)

    if (isDeletedAvatar.result !== "ok") {
        throw new ApiError(400, "Failed to delete old avatar");
    }

    const result = await uploadOnCloudinary(newAvatarLocalFilePath);

    if (!result) {
        throw new ApiError(500, "Upload failed, please try again");
    }

    const newAvatarUrl = result?.secure_url;

    await User.findByIdAndUpdate(req.user?._id, {
        $set: { avatar: newAvatarUrl },
    });

    res.status(201).json(new ApiResponse(201, "Avatar updated successfully"));
};
