import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { deleteToCloudinary, uploadToCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken"
const generateRefreshAndAccessToken = async function (userId) {
    try {
        const user = await User.findOne(userId);
        if (!user) {
            throw new ApiError(404, "User not found")
        }
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })
        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, error.message || "Error generating refresh token")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    // TODO:
    // 1. get the data from user
    // 2. check user exist or not
    // 3.if not then we get the upload files
    // 4. then upload on server
    // 5. if successfully upload then we upload on cloudinary
    // 6.if successfully upload on cloudinary then we store the data in database
    // 7. send the response

    const { fullName, username, email, password } = req.body

    if ([fullName, username, email, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required")
    }
    const existedUser = await User.findOne(
        {
            $or: [{ username }, { email }]
        }
    )
    if (existedUser) {
        throw new ApiError(400, "User already exists")
    }

    const avatarLP = req.files['avatar'][0].path
    let coverImageLP;
    if (req.files && req.files['coverImage'] && req.files['coverImage'].length > 0) {
        coverImageLP = req.files['coverImage'][0].path
    }
    if (!avatarLP) {
        throw new ApiError(404, "Avatar not found")
    }
    const avatar = await uploadToCloudinary(avatarLP)
    if (!avatar) {
        throw new ApiError(500, "Unable to upload avatar")
    }
    let coverImage;
    if (coverImageLP) {
        coverImage = await uploadToCloudinary(coverImageLP)
        if (!coverImage) {
            throw new ApiError(500, "Unable to upload cover image")
        }
    }

    const createdUser = await User.create({
        fullName,
        username,
        email,
        password,
        avatar: avatar.url,
        coverImage: coverImage ? coverImage.url : ""
    })
    if (!createdUser) {
        throw new ApiError(500, "Unable to create user")
    }
    const user = await User.findById(createdUser._id).select("-password -refreshToken")
    if (!user) {
        throw new ApiError(404, "Unable to find user")
    }
    res.status(201).json(new ApiResponse(201, "User created successfully", user))
})

const loginUser = asyncHandler(async (req, res) => {
    // TODO:
    // 1. get the data
    // 2. check user already exists or not 
    // 3. generate access refresh token
    // 4. send cookie  
    const { username, email, password } = req.body

    if (!(username || email)) {
        throw new ApiError(400, " username or email is required")
    }
    if (!password) {
        throw new ApiError(400, " password is required")
    }

    const findUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (!findUser) {
        throw new ApiError(404, "User not found")
    }
    const isMatchPassword = await findUser.comparePassword(password)
    if (!isMatchPassword) {
        throw new ApiError(400, "Invalid credentials")
    }

    const { accessToken, refreshToken } = await generateRefreshAndAccessToken(findUser._id)

    const loggedInUser = await User.findById(findUser._id).select("-password -refreshToken")
    if (!loggedInUser) {
        throw new ApiError(500, " Unable to logged user")
    }
    const options = {
        httpOnly: true,
        secure: true
    }

    res.status(201).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options).json(new ApiResponse(201, "User logged in successfully", { user: loggedInUser, accessToken, refreshToken }))
})

const logoutUser = asyncHandler(async (req, res) => {
    const user = await User.findByIdAndUpdate(req.user?._id, {
        $unset: {
            refreshToken: 1
        }
    }, {
        new: true
    })
    if (!user) {
        throw new ApiError(500, "Unable to logout user")
    }
    const options = {
        httpOnly: true,
        secure: true
    }
    res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken", options).json(new ApiResponse(200, "User logged out successfully", {}))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized user")
    }
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

    if (!decodedToken) {
        throw new ApiError(401, "User not authenticated ")
    }

    const user = await User.findOne({ _id: decodedToken._id })

    if (!user) {
        throw new ApiError(404, "User not found")
    }
    if (user.refreshToken !== incomingRefreshToken) {
        throw new ApiError(401, "token is not valid or expired")
    }

    const { accessToken, refreshToken } = await generateRefreshAndAccessToken(user._id)

    if (!accessToken) {
        throw new ApiError(500, "Unable to generate access token")
    }
    const options = {
        httpOnly: true,
        secure: true
    }
    res.status(200).cookie('accessToken', accessToken, options).cookie('refreshToken', refreshToken, options).json(new ApiResponse(200, "Access token refreshed successfully", { authenticated: true }))
})

