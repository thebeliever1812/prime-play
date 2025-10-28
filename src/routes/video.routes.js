import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
    handleUploadVideo,
    handleGetMyVideos,
    handlePlayVideo,
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

router.route("/play-video/:videoId").get(asyncHandler(handlePlayVideo));

export default router;
