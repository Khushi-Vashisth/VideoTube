import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

const app = express();

dotenv.config();
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    Credential: true,
  })
);

//MONGODB CONNECTION
const connectDB = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGO_URL);
    console.log(
      `\n MongoDB connected !! DB Host : ${connection.connection.host}`
    );
    app.listen(process.env.PORT || 8000, () => {
      console.log(` ⚙️ Server running at port : -- ${process.env.PORT}`);
    });
  } catch (error) {
    console.log("\n MONGODB CONNECTION ERROR !!!!", error);
    process.exit(0);
  }
};

app.use(express.json({ limit: "16kb" }));
app.use(express.static("public"));

connectDB();

//Import Routes
import userRouter from "./src/routes/user.route.js";

//Declaration of Routes
app.use("/api/v1", userRouter);
