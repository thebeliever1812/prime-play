import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

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
        console.error(error);
        // Unlink file from server after unsuccessful upload also
        fs.unlinkSync(localFilePath);
    }
};
