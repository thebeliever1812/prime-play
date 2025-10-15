import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { handleGetAuthenticationDetails } from "../controllers/auth.controller.js";

const router = Router();

router.route("/session").get(asyncHandler(handleGetAuthenticationDetails));

export default router;
