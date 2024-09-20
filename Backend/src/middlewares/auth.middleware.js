import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { AsyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const verifyJWT = AsyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
    console.log("cookies : ", req.cookies);
    console.log("token", token);

    if (!token) throw new ApiError(401, "Unauthorized request");

    const verifying = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    console.log("verifying", verifying);

    const user = User.findById(verifying?._id);
    console.log(user);
    if (!user) throw new ApiError(401, "Invalid access token");

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error || "something went wrong when verifying");
  }
});
