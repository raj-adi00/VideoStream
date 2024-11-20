import mongoose from "mongoose";
import { Friend } from "../models/Friends.model.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Message } from "../models/message.model.js";

const GetAllNonFriendUsers = asyncHandler(async (req, res) => {
  const { user } = req;
  if (!user) {
    return res
      .status(401)
      .json(new ApiResponse(401, {}, "Unauthorized access"));
  }

  try {
    const userid = new mongoose.Types.ObjectId(user._id);

    const allUsers = await User.find().select(
      "-password -watchHistory -coverImage -refreshToken -createdAt -updatedAt",
    );

    if (!allUsers || allUsers.length === 0) {
      return res.status(204).json(new ApiResponse(204, {}, "No users found"));
    }

    const friends = await Friend.find({ users: userid }).select("users");

    // console.log(friends)
    const friendIds = friends.flatMap((friend) =>
      friend.users.filter((id) => id.toString() !== user._id.toString()),
    );

    // console.log(friendIds);

    const nonFriends = allUsers.filter(
      (otherUser) =>
        !friendIds
          .map((id) => id.toString())
          .includes(otherUser._id.toString()) &&
        otherUser._id.toString() !== user._id.toString(),
    );

    if (!nonFriends || nonFriends.length === 0) {
      return res
        .status(204)
        .json(new ApiResponse(204, {}, "No users available to add as friends"));
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, nonFriends, "Users available to add as friends"),
      );
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server error"));
  }
});

const AddFreinds = asyncHandler(async (req, res) => {
  const { user } = req;
  const { newFriendId } = req.query;
  if (!user) {
    return res
      .status(401)
      .json(new ApiResponse(401, {}, "Unauthorized access"));
  }

  if (!newFriendId || !mongoose.Types.ObjectId.isValid(newFriendId)) {
    return res.status(400).json(new ApiResponse(400, {}, "Invalid friend ID"));
  }

  try {
    const userid = new mongoose.Types.ObjectId(user._id);
    const newFriendObjectId = new mongoose.Types.ObjectId(newFriendId);

    if (userid.equals(newFriendObjectId)) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "You cannot add yourself as a friend"));
    }

    const existingFriendship = await Friend.findOne({
      users: { $all: [userid, newFriendObjectId] },
    });

    if (existingFriendship) {
      return res
        .status(409)
        .json(new ApiResponse(409, {}, "Friendship already exists"));
    }

    const element = { users: [userid, newFriendObjectId] };
    const FriendAdd = await Friend.create(element);
    if (!FriendAdd)
      return res
        .status(500)
        .json(new ApiResponse(500, {}, "Internal Server error"));
    return res
      .status(200)
      .json(new ApiResponse(200, element, "Friend SuccessFully Added"));
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server error"));
  }
});

const GetAllUserChat = asyncHandler(async (req, res) => {
  const { user } = req;

  if (!user) {
    return res
      .status(401)
      .json(new ApiResponse(401, {}, "Unauthorized access"));
  }

  const userId = new mongoose.Types.ObjectId(user._id);

  try {
    const chats = await Friend.aggregate([
      {
        $match: { users: userId },
      },
      {
        $unwind: "$users",
      },
      {
        $match: { users: { $ne: userId } },
      },
      {
        $lookup: {
          from: "users",
          localField: "users",
          foreignField: "_id",
          as: "friendDetails",
        },
      },
      {
        $unwind: "$friendDetails",
      },
      {
        $lookup: {
          from: "messages",
          let: { friendId: "$users", currentUserId: userId },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    {
                      $and: [
                        { $eq: ["$senderId", "$$currentUserId"] },
                        { $eq: ["$receiverId", "$$friendId"] },
                      ],
                    },
                    {
                      $and: [
                        { $eq: ["$senderId", "$$friendId"] },
                        { $eq: ["$receiverId", "$$currentUserId"] },
                      ],
                    },
                  ],
                },
              },
            },
            { $sort: { createdAt: 1 } },
          ],
          as: "messages",
        },
      },
      {
        $project: {
          _id: 0,
          friendId: "$friendDetails._id",
          friendName: "$friendDetails.fullname",
          friendEmail: "$friendDetails.email",
          freindAvatar: "$friendDetails.avatar",
          messages: 1,
        },
      },
    ]);
    if (!chats)
      return res
        .status(500)
        .json(new ApiResponse(500, {}, "Internal server error"));
    return res
      .status(200)
      .json(new ApiResponse(200, chats, "Chats fetched successfully"));
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal server error"));
  }
});

const saveMessage = asyncHandler(async (req, res) => {
  const { user } = req;
  const { message, receiverId } = req.query;

  if (!user)
    return res
      .status(401)
      .json(new ApiResponse(401, {}, "Unauthorized access"));

  const senderId = user._id;

  if (!receiverId)
    return res
      .status(400)
      .json(new ApiResponse(400, {}, "Receiver ID is required"));

  if (!mongoose.Types.ObjectId.isValid(receiverId))
    return res
      .status(400)
      .json(new ApiResponse(400, {}, "Invalid receiver ID"));

  const receiverObjectId = new mongoose.Types.ObjectId(receiverId);

  if (!message || message.trim() === "")
    return res
      .status(405)
      .json(new ApiResponse(405, {}, "Message cannot be empty"));

  try {
    const messageResponse = await Message.create({
      senderId,
      receiverId: receiverObjectId,
      message: message.trim(),
    });

    if (!messageResponse)
      return res
        .status(500)
        .json(new ApiResponse(500, {}, "Internal Server error"));

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { messageId: messageResponse._id },
          "Message sent successfully",
        ),
      );
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server error"));
  }
});


export { GetAllNonFriendUsers, AddFreinds, GetAllUserChat, saveMessage };
