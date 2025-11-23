import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const handleLikeVideo = async (req, res) => {
    if (!req.user) {
        throw new ApiError(401, "Unauthorized, Please login to like the video");
    }

    const { videoId } = req.params;

    if (!videoId) {
        throw new ApiError(400, "Video ID is required");
    }

    const { isLiked } = req.body;

    if (typeof isLiked === "undefined") {
        throw new ApiError(400, "isLiked and channelId are required");
    }

    const isAlreadyLiked = await Like.findOne({
        likedBy: req.user._id,
        video: videoId,
    });

    if (isLiked && isAlreadyLiked) {
        throw new ApiError(400, "Video is already liked by you");
    }

    if (!isLiked && !isAlreadyLiked) {
        throw new ApiError(400, "Video is not liked");
    }

    if (isLiked) {
        await Like.create({
            likedBy: req.user._id,
            video: videoId,
        });
    } else {
        await Like.findOneAndDelete({ likedBy: req.user._id, video: videoId });
    }

    return res.status(201).json(new ApiResponse(201, "Video like status updated successfully"));
};
