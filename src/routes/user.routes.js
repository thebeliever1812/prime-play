import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { handleRegisterUser } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"

const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1,
        },
        {
            name: "coverImage",
            maxCount: 1,
        },
    ]),
    asyncHandler(handleRegisterUser)
);

export default router