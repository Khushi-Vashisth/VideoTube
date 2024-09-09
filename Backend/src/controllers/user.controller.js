import { AsyncHandler } from "../utils/asyncHandler.js";

const registerUser = AsyncHandler(async (req, res) => {
  res.status(200).json({
    message: "OK",
  });
});

export { registerUser };
