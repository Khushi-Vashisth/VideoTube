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

const connectDB = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGO_URL);
    console.log(
      `\n MongoDB connected !! DB Host : ${connection.connection.host}`
    );
    app.listen(process.env.PORT || 8000, () => {
      console.log(` ^.^ Server running at port : -- ${process.env.PORT}`);
    });
  } catch (error) {
    console.log("\n MONGODB CONNECTION ERROR !!!!", error);
    process.exit(0);
  }
};

connectDB();
