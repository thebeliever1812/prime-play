import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { handleCommentUpload } from "../controllers/comment.controller.js";

const router = Router()

router.route("/").post(asyncHandler(handleCommentUpload))

export default router