import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { UserSignupSchema } from "../schemas/userSignup.schema.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

export const handleRegisterUser = async (req, res) => {
    if (!req.body) {
        throw new ApiError(400, "Request body is missing")
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
    const result = UserSignupSchema.safeParse({
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
