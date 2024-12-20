import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import fs, { watch } from "fs"
import jwt from "jsonwebtoken"
import mongoose, { mongo } from "mongoose";
import { json } from "express";
import sendMail from "../utils/SendMail.js";

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accesToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })
        return { accesToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh token");
    }
}
const registerUser = asyncHandler(async (req, res) => {
    //collect the data from frontend
    //validation-not empty
    //check if user already exist:username,email
    //check for images,chek for avataar
    //upload them on cloudinary,avatar
    //create user object-create entry in db
    //remove password and refresh token feed
    //check for user creation
    //display message


    //when data is sent through form or json it is in req.body
    //Remember sir used fullName
    const { fullname, email, username, password } = req.body
    // console.log("email",username)
    // if(fullname==""){
    //     throw new ApiError(400,"fullname is required")
    // }
    // console.log(req)
    if (!req.files || !Array.isArray(req.files.avatar || req.files.length == 0))
        return res
            .status(401)
            .json(new ApiResponse(401, {}, "All fields are required"))
    if (
        [fullname, email, username, password].some((field) =>
            field?.trim() === "")
    ) {
        return res
            .status(401)
            .json(new ApiResponse(401, {}, "All fields are required"))
    }
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (existedUser) {
        return res
            .status(409)
            .json(new ApiResponse(409, {}, "User with email or username already exist"))
        // throw new ApiError(409, "User with email or username already exist");
    }
    // const avatarLocalPath = req.files?.avatar[0]?.path
    let avatarLocalPath;
    if (req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0) {
        avatarLocalPath = req.files.avatar[0].path
    }
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    if (!avatarLocalPath) {
        fs.unlinkSync(coverImageLocalPath)
        return res
            .status(400)
            .json(new ApiResponse(400, {}, "Avatar field is required"))
    }
    // console.log(avatarLocalPath)
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!avatar) {
        fs.unlinkSync(avatarLocalPath)
        fs.unlinkSync(coverImageLocalPath)
        return res
            .status(500)
            .json(new ApiResponse(500, {}, "Failed to upload avatar file"))
    }
    // console.log(avatar)
    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })
    // console.log(user)
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if (!createdUser) {
        fs.unlinkSync(avatarLocalPath)
        fs.unlinkSync(coverImageLocalPath)
        return res
            .status(500)
            .json(new ApiResponse(500, {}, "Something went wrong while registering the user"))
    }
    const to = createdUser.email
    const subject = 'Account successfully created on video Stream'
    const text = `Dear ${createdUser.fullname}, You have been successfully registered on VideoStream. Thank You for using Our website`
    sendMail(subject, text, to)
    return res.status(201).json(
        new ApiResponse(200, createdUser, "USer registered successfully")
    )
})

const loginUser = asyncHandler(async (req, res) => {
    //collect data from frontend
    //check usrename or email
    //find the User
    //password check
    //generate accesstoeken and assign refresh token
    //send cookies

    const { username, email, password } = req.body

    if (!username && !email) {
        return res
            .status(400)
            .json(new ApiResponse(400, {}, "Username or email is required"))
    }
    if (!password) {
        return res
            .status(400)
            .json(new ApiResponse(400, {}, "Password is required"))
    }
    const user = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (!user) {
        return res
            .status(404)
            .json(new ApiResponse(404, {}, "User doesn't exist"))
    }
    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid) {
        return res
            .status(401)
            .json(new ApiResponse(401, {}, "Invalid user credentials"))
    }
    const { accesToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

    const looggeInUser = await User.findById(user._id).select("-password -refreshToken")
    const options = {
        httpOnly: true,
        secure: true,
        sameSite: 'None'
    }
    if (looggeInUser)
        return res.status(200).cookie("accessToken", accesToken, options).cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        user: looggeInUser, accesToken, refreshToken
                    },
                    "User logged In successfully"
                )
            )
    else
        return res
            .status(500)
            .json(new ApiResponse(500, {}, "SOmething went wrong"))
})

