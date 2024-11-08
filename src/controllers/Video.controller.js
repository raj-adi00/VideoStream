import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import fs from "fs"
import { serialize } from "v8";
import { User } from "../models/user.model.js";
import { title } from "process";
import sendMail from "../utils/SendMail.js";


const PublsihVideo = asyncHandler(async (req, res) => {
    const user = req?.user;
    const description = req?.body?.description;
    const title = req?.body?.title;
    const { isPublished } = req?.body;

    // Convert isPublished to a boolean explicitly
    const isPublishedValue = isPublished === 'true' ? true : false;

    console.log('Received isPublished:', isPublished);
    console.log('Processed isPublishedValue:', isPublishedValue);

    if (!user) {
        console.log("User Not Signed in to upload video");
        return res
            .status(400)
            .json(new ApiResponse(400, {}, "Unauthorised Access"));
    }

    if (!title || !description) {
        console.log(title, description);
        console.log("All fields are required");
        return res
            .status(400)
            .json(new ApiResponse(400, {}, "All fields are required"));
    }

    let VideoLocalPath;
    if (req.files && Array.isArray(req.files.video) && req.files.video.length > 0) {
        VideoLocalPath = req.files.video[0].path;
    }

    let thumbnailLocalPath;
    if (req.files && Array.isArray(req.files.thumbnail) && req.files.thumbnail.length > 0) {
        thumbnailLocalPath = req.files.thumbnail[0].path;
    }

    if (!VideoLocalPath) {
        if (thumbnailLocalPath) {
            fs.unlinkSync(thumbnailLocalPath);
        }
        console.log("Video is required");
        return res
            .status(400)
            .json(new ApiResponse(400, {}, "Video is required"));
    }

    if (!thumbnailLocalPath) {
        if (VideoLocalPath) {
            fs.unlinkSync(VideoLocalPath);
        }
        console.log("Thumbnail is required");
        return res
            .status(400)
            .json(new ApiResponse(400, {}, "Thumbnail is required"));
    }

    const VideoUpload = await uploadOnCloudinary(VideoLocalPath);
    const videoFile = VideoUpload?.url;
    const duration = VideoUpload?.duration;
    const video_public_id = VideoUpload?.public_id;

    if (!videoFile || !duration || !video_public_id) {
        console.log("Error while uploading video on Cloudinary");
        return res
            .status(500)
            .json(new ApiResponse(500, {}, "Error while uploading video on cloudinary"));
    }

    const uploadthumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    const thumbnail = uploadthumbnail.url;
    const thumbnail_public_id = uploadthumbnail?.public_id;

    if (!thumbnail || !thumbnail_public_id) {
        console.log("Error while uploading thumbnail on Cloudinary");
        return res
            .status(500)
            .json(new ApiResponse(500, {}, "Error while uploading Thumbnail on cloudinary"));
    }

    const owner = user;
    const uploadedVideo = await Video.create({
        owner,
        description,
        title,
        videoFile,
        thumbnail,
        duration,
        thumbnail_public_id,
        video_public_id,
        isPublished: isPublishedValue // Use the processed boolean value
    });

    if (!uploadedVideo) {
        await deleteFromCloudinary(thumbnail);
        await deleteFromCloudinary(videoFile);
        console.log("Error while creating documents in MongoDB");
        return res
            .status(500)
            .json(new ApiResponse(500, {}, "Internal error while uploading video details"));
    }
    const to = user.email
    const subject = 'Video uploaded on video Stream'
    const text = `Dear ${user.fullname}, You have uploaded video ${uploadedVideo?.title} on Videostream. Thank You for using Our website`
    sendMail(subject, text, to)
    return res
        .status(200)
        .json(new ApiResponse(200, uploadedVideo, "Video uploaded successfully"));

});



