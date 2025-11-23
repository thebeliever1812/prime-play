import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { VideoUploadSchema } from "../schemas/index.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";
import { size } from "zod";

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
        throw new ApiError(404, "User not found while uploading video");
    }

    user.myVideos.push(video._id);

    await user.save({ validateBeforeSave: false });

    res.status(201).json(new ApiResponse(201, "Video uploaded successfully"));
};

export const handleGetMyVideos = async (req, res) => {
    if (!req.user) {
        throw new ApiError(
            401,
            "Unauthorized, Please login to view your videos"
        );
    }

    console.log(req.user);
    const videos = await Video.aggregate([
        {
            $match: { owner: new mongoose.Types.ObjectId(req.user._id) },
        },
        {
            $sort: { createdAt: -1 },
        },
        {
            $project: {
                title: 1,
                description: 1,
                thumbnail: 1,
                videoFile: 1,
                duration: 1,
                createdAt: 1,
                views: 1,
            },
        },
    ]);

    res.status(200).json(
        new ApiResponse(200, "Videos fetched successfully", videos)
    );
};

export const handlePlayVideo = async (req, res) => {
    const { videoId } = req.params;

    if (!videoId) {
        throw new ApiError(400, "Video ID is required");
    }

    if (req.user) {
        const userUpdate = await User.updateOne(
            { _id: req.user._id, watchHistory: { $ne: videoId } }, // match only if not present
            { $addToSet: { watchHistory: videoId } } // add only if absent
        );

        // If modifiedCount === 1, the video was added to watchHistory for the first time -> increment views
        if (userUpdate.modifiedCount === 1) {
            await Video.findByIdAndUpdate(videoId, { $inc: { views: 1 } });
        }
    }

    const video = await Video.aggregate([
        {
            $match: { _id: new mongoose.Types.ObjectId(videoId) },
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
            },
        },
        {
            $unwind: "$owner",
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "owner._id",
                foreignField: "channel",
                as: "subscribers",
            },
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes",
            },
        },
        {
            $addFields: {
                "owner.subscribersCount": { $size: "$subscribers" },
                likesCount: { $size: "$likes" },
                isLiked: {
                    $cond: {
                        if: {
                            $in: [
                                new mongoose.Types.ObjectId(req.user?._id),
                                "$likes.likedBy",
                            ],
                        },
                        then: true,
                        else: false,
                    },
                },
            },
        },
        {
            $project: {
                title: 1,
                description: 1,
                videoFile: 1,
                duration: 1,
                createdAt: 1,
                views: 1,
                owner: {
                    _id: 1,
                    username: 1,
                    fullName: 1,
                    avatar: 1,
                    subscribersCount: 1,
                },
                likesCount: 1,
                isLiked: 1,
            },
        },
    ]);

    if (!video || video.length === 0) {
        throw new ApiError(404, "Video not found");
    }

    res.status(200).json(
        new ApiResponse(200, "Video fetched successfully", video[0])
    );
};

export const handleGetAllVideos = async (_req, res) => {
    const videos = await Video.aggregate([
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerInfo",
            },
        },
        {
            $unwind: "$ownerInfo",
        },
        {
            $sort: {
                createdAt: -1,
            },
        },
        {
            $project: {
                title: 1,
                description: 1,
                thumbnail: 1,
                duration: 1,
                createdAt: 1,
                views: 1,
                ownerInfo: {
                    _id: 1,
                    username: 1,
                    fullName: 1,
                    avatar: 1,
                },
            },
        },
    ]);

    if (videos.length === 0) {
        throw new ApiError(404, "No videos found");
    }

    res.status(200).json(
        new ApiResponse(200, "Videos fetched successfully", videos)
    );
};

export const handleGetChannelVideos = async (req, res) => {
    const { username } = req.params;

    if (!username) {
        throw new ApiError(400, "Username is required");
    }
    const user = await User.findOne({ username });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const videos = await Video.aggregate([
        {
            $match: { owner: new mongoose.Types.ObjectId(user._id) },
        },
        {
            $sort: { createdAt: -1 },
        },
        {
            $project: {
                title: 1,
                description: 1,
                thumbnail: 1,
                videoFile: 1,
                duration: 1,
                createdAt: 1,
                views: 1,
            },
        },
    ]);

    res.status(200).json(
        new ApiResponse(200, "Videos fetched successfully", videos)
    );
};
