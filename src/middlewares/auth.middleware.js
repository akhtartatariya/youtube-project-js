import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
export const verifyUser = asyncHandler(async (req, _, next) => {
    const accessToken = req.cookies?.accessToken || req.headers['authorization']?.split(' ')[1]

    if (!accessToken) {
        throw new ApiError(401, "Unauthorized User");
    }

    const decodedToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET)

    if (!decodedToken) {
        throw new ApiError(401, "unauthorized access token");
    }
    const user = await User.findById(decodedToken._id).select("-password -refreshToken")

    if (!user) {
        throw new ApiError(404, "User not found");
    }
    req.user = user
    next()
})