const logoutUser = asyncHandler(async (req, res) => {
    try {
        const response = await User.findByIdAndUpdate(
            req.user._id,
            {
                $unset: {
                    refreshToken: 1
                }
            },
            {
                new: true
            }
        )
        const options = {
            httpOnly: true,
            secure: true,
            sameSite: 'None'
        }
        if (response) {
            return res.status(200)
                .clearCookie("accessToken", options)
                .clearCookie("refreshToken", options)
                .json(new ApiResponse(200, {}, "User logged out successfully"))
        } else
            return res.
                status(500)
                .json(new ApiResponse(500, {}, "Something went wrong while logging out"))
    }
    catch (err) {
        return res
            .status(500)
            .json(new ApiResponse(500, {}, "Something went wrong while logging out user"))
    }

})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request")
    }
    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
        const user = await User.findById(decodedToken._id)
        if (!user) {
            throw new ApiError(401, "Invalid refresh Token")
        }
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }
        const options = {
            httpOnly: true,
            secure: true,
            sameSite: 'None'
        }
        const { accesToken, newrefreshToken } = await generateAccessAndRefreshToken(user._id)
        return res
            .status(200)
            .cookie("accessToken", accesToken, options)
            .cookie("refreshToken", newrefreshToken, options)
            .json(new ApiResponse(
                200,
                { accesToken, refreshToken: newrefreshToken },
                "Access token refreshed successfully"
            ))
    } catch (error) {
        throw new ApiError(401, error?.message ||
            "Invalid refresh Token"
        )
    }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }
    user.password = newPassword
    await user.save({ validateBeforeSave: false })
    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successsfully"))
})

const getCurrentUser = asyncHandler(async (req, res) => {
    if (!req.user) {
        throw new ApiError(400, "User not found")
    }
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "User logged in"))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullname, email } = req.body
    if (!fullname || !email) {
        throw new ApiError(400, "All fields are required")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname,
                email
            }
        },
        { new: true }).select("-password")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Account details updated successfully"))
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const oldAvatarurl = req.user.avatar
    const avatarLocalPath = req.file?.path
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if (!avatar.url) {
        throw new ApiError(500, "Error while uploading on avatar")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true }
    ).select("-password")
    await deleteFromCloudinary(oldAvatarurl)
    return res
        .status(200)
        .json(new ApiResponse(200, user, "Avatar updated successfully"))
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const oldCoverImageUrl = req.user.coverImage
    const coverImageLocalPath = req.file?.path
    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing")
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if (!coverImage.url) {
        throw new ApiError(500, "Error while uploading on coverImage")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        { new: true }
    ).select("-password")
    await deleteFromCloudinary(oldCoverImageUrl)
    return res
        .status(200)
        .json(new ApiResponse(200, user, "Cover Image updated successfully"))
})

const getUserChannelProfile = asyncHandler(async (req, res, next) => {
    const { username } = req.params
    if (!username?.trim()) {
        throw new ApiError(400, "username is missing")
    }
    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        }, {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelSubscribedToCound: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        }, {
            $project: {
                fullname: 1,
                username: 1,
                subscribersCount: 1,
                subscribedTo: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,
            }
        }
    ])
    if (!channel?.length) {
        return res.status(404).json(new ApiResponse(404, {}, "Channel doesn't exist"))
    }

    req.channel = channel[0]
    return next()
})

const getWatchHistory = asyncHandler(async (req, res) => {
    const { channel } = req
    const { userLoggedIn } = req
    const LoggedInUser = req.user
    const userid = channel._id
    let response = { channel }
    if (!userid.equals(LoggedInUser._id) || (!userLoggedIn))
        return res.status(200).json(new ApiResponse(200, response, "User channel fetched Successfully"))


    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(userid)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [{
                                $project: {
                                    fullname: 1,
                                    avatar: 1,
                                    username: 1
                                }
                            }, {
                                $addFields: {
                                    owner: {
                                        $first: "$owner"
                                    }
                                }
                            }
                            ]
                        }
                    }
                ]
            }
        }
    ])
    if (!user || user.length == 0)
        return res.status(200).json(new ApiResponse(200, response, "User channel fetched Successfully"))
    response = { ...response, watchHistory: user[0].watchHistory }
    return res.status(200).json(new ApiResponse(200, response, "User channel fetched Successfully"))
})

const updateWatchHistory = asyncHandler(async (req, res) => {
    let { videoid } = req.params
    if (!videoid)
        return res.status(400).json(new ApiResponse(400, {}, "Invalid Video id"))
    videoid = new mongoose.Types.ObjectId(videoid)
    if (!videoid)
        return res.status(400).json(new ApiResponse(400, {}, "Invalid Video id"))
    const { userLoggedIn } = req
    if (!userLoggedIn)
        return res.status(404).json(new ApiResponse(404, {}, "Unauthorised Access"))
    const { user } = req
    const history = user.watchHistory
    history.push(videoid)
    const userid = new mongoose.Types.ObjectId(user._id)
    try {
        const updateStatus = await User.findByIdAndUpdate(userid, {
            watchHistory: history
        }, { new: true })
        if (!updateStatus)
            return res.status(500).json(new ApiResponse(500, {}, "Something went wrong"))
        return res.status(200).json(new ApiResponse(200, updateStatus, "Successfully updated watch history"))
    } catch (error) {
        console.log(error)
        return res.status(500).json(new ApiResponse(500, {}, "Something went wrong"))
    }
})
export { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage, getUserChannelProfile, getWatchHistory, updateWatchHistory }