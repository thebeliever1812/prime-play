import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { ApiError } from "./ApiError.js";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) {
            return null;
        }
        // Upload the file
        const result = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });

        // Unlink file from server after upload
        fs.unlinkSync(localFilePath);

        return result;
    } catch (error) {
        // Unlink file from server after unsuccessful upload also
        fs.unlinkSync(localFilePath);
    }
};

export const deleteImageFileFromCloudinary = async (publicId) => {
    if (!publicId) {
        throw new ApiError(400, "Avatar image id required to delete the image")
    }
    try {
        const result = await cloudinary.uploader.destroy(publicId, {
            invalidate: true,
            resource_type: "image",
        });

        if (!result) {
            throw new ApiError(500, "Failed to delete avatar image");
        }

        return result;
    } catch (error) {
        if (error instanceof ApiError) {
            console.log(error.message);
        }
        console.log("Something went wrong while deleting the avatar image");
    }
};
