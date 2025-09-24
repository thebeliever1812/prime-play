import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { handleRegisterUser } from "../controllers/user.controller.js";

const router = Router()

router.route('/register').post(asyncHandler(handleRegisterUser))

export default router