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
    handleUpdateCoverImage,
    handleDeleteCoverImage,
    handleGetUserChannelProfile,
    handleWatchHistory,
    handleGetChannelStats,
    handleDeleteFromHistory,
    handleGetSubscribers,
    handleGetSubscription,
    handleDeleteUserAccount,
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

router.route("/delete-avatar").delete(asyncHandler(handleDeleteAvatar));

router
    .route("/update-cover-image")
    .patch(
        upload.single("newCoverImage"),
        asyncHandler(handleUpdateCoverImage)
    );

router
    .route("/delete-cover-image")
    .delete(asyncHandler(handleDeleteCoverImage));

router
    .route("/channel/:username")
    .get(asyncHandler(handleGetUserChannelProfile));

router.route("/history").get(asyncHandler(handleWatchHistory));

router.route("/channel-stats").get(asyncHandler(handleGetChannelStats));

router
    .route("/delete-from-history/:videoId")
    .delete(asyncHandler(handleDeleteFromHistory));

router.route("/subscribers").get(asyncHandler(handleGetSubscribers));

router.route("/subscriptions").get(asyncHandler(handleGetSubscription));

router.route("/delete-account").delete(asyncHandler(handleDeleteUserAccount));

export default router;
