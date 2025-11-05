import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { handleSubscribeChannel } from "../controllers/subscribe.controller.js";

const router = Router();

router.route("/").post(asyncHandler(handleSubscribeChannel));

export default router;