const getAllVideo = asyncHandler(async (req, res) => {
    const lastId = req.query.searchAfter;
    const limit = 10;
    let { isPublished } = req.query
    const userid = new mongoose.Types.ObjectId(req.query.username)
    const totalDocument = await Video.countDocuments({});
    const totalPage = Math.ceil(totalDocument / limit);

    // console.log(req.query)
    isPublished = isPublished === 'true'
    // console.log(typeof isPublished, isPublished)
    let matchStage
    if (isPublished)
        matchStage = lastId
            ? {
                // _id: { $gt: new mongoose.Types.ObjectId(lastId) }, 
                isPublished: isPublished
            }
            : { isPublished: isPublished };
    else
        matchStage = lastId
            ? {
                // _id: { $gt: new mongoose.Types.ObjectId(lastId) },
                $or: [{ owner: userid }, { isPublished: true }]
            }
            : {
                $or: [{ owner: userid }, { isPublished: true }]
            };


    // console.log(await Video.findOne({ $or: [{ owner: userid }, { isPublished: true }] }))
    let allvideos = await Video.aggregate([
        { $match: matchStage },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "channel_owner"
            }
        },
        // { $limit: limit },
        {
            $project: {
                videoFile: 1,
                thumbnail: 1,
                title: 1,
                description: 1,
                duration: 1,
                views: 1,
                isPublished: 1,
                owner: 1,
                video_public_id: 1,
                thumbnail_public_id: 1,
                createdAt: 1,
                updatedAt: 1,
                "channel_owner.fullname": { $arrayElemAt: ["$channel_owner.fullname", 0] },
                "channel_owner.email": { $arrayElemAt: ["$channel_owner.email", 0] },
                "channel_owner.avatar": { $arrayElemAt: ["$channel_owner.avatar", 0] },
                "channel_owner.username": { $arrayElemAt: ["$channel_owner.username", 0] },
            }
        }
    ]);
    allvideos = allvideos.slice((lastId - 1) * limit, lastId * limit);
    // console.log("videos fetched succesfully")
    // console.log(allvideos)
    if (allvideos) {
        const searchAfter = allvideos.length > 0 ? allvideos[allvideos.length - 1]._id : null;
        if (searchAfter)
            return res
                .status(200)
                .json(new ApiResponse(200, { videos: allvideos, searchAfter, totalPage }, "Videos fetched successfully"));
        else
            return res
                .status(201)
                .json(new ApiResponse(200, {}, "No more Videos Found"))
    } else {
        return res
            .status(500)
            .json(new ApiResponse(500, {}, "Internal Error while fetching the Videos"))
    }
});

const getVideoById = asyncHandler(async (req, res) => {
    const videoid = req?.params?.videoid;

    // Validate if videoid is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(videoid)) {
        return res
            .status(400)
            .json(new ApiResponse(400, {}, "Invalid video id"));
    }

    // Find the video by its id
    const currentVideo = await Video.findById(videoid);
    if (!currentVideo) {
        return res
            .status(400)
            .json(new ApiResponse(400, {}, "No such videoId exists"));
    }

    // Find the owner of the video
    const owner = await User.findById(currentVideo.owner).select("-password -watchHistory -refreshToken");
    if (!owner) {
        return res
            .status(500)
            .json(new ApiResponse(500, {}, "Something went wrong while fetching the owner details"));
    }

    // Successfully return the video and its owner
    return res
        .status(200)
        .json(new ApiResponse(200, { currentVideo, owner }, "Video retrieved successfully"));
});

const getVideoDetaisbyVideo_public_id = asyncHandler(async (req, res) => {
    const { video_public_id } = req?.params;

    // Validate if video_public_id is provided
    if (!video_public_id) {
        return res.status(400).json(new ApiResponse(400, {}, "Invalid video Public ID"));
    }

    // Find the video by video_public_id
    const video = await Video.aggregate([
        {
            $match: { video_public_id }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'owner',
                foreignField: '_id',
                as: 'video_owner'
            }
        },
        {
            $project: {
                owner: 1,
                video_owner: 1,
                createdAt: 1,
                title: 1,
                description: 1,
                isPublished: 1
            }
        }
    ]);

    // Check if the video exists
    if (!video || video.length === 0) {
        return res.status(400).json(new ApiResponse(400, {}, "No such video found"));
    }

    // Successfully found the video, return the details
    return res.status(200).json(new ApiResponse(200, video[0], "Video successfully found"));
});

