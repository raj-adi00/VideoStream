import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import fs from "fs"
import { serialize } from "v8";
import { User } from "../models/user.model.js";


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
    let { isPublished } = req.query
    const userid = new mongoose.Types.ObjectId(req.query.username)
    // console.log(req.query)
    isPublished = isPublished === 'true'
    console.log(typeof isPublished, isPublished)
    let matchStage
    if (isPublished)
        matchStage = lastId
            ? { _id: { $gt: new mongoose.Types.ObjectId(lastId) }, isPublished: isPublished }
            : { isPublished: isPublished };
    else
    matchStage = lastId
    ? { 
        _id: { $gt: new mongoose.Types.ObjectId(lastId) },
        $or: [{ owner: userid }, { isPublished: true }]
      }
    : { 
        $or: [{ owner: userid }, { isPublished: true }] 
      };


    console.log(await Video.findOne({$or:[{owner: userid},{isPublished:true}]}))
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
                "channel_owner.fullname": { $arrayElemAt: ["$channel_owner.fullname", 0] },
                "channel_owner.email": { $arrayElemAt: ["$channel_owner.email", 0] },
                "channel_owner.avatar": { $arrayElemAt: ["$channel_owner.avatar", 0] },
                "channel_owner.username": { $arrayElemAt: ["$channel_owner.username", 0] },
            }
        }
    ]);
    console.log("videos fetched succesfully")
    // console.log(allvideos)
    if (allvideos) {
        const searchAfter = allvideos.length > 0 ? allvideos[allvideos.length - 1]._id : null;
        if (searchAfter)
            return res
                .status(200)
                .json(new ApiResponse(200, { videos: allvideos, searchAfter }, "Videos fetched successfully"));
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
    const videoid = new mongoose.Types.ObjectId(req?.params?.videoid)
    if (!videoid) {
        throw new ApiError(400, "Invalid video id")
    }
    const currentVideo = await Video.findById(videoid);
    if (!currentVideo) {
        throw new ApiError(400, "No such videoId exist")
    }
    const owner = await User.findById(currentVideo.owner).select("-password -watchHistory -refreshToken")
    if (!owner) {
        throw new ApiError(500, "something went wrong")
    }
    return res
        .status(200)
        .json(new ApiResponse(200, { currentVideo, owner }, "Video got successfully"))
});

const deleteVideo = asyncHandler(async (req, res) => {
    const user = req?.user;
    if (!user) {
        throw new ApiError(400, "Unauthorised access!! Please Login")
    }
    const videoid = new mongoose.Types.ObjectId(req?.params?.videoid)
    if (!videoid) {
        throw new ApiError(500, "Something went Wrong")
    }
    const currentVideo = await Video.findById(videoid);
    if (!user._id.equals(currentVideo.owner)) {
        throw new ApiError(400, "Unauthorised access!!")
    }
    const deletevideo = await Video.deleteOne(videoid)
    if (!deletevideo) {
        throw new ApiError(500, "Couldn't delete Video please try again")
    }
    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Video deleted successfully"))
})

const updateVideoDetails = asyncHandler(async (req, res) => {
    const user = req?.user;
    let title = req.body.title;
    let description = req.body?.description
    if (!user) {
        throw new ApiError(400, "Unauthorised Access")
    }
    const videoid = new mongoose.Types.ObjectId(req?.params?.videoid);
    const currentVideo = await Video.findById(videoid);
    if (!currentVideo.owner.equals(user._id)) {
        throw new ApiError(400, "Only video owner can updae details")
    }
    // console.log(title)
    if (!title && !description) {
        throw new ApiError(400, "Please provide details")
    }
    if (!title)
        title = currentVideo.title
    if (!description)
        description = currentVideo.description
    const updatedDetails = await Video.findByIdAndUpdate(videoid, {
        $set: {
            title, description
        },
    }, { new: true }
    )
    if (!updatedDetails) {
        throw new ApiError(500, "Something went wreong while updating document")
    }
    return res.
        status(200)
        .json(new ApiResponse(200, updatedDetails, "Details updated successfully"))
})


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

export { PublsihVideo, getAllVideo, getVideoById, deleteVideo, updateVideoDetails, togglePublishStatus }