import { Router } from "express";
import { changePassword, getCurrentUser, loginUser, logoutUser, refreshAccessToken, registerUser, updateAvatar, updateCoverImage, updateUserDetails } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyUser } from "../middlewares/auth.middleware.js";
const router = Router();

router.route("/register").post(upload.fields([{ name: "avatar", maxCount: 1 }, { name: "coverImage", maxCount: 1 }]), registerUser)
router.route("/login").post(loginUser)
router.route("/refresh-token").post(refreshAccessToken)
//Protected routes
router.route("/logout").get(verifyUser, logoutUser)
router.route("/get-user").get(verifyUser, getCurrentUser)
router.route("/change-password").post(verifyUser, changePassword)
router.route("/update-u-details").patch(verifyUser, updateUserDetails)
router.route("/update-avatar").patch(verifyUser, upload.single("avatar"), updateAvatar)
router.route("/update-cover-image").patch(verifyUser, upload.single("coverImage"),updateCoverImage)


export default router