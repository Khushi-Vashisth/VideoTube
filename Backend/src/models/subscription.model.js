import mongoose, { Schema } from "mongoose";
import { User } from "./user.model";

const subscriptionSchema = new Schema(
  {
    subscriber: {
      type: Schema.Types.ObjectId, //subscriber of a channel
      ref: "User",
    },
    channel: {
      type: Schema.Types.ObjectId, //our subscribed channels
      ref: "User",
    },
  },
  { timestamps: true }
);

export const subscription = mongoose.model("subscription", subscriptionSchema);
