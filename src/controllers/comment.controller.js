import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Comment } from "../models/comment.model.js";
import { CommentSchema } from "../schemas/comment.schema.js";
import mongoose from "mongoose";

export const handleCommentUpload = async (req, res) => {
    if (!req.user) {
        throw new ApiError(401, "Unauthorized, please log in to comment.");
    }

    const { comment, id: videoId } = req.body;

    if (!comment || comment.trim() === "") {
        throw new ApiError(400, "Comment content cannot be empty.");
    }

    const result = CommentSchema.safeParse({ comment });

    if (!result.success) {
        throw new ApiError(400, `Comment ${result.error.issues[0]?.message}`);
    }

    const validatedCommentContent = result.data.comment;

    const newComment = await Comment.create({
        content: validatedCommentContent,
        video: videoId,
        owner: req.user._id,
    });

    if (!newComment) {
        throw new ApiError(
            500,
            "Failed to upload comment. Please try again later."
        );
    }

    res.status(201).json(
        new ApiResponse(201, "Comment uploaded successfully", newComment)
    );
};

export const handleGetComments = async (req, res) => {
    const { videoId } = req.params;

    if (!videoId) {
        throw new ApiError(400, "Video ID is required to fetch comments.");
    }

    const comments = await Comment.aggregate([
        {
            $match: { video: new mongoose.Types.ObjectId(videoId) },
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
            },
        },
        {
            $unwind: "$ownerDetails",
        },
        {
            $sort: {
                createdAt: -1,
            },
        },
        {
            $project: {
                _id: 1,
                content: 1,
                createdAt: 1,
                ownerDetails: {
                    _id: 1,
                    avatar: 1,
                    fullName: 1,
                },
            },
        },
    ]);

    if (!comments) {
        throw new ApiError(
            500,
            "Failed to retrieve comments. Please try again later."
        );
    }

    res.status(200).json(
        new ApiResponse(200, "Comments retrieved successfully", comments)
    );
};
