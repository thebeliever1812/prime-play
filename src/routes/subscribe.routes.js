import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.route('/').post(asyncHandler(handleSubscribeChannel))

export default router