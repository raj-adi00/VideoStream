import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import fs from "fs"

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
    if (
        [fullname, email, username, password].some((field) =>
            field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required");
    }
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (existedUser) {
        throw new ApiError(409, "User with email or username already exist");
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
        throw new ApiError(400, "Avatar file is required")
    }
    // console.log(avatarLocalPath)
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!avatar) {
        fs.unlinkSync(avatarLocalPath)
        fs.unlinkSync(coverImageLocalPath)
        throw new ApiError(400, "Failed to upload Avatar file")
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
        throw new ApiError(500, "Something went Wrong while registering a user")
    }
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
        throw new ApiError(400, "Username or email is required")
    }
    const user = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (!user) {
        throw new ApiError(404, "User doesn't exist")
    }
    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials")
    }
    const { accesToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

    const looggeInUser = await User.findById(user._id).select("-password -refreshToken")
    const options = {
        httpOnly: true,
        secure: true
    }
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
})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }
    return res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out successfully"))
})
export { registerUser, loginUser, logoutUser }