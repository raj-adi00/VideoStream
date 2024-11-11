import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const GetallMyvideo = asyncHandler(async (req, res) => {
    const { userLoggedIn, user } = req;
    if (userLoggedIn == false || !user) {
        return res.status(404).json(new ApiResponse(404, {}, "You are not authorized to access"));
    }

    const userid = new mongoose.Types.ObjectId(user?._id);
    if (!userid) {
        return res.status(404).json(new ApiResponse(404, {}, "You are not authorized to access"));
    }

    try {
        const myVideo = await Video.find({ owner: userid })
            .select("_id video_public_id thumbnail title createdAt");

        if (myVideo.length === 0) {
            return res.status(200).json(new ApiResponse(200, [], "No video found."));
        }

        return res.status(200).json(new ApiResponse(200, myVideo, "Personalized videos fetched successfully"));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new ApiResponse(500, {}, "Internal server error"));
    }
});
export default GetallMyvideo