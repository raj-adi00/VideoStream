import mongoose from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const createTweet = asyncHandler(async (req, res) => {
    const owner = req?.user;
    const { content } = req?.body;

    console.log("Content:", content); // Log the content received

    if (!owner) {
        console.log("Unauthorised access");
        return res
            .status(401)
            .json(new ApiResponse(401, {}, "Unauthorised access"));
    }

    if (!content) {
        console.log("Empty content at CreateTweet");
        return res
            .status(403)
            .json(new ApiResponse(403, {}, "Content is required"));
    }

    try {
        const createdTweet = await Tweet.create({ content, owner });

        if (!createdTweet) {
            console.log("Tweet can't be created:", createdTweet);
            return res
                .status(500)
                .json(new ApiResponse(500, {}, "Failed to create the tweet. Internal server error"));
        }

        console.log("Tweet successfully created:", createdTweet);
        return res
            .status(200)
            .json(new ApiResponse(200, createdTweet, "Tweet successfully created"));
    } catch (error) {
        console.error("Error creating tweet:", error.message);
        return res
            .status(500)
            .json(new ApiResponse(500, {}, "Failed to create the tweet. Internal server error"));
    }
});

const getAllTweet = asyncHandler(async (req, res) => {
    try {
        const alltweets = await Tweet.find({})
        if (!alltweets) {
            console.log("error while fetching all the tweets")
            return res
                .status(500)
                .json(new ApiResponse(500, {}, "Internal Server error. cannot get tweets"))
        }
        // console.log(alltweets)
        return res
            .status(200)
            .json(new ApiResponse(200, alltweets, "Tweets fetched Successfully"))
    } catch (error) {
        console.log("error while fetching all the tweets", error)
        return res
            .status(500)
            .json(new ApiResponse(500, {}, "Internal Server error. cannot get tweets"))
    }
})

const updateTweet = asyncHandler(async (req, res) => {
    const user = req?.user;
    const { tweetid } = req.params;
    const { content } = req.body;

    if (!user) {
        console.log("User not logged in");
        return res
            .status(401)
            .json(new ApiResponse(401, {}, "Unauthorised Access"));
    }

    try {
        // Convert user._id to ObjectId
        const userId = new mongoose.Types.ObjectId(user._id);

        const tweet = await Tweet.findById(tweetid);
        // console.log(tweet)
        if (!tweet) {
            console.log("Tweet not found");
            return res
                .status(404) // Changed to 404 (Not Found) as it is more appropriate
                .json(new ApiResponse(404, {}, "No such Tweet exists"));
        }

        // Convert tweet.owner to ObjectId and compare
        const tweetOwnerId = new mongoose.Types.ObjectId(tweet.owner);
        if (!tweetOwnerId.equals(userId)) {
            console.log("Unauthorised access");
            return res
                .status(403) // Changed to 403 (Forbidden) for unauthorized access
                .json(new ApiResponse(403, {}, "Unauthorized access"));
        }

        const response = await Tweet.findByIdAndUpdate(tweetid, {
            $set: { content }
        }, { new: true });

        if (!response) {
            console.log("Error updating the tweet");
            return res
                .status(500)
                .json(new ApiResponse(500, {}, "Couldn't update the tweet"));
        }

        return res
            .status(200)
            .json(new ApiResponse(200, response, "Tweet updated successfully"));
    } catch (error) {
        console.log("Error while updating the tweet:", error);
        return res
            .status(500)
            .json(new ApiResponse(500, {}, "Something went wrong"));
    }
});

const deleteTweet = asyncHandler(async (req, res) => {
    const owner = req?.user;
    const { tweetid } = req.params;

    if (!owner) {
        console.log("User not logged in");
        return res
            .status(401)
            .json(new ApiResponse(401, {}, "Unauthorised Access"));
    }

    try {
        const targetTweet = await Tweet.findById(tweetid);
        if (!targetTweet) {
            console.log("No such tweet exists");
            return res
                .status(404) // More appropriate status code for not found
                .json(new ApiResponse(404, {}, "No such tweet exists"));
        }

        const tweetOwnerId =new mongoose.Types.ObjectId(targetTweet.owner);
        const userId =new mongoose.Types.ObjectId(owner._id);

        if (!userId.equals(tweetOwnerId)) {
            console.log("Unauthorized access");
            return res
                .status(403) // Changed to 403 for unauthorized access
                .json(new ApiResponse(403, {}, "Unauthorized access"));
        }

        const deleteResult = await Tweet.deleteOne({ _id: tweetid });

        if (deleteResult.deletedCount === 0) {
            console.log("Couldn't delete the tweet");
            return res
                .status(500)
                .json(new ApiResponse(500, {}, "Couldn't delete the tweet"));
        }
      
        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Tweet deleted successfully"));

    } catch (error) {
        console.log("Error while deleting the tweet:", error);
        return res
            .status(500)
            .json(new ApiResponse(500, {}, "Something went wrong"));
    }
});
export { createTweet, getAllTweet, updateTweet, deleteTweet }