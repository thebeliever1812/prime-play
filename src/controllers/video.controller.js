import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { VideoUploadSchema } from "../schemas/index.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

export const handleUploadVideo = async (req, res) => {
    if (!req.user) {
        throw new ApiError(401, "Unauthorized, Please login to upload video");
    }

    const { title, description } = req.body;

    if ([title, description].some((field) => !field?.trim())) {
        throw new ApiError(400, "All fields are required");
    }

    const result = VideoUploadSchema.safeParse({ title, description });

    if (!result.success) {
        throw new ApiError(
            400,
            result.error.issues.map(
                (err) => `${err.path[0]} ${err.message.toLowerCase()}`
            )
        );
    }

    const validatedData = result.data;

    const { thumbnail, videoFile } = req.files;

    if (!thumbnail || !videoFile) {
        throw new ApiError(400, "Both thumbnail and video file are required");
    }

    const thumbnailLocalPath = thumbnail[0]?.path;
    const videoFileLocalPath = videoFile[0]?.path;

    if (!thumbnailLocalPath || !videoFileLocalPath) {
        throw new ApiError(
            400,
            "Thumbnail or video file path not found while uploading"
        );
    }

    const thumbnailResponseOnCloudinary =
        await uploadOnCloudinary(thumbnailLocalPath);

    const videoFileResponseOnCloudinary =
        await uploadOnCloudinary(videoFileLocalPath);

    if (!thumbnailResponseOnCloudinary) {
        throw new ApiError(500, "Thumbnail upload failed");
    }

    if (!videoFileResponseOnCloudinary) {
        throw new ApiError(500, "Video upload failed");
    }

    const { public_id: thumbnailPublicId, secure_url: thumbnailSecureUrl } =
        thumbnailResponseOnCloudinary;

    const {
        public_id: videoFilePublicId,
        secure_url: videoFileSecureUrl,
        duration: videoFileDuration,
    } = videoFileResponseOnCloudinary;

    // All fields are ready to add in db

    const video = await Video.create({
        title: validatedData.title,
        description: validatedData.description,
        thumbnail: thumbnailSecureUrl,
        thumbnailId: thumbnailPublicId,
        videoFile: videoFileSecureUrl,
        videoFileId: videoFilePublicId,
        duration: videoFileDuration,
        owner: req.user._id,
    });

    if (!video) {
        throw new ApiError(500, "Failed to create video in database");
    }

    const user = await User.findById(req.user._id);

    if (!user) {
        throw new ApiError(404, "User not found while uploading video")
    }

    user.myVideos.push(video._id);

    await user.save({ validateBeforeSave: false });

    res.status(201).json(new ApiResponse(201, "Video uploaded successfully"));
};
