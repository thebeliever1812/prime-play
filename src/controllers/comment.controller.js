import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Comment } from "../models/comment.model.js";
import { CommentSchema } from "../schemas/comment.schema.js";

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
