import mongoose, { Schema } from "mongoose";

const FriendSchema = new mongoose.Schema({
  users: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

export const Friend = mongoose.model("Friend", FriendSchema);