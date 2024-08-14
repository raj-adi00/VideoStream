import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import fs from "fs"


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



export { PublsihVideo }