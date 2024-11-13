import mongoose, { Mongoose } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";



const createComment = asyncHandler(async (req, res) => {
    const user = req?.user
    if (!user) {
        return res
            .status(401)
            .json(new ApiResponse(401, {}, 'User not logged in'))
    }
    const comment = req?.body?.comment
    // console.log(req.body)
    if (!comment) {
        console.log("Comment not availabe at CreateComment.")
        return res
            .status(404)
            .json(new ApiResponse(404, {}, "Comment section is empty"))
    }
    const { videoid } = req?.params
    if (!videoid) {
        console.log("Video not available at CreateComment")
        return res
            .status(404)
            .json(new ApiResponse(404, {}, "Invalid request.Please insert Video details"))
    }
    const videoObjectID = new mongoose.Types.ObjectId(videoid)
    try {
        const CommentedVideo = await Video.findById(videoObjectID)
        if (!CommentedVideo) {
            console.log("Video not available at CreateComment")
            return res
                .status(404)
                .json(new ApiResponse(404, {}, "Video not available"))
        }

        let CommentAtDatabase = await Comment.create({ content: comment, owner: user, video: CommentedVideo })
        if (!CommentAtDatabase) {
            console.log("Internal Server Error at createComment")
            return res
                .status(500)
                .json(new ApiResponse(500, {}, "Internal Server error"))
        }
        CommentAtDatabase = { ...CommentAtDatabase._doc, owner: [{ ...user._doc }], editable: true, video: videoObjectID }

        // console.log(CommentAtDatabase)
        return res
            .status(200)
            .json(new ApiResponse(200, CommentAtDatabase, "Comment Created successfully!!"))
    } catch (error) {
        console.log(error)
        return res.status(500).json(500, {}, "Internal Server error")
    }
})

const updateComment = asyncHandler(async (req, res) => {
    const user = req?.user
    if (!user) {
        return res
            .status(401)
            .json(new ApiResponse(401, {}, 'User not logged in'))
    }
    const updatedComment = req?.body?.comment
    if (!updatedComment) {
        return res
            .status(404)
            .json(new ApiResponse(404, {}, "Empty comment box"))
    }
    const comment_id = new mongoose.Types.ObjectId(req?.params?.commentid)
    if (!comment_id) {
        return res
            .status(404)
            .json(new ApiResponse(404, {}, "Invalid comment id"))
    }
    const user_id = user?._id
    try {
        const targetComment = await Comment.findById(comment_id)
        if (!targetComment) {
            return res
                .status(402)
                .json(new ApiResponse(400, {}, "Comment not found"))
        }
        const userID = new mongoose.Types.ObjectId(user_id)
        if (!userID.equals(targetComment?.owner)) {
            return res
                .status(400)
                .json(new ApiResponse(400, {}, "Unauthorised access"))
        }
        const update = await Comment.findByIdAndUpdate({ _id: comment_id }, { $set: { content: updatedComment } }, { new: true })
        if (!update) {
            return res
                .status(500)
                .json(new ApiResponse(500, {}, "Internal Server error"))
        }
        return res
            .status(200)
            .json(new ApiResponse(200, update, "Comment Successfully Updated"))
    } catch (error) {
        console.log(error)
        return res
            .status(500)
            .json(new ApiResponse(500, {}, "Internal Server error"))
    }
})
const DeleteComment = asyncHandler(async (req, res) => {
    const user = req?.user
    if (!user) {
        return res
            .status(401)
            .json(new ApiResponse(401, {}, 'User not logged in'))
    }
    const comment_id = req?.params?.commentid
    if (!comment_id) {
        return res
            .status(402)
            .json(new ApiResponse(402, {}, "Invalid Request"))
    }
    const commmentObjecId = new mongoose.Types.ObjectId(comment_id)

    try {
        const comment = await Comment.findById(commmentObjecId)
        const userObjectid = new mongoose.Types.ObjectId(user?._id)
        if (!userObjectid.equals(comment?.owner)) {
            return res
                .status(400)
                .json(new ApiResponse(400, {}, "Unauthorised Access"))
        }
        const deleteStatus = await Comment.deleteOne({ _id: commmentObjecId })
        if (!deleteStatus) {
            return res
                .status(500)
                .json(new ApiResponse(500, {}, "Internal Server Error"))
        }
        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Comment Successfully Deleted"))
    } catch (error) {
        console.log(error)
        return res
            .status(500)
            .json(new ApiResponse(500, {}, "Internal Server Error"))
    }
})
const GetAllComment = asyncHandler(async (req, res) => {
    try {
        const { videoid } = req?.params
        if (!videoid)
            return res
                .status(404)
                .json(new ApiResponse(404, {}, "Invalid request"))
        const videoID = new mongoose.Types.ObjectId(videoid)
        const { userLoggedIn } = req
        if (!userLoggedIn) {
            const CommentOnVideo = await Comment.aggregate().match({ video: videoID }).lookup({
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }).addFields({
                editable: false
            })
            if (!CommentOnVideo) {
                return res
                    .status(500)
                    .json(new ApiResponse(500, {}, "Internal Server error"))
            }
            return res
                .status(200)
                .json(new ApiResponse(200, CommentOnVideo, "Comment Fetched successfully"))
        }
        const userID = req?.user?._id
        // console.log(userID)
        if (!userID) {
            return res
                .status(500)
                .json(new ApiResponse(500, {}, "Something went wrong"))
        }
        const CommentOnVideo = await Comment.aggregate().match({ video: videoID }).lookup({
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "owner"
        }).addFields({
            editable: {
                $cond: {
                    if: { $eq: [{ $arrayElemAt: ["$owner._id", 0] }, userID] },
                    then: true,
                    else: false
                }
            }
        }).sort({ editable: -1 })
            .exec();
        if (!CommentOnVideo) {
            return res
                .status(500)
                .json(new ApiResponse(500, {}, "Internal Server error"))
        }
        return res
            .status(200)
            .json(new ApiResponse(200, CommentOnVideo, "Comment Fetched successfully"))
    } catch (error) {
        console.log(error)
        return res
            .status(500)
            .json(new ApiResponse(500, {}, "Internal Server error"))
    }
})
export { createComment, updateComment, DeleteComment, GetAllComment }