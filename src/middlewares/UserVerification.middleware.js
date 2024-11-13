import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"; // Ensure JWT is imported

export const UserVerification = asyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        if (!token) {
            req.userLoggedIn = false;
            return next();
        }
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

        if (!user) {
            req.userLoggedIn = false;
            return res.status(500).json(new ApiResponse(500,{},"afh"));
            return next();
        }

       
        req.userLoggedIn = true;
        req.user = user;

        return next();

    } catch (error) {

        req.userLoggedIn = false;
        next();
    }
});
