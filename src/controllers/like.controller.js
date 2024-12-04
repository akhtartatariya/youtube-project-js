import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: toggle like on video
    // validate video id
    // check videoId in db
    // if have the document then delete it 
    // else create it

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }
    const isLiked = await Like.findOne({ video: videoId })
    if (isLiked) {
        const deletedLike = await Like.findByIdAndDelete(isLiked._id)
        if (!deletedLike) {
            throw new ApiError(500, "Failed to delete like")
        }
        res.status(200).json(new ApiResponse(200, "Like deleted", { status: true }))
    }
    else {
        const newLike = await Like.create({
            video: videoId,
            likedBy: req.user._id
        })
        if (!newLike) {
            throw new ApiError(500, "Failed to create like")
        }
        res.status(201).json(new ApiResponse(201, "Like created", { status: true, newLike }))
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    //TODO: toggle like on comment
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment id")
    }
    const isLiked = await Like.findOne({ comment: commentId })
    if (isLiked) {
        const deletedLike = await Like.findByIdAndDelete(isLiked._id)
        if (!deletedLike) {
            throw new ApiError(500, "Failed to delete like")
        }
        res.status(200).json(new ApiResponse(200, "Like deleted", { status: true }))
    }
    else {
        const newLike = await Like.create({
            comment: commentId,
            likedBy: req.user._id
        })
        if (!newLike) {
            throw new ApiError(500, "Failed to create like")
        }
        res.status(201).json(new ApiResponse(201, "Like created", { status: true, newLike }))
    }

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    //TODO: toggle like on tweet
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet id")
    }
    const isLiked = await Like.findOne({ tweet: tweetId })
    if (isLiked) {
        const deletedLike = await Like.findByIdAndDelete(isLiked._id)
        if (!deletedLike) {
            throw new ApiError(500, "Failed to delete like")
        }
        res.status(200).json(new ApiResponse(200, "Like deleted", { status: true }))
    }
    else {
        const newLike = await Like.create({
            tweet: tweetId,
            likedBy: req.user._id
        })
        if (!newLike) {
            throw new ApiError(500, "Failed to create like")
        }
        res.status(201).json(new ApiResponse(201, "Like created", { status: true, newLike }))
    }
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos

    const videos = await Like.findOne({ video: req.user._id }).populate("video")
    if (!videos?.length) {
        throw new ApiError(404, "No videos found")
    }

    res.status(200).json(new ApiResponse(200, "Videos found", videos))
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}