const deleteVideo = asyncHandler(async (req, res) => {
    const user = req?.user;

    // Check if user is authenticated
    if (!user) {
        return res
            .status(400)
            .json(new ApiResponse(400, {}, "Unauthorized access!! Please login"));
    }

    // Validate video ID
    const videoid = req?.params?.videoid;
    if (!mongoose.Types.ObjectId.isValid(videoid)) {
        return res
            .status(400)
            .json(new ApiResponse(400, {}, "Invalid video ID"));
    }

    // Find the video by its ID
    const currentVideo = await Video.findById(videoid);
    if (!currentVideo) {
        return res
            .status(404)
            .json(new ApiResponse(404, {}, "Video not found"));
    }

    // Check if the authenticated user owns the video
    if (!user._id.equals(currentVideo.owner)) {
        return res
            .status(403)
            .json(new ApiResponse(403, {}, "Unauthorized access"));
    }

    // Delete the video
    const deleteResult = await Video.deleteOne({ _id: videoid });
    if (deleteResult.deletedCount === 0) {
        return res
            .status(500)
            .json(new ApiResponse(500, {}, "Couldn't delete video. Please try again"));
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Video deleted successfully"));
});


const updateVideoDetails = asyncHandler(async (req, res) => {
    const user = req?.user;
    let { title, description } = req.body;

    // Check if user is authenticated
    if (!user) {
        return res.status(400).json(new ApiResponse(400, {}, "Unauthorized Access"));
    }

    // Extract video ID from the request parameters
    const videoid = req?.params?.videoid;

    // Check if the video ID is valid
    if (!mongoose.Types.ObjectId.isValid(videoid)) {
        return res.status(400).json(new ApiResponse(400, {}, "Invalid video ID"));
    }

    // Find the current video
    const currentVideo = await Video.findById(videoid);
    if (!currentVideo) {
        return res.status(404).json(new ApiResponse(404, {}, "Video not found"));
    }

    // Check if the current user is the owner of the video
    if (!currentVideo.owner.equals(user._id)) {
        return res.status(403).json(new ApiResponse(403, {}, "Only the video owner can update details"));
    }

    // Ensure that at least one value (title or description) is provided for the update
    if (!title && !description) {
        return res.status(400).json(new ApiResponse(400, {}, "Please provide at least one value to update"));
    }

    // If title or description is not provided, keep the old values
    title = title || currentVideo.title;
    description = description || currentVideo.description;

    // Perform the update
    const updatedDetails = await Video.findByIdAndUpdate(
        videoid,
        { $set: { title, description } },
        { new: true } // Return the updated document
    );

    // Check if the update was successful
    if (!updatedDetails) {
        return res.status(500).json(new ApiResponse(500, {}, "Something went wrong while updating details"));
    }

    // Respond with success
    return res.status(200).json(new ApiResponse(200, updatedDetails, "Details updated successfully"));
});


const togglePublishStatus = asyncHandler(async (req, res) => {
    const user = req?.user;
    if (!user) {
        throw new ApiError(400, "Unauthorised Access")
    }
    const videoid = new mongoose.Types.ObjectId(req?.params?.videoid);
    const currentVideo = await Video.findById(videoid);
    if (!currentVideo.owner.equals(user._id)) {
        throw new ApiError(400, "Only video owner can updae details")
    }
    const updateVideoDetails = await Video.findByIdAndUpdate(videoid,
        {
            $set: {
                isPublished: !(currentVideo.isPublished)
            }
        }, { new: true })
    if (!updateVideoDetails)
        throw new ApiError(500, "Something went wrong while updating publish status")
    return res
        .status(200)
        .json(new ApiResponse(200, updateVideoDetails, "Publish status updated successfully"))
})

export { PublsihVideo, getAllVideo, getVideoById, deleteVideo, updateVideoDetails, togglePublishStatus, getVideoDetaisbyVideo_public_id }