import { Schema, model } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowerCase: true,
            trim: true,
            index: true,
        },
        fullName: {
            type: String,
            required: true,
            unique: false,
            trim: true,
            index: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowerCase: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, "Password is required"],
        },
        avatar: {
            type: String,
            default: "/default_avatar.jpg",
        },
        coverImage: {
            type: String,
            default: "/default_cover_image.jpeg",
        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video",
            },
        ],
        refreshToken: {
            type: String,
        },
    },
    { timestamps: true }
);

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return next();
    }
    try {
        this.password = await bcrypt.hash(this.password, 10);
        next();
    } catch (error) {
        console.log("Password failed to hashed:", error);
        next(error);
    }
});

userSchema.methods.matchPassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
    const payload = {
        _id: this._id,
        username: this.username,
        fullName: this.fullName,
        email: this.email,
    };
    const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
    const accessTokenExpiry = process.env.ACCESS_TOKEN_EXPIRY;

    return jwt.sign(payload, accessTokenSecret, {
        expiresIn: accessTokenExpiry,
    });
};

userSchema.methods.generateRefreshToken = function () {
    const payload = {
        _id: this._id,
    };
    const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
    const refreshTokenExpiry = process.env.REFRESH_TOKEN_EXPIRY;

    return jwt.sign(payload, refreshTokenSecret, {
        expiresIn: refreshTokenExpiry,
    });
};

export const User = model("User", userSchema);
