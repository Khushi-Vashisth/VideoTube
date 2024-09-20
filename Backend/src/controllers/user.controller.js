import { AsyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";

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

export { registerUser, loginUser, logOutUser };
