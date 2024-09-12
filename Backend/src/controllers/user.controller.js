import { AsyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const registerUser = AsyncHandler(async (req, res) => {
  // Get user details
  const { fullName, password, username, email } = req.body;
  console.log("Email : ", email);

  // check that fields must be NON-EMPTY
  if ([fullName, username, password, email].some((i) => i?.trim() === ""))
    return res.status(400).json("All fields are required");

  // check if User already
  const alreadyExistUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (alreadyExistUser) return res.status(400).json("User already exists");

  //get images or avatar
  const avatarLocalPath = await req.files?.avatar[0].path;
  console.log("Avatar file local path : ", avatarLocalPath);
  const coverImageLocalPath = await req.files?.coverImage[0].path;
  if (!avatarLocalPath) return res.status(400).json("Avatar file is required");

  // upload files on cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) return res.status(400).json("Avatar is required");

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
    return res.status(500).json("Something went wrong while registering user");

  //final response
  return res.status(200).json(`Created user : ${iscreated}`);
});

export { registerUser };
