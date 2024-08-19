import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import fs from "fs"
import { serialize } from "v8";


const PublsihVideo = asyncHandler(async (req, res) => {
    const user = req?.user;
    const description = req?.body?.description;
    const title = req?.body?.title;
    if (!user) {
        console.log("User Not Signed in to upload video")
        throw new ApiError(400, "Unauthorised access")
    }

    if (!title || !description) {
        console.log("All fields are required")
        throw new ApiError(400, "All fields are required")
    }
    let VideoLocalPath;
    // console.log(req.files)
    if (req.files && Array.isArray(req.files.video) && req.files.video.length > 0)
        VideoLocalPath = req.files.video[0].path;
    let thumbnailLocalPath;
    if (req.files && Array.isArray(req.files.thumbnail) && req.files.thumbnail.length > 0)
        thumbnailLocalPath = req.files.thumbnail[0].path;
    if (!VideoLocalPath) {
        if (thumbnailLocalPath)
            fs.unlinkSync(thumbnailLocalPath)
        console.log("Video is required")
        throw new ApiError(400, "Video is required")
    }
    if (!thumbnailLocalPath) {
        if (VideoLocalPath)
            fs.unlinkSync(VideoLocalPath)
        console.log("Thumbnail is required");
        throw new ApiError(400, "Thumbanail is required")
    }

    const VideoUpload = await uploadOnCloudinary(VideoLocalPath)
    const videoFile = VideoUpload?.url
    const duration = VideoUpload?.duration
    const video_public_id = VideoUpload?.public_id
    if ((!videoFile) || (!duration) || (!video_public_id)) {
        console.log("Error while uploading video on Cloudinary")
        throw new ApiError(500, "Error While uploading Video on Clodinary")
    }

    const uploadthumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    const thumbnail = uploadthumbnail.url
    const thumbnail_public_id = uploadthumbnail?.public_id
    if ((!thumbnail) || (!thumbnail_public_id)) {
        console.log("Error while uploading thumbnail on Cloudinary")
        throw new ApiError(500, "Error While uploading Thumbnail on Clodinary")
    }

    const owner = user
    const uploadedVideo = await Video.create({
        owner, description, title, videoFile, thumbnail, title, description, duration, owner, thumbnail_public_id, video_public_id
    })
    if (!uploadedVideo) {
        await deleteFromCloudinary(thumbnail)
        await deleteFromCloudinary(videoFile)
        console.log("error while creating documents in mongodb")
        throw new ApiError(500, "Interanal error while uploading video details")
    }
    else
        return res
            .status(200)
            .json(new ApiResponse(200, uploadedVideo, "Video uploaded successfully"))
})


const getAllVideo = asyncHandler(async (req, res) => {
    const lastId = req.query.searchAfter;  // The _id of the last document from the previous page, passed as a query parameter   GET /api/videos?searchAfter=lastDocumentId
    const limit = 10;

    const matchStage = lastId ? { _id: { $gt: new mongoose.Types.ObjectId(lastId) } } : {};
    const allvideos = await Video.aggregate([
        { $match: matchStage },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "channel_owner"
            }
        },
        { $limit: limit },
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
            }
        }
    ]);

    if (allvideos) {
        const searchAfter = allvideos.length > 0 ? allvideos[allvideos.length - 1]._id : null;
        if (searchAfter)
            res
                .status(200)
                .json(new ApiResponse(200, { videos: allvideos, searchAfter }, "Videos fetched successfully"));
        else
            throw new ApiError(400, "Not available")
    } else {
        throw new ApiError(500, "Error Fetching the videos");
    }
});





export { PublsihVideo, getAllVideo }