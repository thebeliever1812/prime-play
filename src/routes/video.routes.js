import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
    handleUploadVideo,
    handleGetMyVideos,
    handlePlayVideo,
    handleGetAllVideos,
    handleGetChannelVideos,
    handleGetLikedVideos,
} from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/upload-video").post(
    upload.fields([
        {
            name: "thumbnail",
            maxCount: 1,
        },
        {
            name: "videoFile",
            maxCount: 1,
        },
    ]),
    asyncHandler(handleUploadVideo)
);

router.route("/my-videos").get(asyncHandler(handleGetMyVideos));

router.route("/channel-videos/:username").get(asyncHandler(handleGetChannelVideos));

router.route("/all-videos").get(asyncHandler(handleGetAllVideos));

router.route("/play-video/:videoId").get(asyncHandler(handlePlayVideo));

router.route("/liked-videos").get(asyncHandler(handleGetLikedVideos));

export default router;
