import { AsyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshToken = async (userID) => {
  try {
    const user = await User.findById(userID);
    if (!user) {
      throw new ApiError(404, "user not found");
    }
    const refreshToken = user.generateRefreshToken();
    const accessToken = user.generateAccessToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token"
    );
  }
};

const registerUser = AsyncHandler(async (req, res) => {
  // Get user details
  const { fullName, password, username, email } = req.body;
  console.log("Email : ", email);

  // check that fields must be NON-EMPTY
  if ([fullName, username, password, email].some((i) => i?.trim() === ""))
    throw new ApiError(400, "All fields are required");

  // check if User already
  const alreadyExistUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (alreadyExistUser) throw new ApiError(400, "user already exist");

  //get images or avatar
  const avatarLocalPath = await req.files?.avatar[0].path;
  console.log("Avatar file local path : ", avatarLocalPath);
  const coverImageLocalPath = await req.files?.coverImage[0].path;
  if (!avatarLocalPath) throw new ApiError(400, "Avatar is required");

  // upload files on cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) throw new ApiError(400, "Avatar file is required");

  // create entry in DB
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  // check (user created or not)
  const iscreated = await User.findById(user._id);
  if (!iscreated)
    throw new ApiError(400, "something went wrong while registering user");

  //final response
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered Successfully"));
});

const loginUser = AsyncHandler(async (req, res) => {
  //get data from user
  const { email, username, password } = req.body;

  //check for username or email
  if (!(username || email)) {
    throw new ApiError(400, "Username or Email is required");
  }
  //find on the basis of username or email
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  console.log(user);

  if (!user) {
    throw new ApiError(404, "user does not exist");
  }

  //check the password
  const isPasswordValid = user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "check password and try again");
  }

  //generate access and refresh token
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  //cookie
  const options = {
    httpOnly: true,
    secure: true,
  };

  //final response
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: accessToken,
          refreshToken,
        },

        "user logged In successfully"
      )
    );
});

const logOutUser = AsyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, {
    $set: {
      refreshToken: undefined,
    },
  });

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"));
});

const refreshAccessToken = AsyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) throw new ApiError(401, "invalid token");

    if (incomingRefreshToken !== user?.refreshToken)
      throw new ApiError(401, "refresh token invalid");

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newrefreshToken } =
      await generateAccessAndRefreshToken(user._id);
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newrefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newrefreshToken },
          "access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "invalid refresh token");
  }
});

const changePassword = AsyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) throw new ApiError(401, "Incorrect Password");

  user.password = newPassword;
  await user.save();

  return res.status(200).json(200, {}, "Password changed successfully");
});

const fetchCurrentUser = AsyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(200, req.user, "current user fetched successfully");
});

const updateUserDetails = AsyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  const user = User.findByIdAndUpdate(req.user?._id, {
    $set: { fullName, email },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "account details updated successfully"));
});

const updateAvatarImage = AsyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar.url) throw new ApiError(400, "Error while updating avatar");

  const user = User.findByIdAndUpdate(req.user._id, {
    $set: {
      avatar: avatar.url,
    },
  });
  return res
    .status(200)
    .json(new ApiResponse(200, user, "cover image updated"));
});

const updateCoverImage = AsyncHandler(async (req, res) => {
  const coverLocalPath = req.file?.path;
  const coverImage = await uploadOnCloudinary(coverLocalPath);
  if (!coverImage.url)
    throw new ApiError(400, "Error while updating cover image");

  const user = User.findByIdAndUpdate(req.user?._id, {
    $set: {
      coverImage: coverImage.url,
    },
  });
  return res
    .status(200)
    .json(new ApiResponse(200, user, "cover image updated"));
});

const getUserProfile = AsyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username) throw new ApiError(400, "username is missing");

  const profile = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase,
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscription",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        subscriptionsCount: {
          $size: "$subscription",
        },
        isSubscribed: {
          $cond: {
            if: {
              $in: [req.user?._id, "$subscribers.subscriber"],
            },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        subscriptionsCount: 1,
        subscribersCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
      },
    },
  ]);

  if (!profile?.length) {
    throw new ApiError(400, "channel does not exist");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, profile[0], "User profile fetched successfully")
    );
});

const getWatchHistory = AsyncHandler(async (req, res) => {
  const user = User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ]);
  return res
    .status(200)
    .json(new ApiResponse(200, user[0], "watch history fetched successfuly"));
});

export {
  registerUser,
  loginUser,
  logOutUser,
  refreshAccessToken,
  changePassword,
  updateUserDetails,
  fetchCurrentUser,
  updateAvatarImage,
  updateCoverImage,
  getUserProfile,
  getWatchHistory,
};
