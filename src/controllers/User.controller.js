import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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
    console.log("email",username)
    // if(fullname==""){
    //     throw new ApiError(400,"fullname is required")
    // }
    if (
        [fullname, email, username, password].some((field) =>
            field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required");
    }
    const existedUser =await User.findOne({
        $or: [{ username }, { email }]
    })
    if (existedUser) {
        throw new ApiError(409, "User with email or username already exist");
    }
    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }
    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.to_LowerCase()
    })
    const createdUser = await User.findById(user.__id).select(
        "-password -refreshToken"
    )
    if (!createdUser) {
        throw new ApiError(500, "Something went Wrong while registering a user")
    }
    return res.status(201).json(
        new ApiResponse(200, createdUser, "USer registered successfully")
    )
})

export { registerUser }