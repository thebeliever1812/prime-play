import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router()

router.route("/session").get(asyncHandler())

export default router
