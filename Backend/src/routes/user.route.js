import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  loginUser,
  logOutUser,
  refreshAccessToken,
  registerUser,
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

export default router;
