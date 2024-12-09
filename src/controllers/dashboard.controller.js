import mongoose from "mongoose"
import { Video } from "../models/video.model.js"
import { Subscription } from "../models/subscription.model.js"
import { Like } from "../models/like.model.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import asyncHandler  from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

    const totalLikesTotalViewsTotalVideos = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $addFields: {
                likesCount: {
                    $size: "$likes"
                }
            }
        },
        {
            $group: {
                _id: null,
                totalVideos: {
                    $sum: 1
                },
                totalViews: {
                    $sum: "$views"
                }
            }
        },

    ])

    const totalSubscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1,
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                subscriberCount: {
                    $size: "$subscriber"
                },
            }
        }
    ])

    if (!totalLikesTotalViewsTotalVideos?.length) {
        throw new ApiError(404, "No videos found")
    }
    if (!totalSubscribers?.length) {
        throw new ApiError(404, "No subscribers found")
    }

    res.status(200).json(new ApiResponse(200, "Channel stats", { totalLikesTotalViewsTotalVideos, totalSubscribers} ))
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const totalVideos = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from:"likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $addFields: {
                likesCount: {
                    $size: "$likes"
                }
            }
        },
        {
            $project: {
                title: 1,
                createdAt: 1,
                thumbnail: 1,
                owner: 1,
                isPublished: 1,
                likesCount: 1
            }

        }
    ])

    if (!totalVideos?.length) {
        throw new ApiError(404, "No videos found")
    }

    res.status(200).json(new ApiResponse(200, "Videos found", totalVideos))
})

export {
    getChannelStats,
    getChannelVideos
}