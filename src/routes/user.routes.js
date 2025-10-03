import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
    handleLoginUser,
    handleRegisterUser,
    handleLogoutUser,
    refreshAccessToken,
    handleChangePassword,
    handleGetCurrentUser,
    handleUpdateAvatar,
    handleDeleteAvatar,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/").get(asyncHandler(handleGetCurrentUser));

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

router.route("/login").post(asyncHandler(handleLoginUser));

router.route("/logout").post(asyncHandler(handleLogoutUser));

router.route("/refresh-token").post(asyncHandler(refreshAccessToken));

router.route("/change-password").patch(asyncHandler(handleChangePassword));

router
    .route("/update-avatar")
    .patch(upload.single("newAvatar"), asyncHandler(handleUpdateAvatar));

router.route("/delete-avatar").delete(asyncHandler(handleDeleteAvatar))

export default router;
