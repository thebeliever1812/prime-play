import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { handleUploadVideo } from "../controllers/video.controller.js";
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

export default router;
