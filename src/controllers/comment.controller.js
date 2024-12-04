import mongoose, { isValidObjectId } from "mongoose"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Video id is required")
    }

    const getVideoComments = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        {
            $addFields: {
                owner: {
                    $first: "$owner.username"
                }
            }
        },
    ])

    if (!getVideoComments) {
        throw new ApiError(400, "Video comments not found")
    }
    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { createdAt: -1 }
    }
    const commentsResults = await Comment.aggregatePaginate(getVideoComments, options)
    res.status(200).json(new ApiResponse(200, "Video comments fetched", commentsResults))
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { videoId } = req.params
    const { content } = req.body

    if (!content) {
        throw new ApiError(400, "Comment content is required")
    }
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Video id is required")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(400, "Video not found")
    }
    const comment = await Comment.create({
        content,
        owner: req.user._id,
        video: video._id
    })

    if (!comment) {
        throw new ApiError(500, "Comment not created")
    }
    res.status(201).json(new ApiResponse(201, "Comment created", comment))
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const { commentId } = req.params
    const { content } = req.body

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Comment id is required")
    }
    if (!content) {
        throw new ApiError(400, "Comment content is required")
    }
    const comment = await Comment.findOneAndUpdate({ _id: commentId, owner: req.user?._id }, {
        content
    }, {
        new: true
    })

    if (!comment) {
        throw new ApiError(404, "Comment not found or you do not have permission to update this comment")
    }
    res.status(200).json(new ApiResponse(200, "Comment updated", comment))
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Comment id is required")
    }
    const deleteComment = await Comment.findOneAndDelete({ _id: commentId, owner: req.user?._id })
    if (!deleteComment) {
        throw new ApiError(404, "Comment not found or you do not have permission to delete this comment")
    }
    res.status(200).json(new ApiResponse(200, "Comment deleted", { status: true }))
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}