import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
    handleCommentUpload,
    handleGetComments,
} from "../controllers/comment.controller.js";

const router = Router();

router.route("/").post(asyncHandler(handleCommentUpload));

router.route("/video/:videoId").get(asyncHandler(handleGetComments));

export default router;
