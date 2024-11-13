import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"; // Ensure JWT is imported

export const UserVerification = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

    // If there's no token, set userLoggedIn to false and proceed to next middleware
    if (!token) {
        req.userLoggedIn = false;
        return next();
    }

    try {
        // Verify token and extract user information
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        // Retrieve user from the database without sensitive fields
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

        // If user is not found, set userLoggedIn to false
        if (!user) {
            req.userLoggedIn = false;
            return next();
        }

        // If user is found, set userLoggedIn to true and add user data to request
        req.userLoggedIn = true;
        req.user = user;

        next();
    } catch (error) {
        // Handle errors from jwt verification or database operations
        if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
            req.userLoggedIn = false; // Token-related error, so set to false
        } else {
            console.error("Unexpected error in UserVerification middleware:", error);
        }
        next();
    }
});

