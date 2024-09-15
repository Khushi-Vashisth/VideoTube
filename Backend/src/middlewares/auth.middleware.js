import { User } from "../models/user.model";
import { ApiError } from "../utils/apiError";
import { AsyncHandler } from "../utils/asyncHandler";
import jwt from "jsonwebtoken";

export const verifyJWT = AsyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) throw new ApiError(401, "Unauthorized request");

    const verifying = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = User.findById(verifying?._id);

    if (!user) throw new ApiError(401, "Invalid access token");

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error || "something went wrong when verifying");
  }
});
