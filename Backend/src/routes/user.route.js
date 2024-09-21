import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  loginUser,
  logOutUser,
  refreshAccessToken,
  registerUser,
  changePassword,
  fetchCurrentUser,
  updateUserDetails,
  updateAvatarImage,
  updateCoverImage,
  getUserProfile,
  getWatchHistory,
} from "../controllers/user.controller.js";

const router = Router();

//register route with multer
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
  registerUser
);

//login route
router.route("/login").post(loginUser);

//logout
router.route("/logout").post(verifyJWT, logOutUser);

router.route("/refreshtoken").post(refreshAccessToken);

router.route("/changepassword").post(verifyJWT, changePassword);

router.route("/currentuser").get(verifyJWT, fetchCurrentUser);

router.route("/updatedetails").patch(verifyJWT, updateUserDetails);

router
  .route("/avatar")
  .patch(verifyJWT, upload.single("avatar"), updateAvatarImage);

router
  .route("/coverimage")
  .patch(verifyJWT, upload.single("coverImage"), updateCoverImage);

router.route("/profile/:username").get(verifyJWT, getUserProfile);

router.route("/history").get(verifyJWT, getWatchHistory);

export default router;