const getCurrentUser = asyncHandler(async (req, res) => {
    res.status(200).json(new ApiResponse(200, "user found successfully", req.user))
})

const changePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body

    if (!(oldPassword && newPassword)) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findById(req.user._id)
    if (!user) {
        throw new ApiError(404, "User not found")
    }
    const isCorrect = await user.comparePassword(oldPassword)
    if (!isCorrect) {
        throw new ApiError(400, "Incorrect credentials")
    }
    user.password = newPassword
    await user.save({ validateBeforeSave: false })
    res.status(200).json(new ApiResponse(200, "Password changed successfully", { success: true }))
})

const updateUserDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body

    if (!(fullName && email)) {
        throw new ApiError(400, "All fields are required")
    }
    const user = await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            fullName,
            email
        }
    }, {
        new: true
    }).select("-password -refreshToken")

    if (!user) {
        throw new ApiError(404, "User not found")
    }

    res.status(200).json(new ApiResponse(200, "User details updated successfully", user))
})

const updateAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }
    const user = await User.findById(req.user._id)
    if (!user) {
        throw new ApiError(404, "User not found")
    }
    const avatar = await uploadToCloudinary(avatarLocalPath)
    if (!avatar) {
        throw new ApiError(500, "unable to upload avatar")
    }
    console.log(" match ")
    const newUser = await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            avatar: avatar.url
        }
    }, {
        new: true
    }).select("-password -refreshToken")
    if (!newUser) {
        throw new ApiError(404, "User not found")
    }
    console.log(" old img", user.avatar)
    if (user.avatar) {

        const pattern = /\/v\d+\/([^\/]+)\./;
        const match = user.avatar.match(pattern);
        if (!match) {
            throw new ApiError(500, "unable to match avatar url")
        }
        const deleteOldAvatar = await deleteToCloudinary(match[1])
        if (!deleteOldAvatar === "ok") {
            throw new ApiError(504, "unable to delete old avatar")
        }
    }
    res.status(200).json(new ApiResponse(200, "Avatar updated successfully", newUser))
})
const updateCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path
    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is required")
    }
    const user = await User.findById(req.user._id)
    if (!user) {
        throw new ApiError(404, "User not found")
    }
    const coverImage = await uploadToCloudinary(coverImageLocalPath)
    if (!coverImage) {
        throw new ApiError(500, "unable to upload cover image")
    }
    const newUser = await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            coverImage: coverImage.url
        }
    }, {
        new: true
    }).select("-password -refreshToken")
    if (!newUser) {
        throw new ApiError(404, "User not found")
    }
    console.log(" old img", user.coverImage)
    if (user.coverImage !== "" || user.coverImage !== undefined) {
        const pattern = /\/v\d+\/([^\/]+)\./;
        const match = user.coverImage.match(pattern);
        if (!match) {
            throw new ApiError(500, "unable to match cover image url")
        }
        const deleteOldCoverImage = await deleteToCloudinary(match[1])
        if (!deleteOldCoverImage === "ok") {
            throw new ApiError(504, "unable to delete old cover image")
        }
    }
    res.status(200).json(new ApiResponse(200, "Cover image updated successfully", newUser))
})

const getUserProfile = asyncHandler(async (req, res) => {
    const { username } = req.params
    if (!username?.trim()) {
        throw new ApiError(400, "channel is required")
    }
    const channel = await User.aggregate([
        {
            $match: {
                username
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscriber"
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
                subscriberCount: {
                    $size: "$subscriber"
                },
                subscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user._id, "$subscriber.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                email: 1,
                avatar: 1,
                coverImage: 1,
                subscriberCount: 1,
                subscribedToCount: 1,
                isSubscribed: 1,
            }
        }
    ])

    if (!channel?.length) {
        throw new ApiError(404, "channel not found")
    }
    res.status(200)
        .json(new ApiResponse(200, "channel found successfully", channel[0]))
})

const getWatchHistory = asyncHandler(async (req, res) => {
    const watchHistory = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user?._id)
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
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        },

                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])
    if (!watchHistory?.length) {
        throw new ApiError(404, "watch history not found")
    }
    res.status(200).json(new ApiResponse(200, "watch history found successfully", watchHistory[0].watchHistory))
})
export { registerUser, loginUser, logoutUser, refreshAccessToken, getCurrentUser, changePassword, updateUserDetails, updateAvatar, updateCoverImage, getUserProfile, getWatchHistory }