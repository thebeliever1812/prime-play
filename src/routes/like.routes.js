import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { handleLikeVideo } from "../controllers/like.controller.js";

const router = Router();

router.route("/video/:videoId").post(asyncHandler(handleLikeVideo));

export default router;
