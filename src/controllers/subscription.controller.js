import mongoose, { isValidObjectId } from "mongoose"
import { Subscription } from "../models/subscription.model.js"
import ApiError  from "../utils/ApiError.js"
import  ApiResponse  from "../utils/ApiResponse.js"
import asyncHandler  from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    // TODO: toggle subscription
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel id")
    }

    const isSubscribed = await Subscription.findOne({ channel: channelId, subscriber: req.user?._id })

    if (isSubscribed) {
        const deletedSubscription = await Subscription.findByIdAndDelete(isSubscribed._id)
        if (!deletedSubscription) {
            throw new ApiError(500, "Failed to delete subscription")
        }
        res.status(200).json(new ApiResponse(200, "User unsubscribed", { }))
    }
    else {
        const newSubscription = await Subscription.create({
            channel: channelId,
            subscriber: req.user?._id
        })
        if (!newSubscription) {
            throw new ApiError(500, "Failed to create subscription")
        }
        res.status(201).json(new ApiResponse(201, "User subscribed", newSubscription))
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel id")
    }
    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
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
                subscriberCount:{
                    $size: "$subscriber"
                }
            }
        }
        
        
    ])
    if (!subscribers) {
        throw new ApiError(404, "No subscribers found")
    }

    res.status(200).json(new ApiResponse(200, "Subscribers found", subscribers))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriber id")
    }
    const subscribers = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "subscribedTo",
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
                subscribedToCount:{
                    $size: "$subscribedTo"
                }
            }
        }
    ])
    if (!subscribers?.length) {
        throw new ApiError(404, "No subscribed channels found")
    }

    res.status(200).json(new ApiResponse(200, "Subscribed channels found", subscribers))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}