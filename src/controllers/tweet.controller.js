import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import { User } from "../models/user.model.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { content } = req.body
    if (!content?.trim()) {
        throw new ApiError(400, "Content is required")
    }
    const tweet = await Tweet.create({
        content,
        owner: req.user?._id
    })

    if (!tweet) {
        throw new ApiError(500, "Failed to create tweet")
    }

    res.status(201).json(new ApiResponse(201, "Tweet created", tweet))
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const { userId } = req.params

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user id")
    }
    const userTweets = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
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
                owner: {
                    $arrayElemAt: ["$owner", 0]
                }
            }
        },
    ])

    if (!userTweets?.length) {
        throw new ApiError(400, "No tweets found")
    }

    res.status(200).json(new ApiResponse(200, "Tweets found", userTweets))

})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet

    const { tweetId } = req.params
    const { content } = req.body
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet id")
    }
    if (!content?.trim()) {
        throw new ApiError(400, "Content is required")
    }
    const owner = req.user?._id
    const findUser = await Tweet.findOne({ owner })
    if (!findUser) {
        throw new ApiError(404, "User not found or not permission allowed")
    }
    const updatedTweet = await Tweet.findOneAndUpdate({ _id: tweetId }, {
        content
    }, {
        new: true
    })

    if (!updatedTweet) {
        throw new ApiError(500, "Failed to update tweet")
    }

    res.status(200).json(new ApiResponse(200, "Tweet updated", updatedTweet))

})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet

    const { tweetId } = req.params
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet id")
    }
    const owner = req.user?._id
    const findUser = await Tweet.findOne({ owner })
    if (!findUser) {
        throw new ApiError(404, "User not found or not permission allowed")
    }
    const deletedTweet = await Tweet.findOneAndDelete({ _id: tweetId, owner })
    if (!deletedTweet) {
        throw new ApiError(500, "Failed to delete tweet")
    }

    res.status(200).json(new ApiResponse(200, "Tweet deleted",{}))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}