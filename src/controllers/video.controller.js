import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import { deleteToCloudinary, deleteVideoFromCloudinary, uploadToCloudinary } from "../utils/cloudinary.js"
import asyncHandler from "../utils/asyncHandler.js"
const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    const videos = await Video.aggregate([
        {
            $match: { 
                $or: [
                    { title: { $regex: query || "", $options: "i" } },
                    { description: { $regex: query || "", $options: "i" } },
                ]
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
                    $first: "$owner"
                }
            }
        }
    ])
        .sort({ [sortBy || "createdAt"]: sortType || "desc" })
        .skip((page - 1) * limit)
        .limit(limit)

    if (!videos?.length) {
        throw new ApiError(404, "No videos found")
    }
    if (isValidObjectId(userId)) {
        const user = await User.findById(userId)
        if (!user) {
            throw new ApiError(404, "User not found")
        }
        const userVideos = await Video.aggregate([
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
                        $first: "$owner"
                    }
                }
            }
        ])
        if (!userVideos?.length) {
            throw new ApiError(404, "No videos found")
        }
        videos.push(userVideos[0])
    }
    res.status(200).json(new ApiResponse(200, "Videos found", videos))
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    // TODO: get video, upload to cloudinary, create video

    if (!title || !description) {
        throw new ApiError(400, "Title and description are required")
    }

    const videoPath = req.files['videoFile'][0].path
    console.log(" video path is ", videoPath)
    const thumbnailPath = req.files['thumbnail'][0].path

    if (!videoPath || !thumbnailPath) {
        throw new ApiError(400, "Video and thumbnail are required")
    }

    const videoUrl = await uploadToCloudinary(videoPath)
    const thumbnailUrl = await uploadToCloudinary(thumbnailPath)

    if (!videoUrl) {
        throw new ApiError(500, "Failed to upload video")
    }

    if (!thumbnailUrl) {
        throw new ApiError(500, "Failed to upload thumbnail")
    }

    const video = await Video.create({
        videoFile: videoUrl?.url,
        thumbnail: thumbnailUrl?.url,
        owner: req.user?._id,
        title,
        description,
        duration: videoUrl?.duration,
        views: 0,
    })

    if (!video) {
        throw new ApiError(500, "Failed to create video")
    }

    res.status(201).json(new ApiResponse(201, "Video created", video))

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }

    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
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
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            },
        },
        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "video",
                as: "comments"
            }
        },
        {
            $addFields: {
                owner: {
                    $first: "$owner"
                },
                likesCount: {
                    $size: "$likes"
                },
                commentsCount: {
                    $size: "$comments"
                }
            }
        }
    ])

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    res.status(200).json(new ApiResponse(200, "Video found", video))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

    const { title, description } = req.body
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }

    if (!title || !description) {
        throw new ApiError(400, "All fields are required")
    }


    const thumbnailPath = req.file?.path

    if (!thumbnailPath) {
        throw new ApiError(400, "Thumbnail is required")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }
    const thumbnailUrl = await uploadToCloudinary(thumbnailPath)

    if (!thumbnailUrl) {
        throw new ApiError(500, "Failed to upload thumbnail")
    }
    if (video.thumbnail) {
        const pattern = /\/v\d+\/([^\/]+)\./;
        const match = video.thumbnail.match(pattern);
        if (!match) {
            throw new ApiError(500, "unable to match thumbnail url")
        }
        const deleteOldThumbnail = await deleteToCloudinary(match[1])
        if (!deleteOldThumbnail) {
            throw new ApiError(504, "unable to delete old thumbnail")
        }
    }

    const updatedVideo = await Video.findByIdAndUpdate(videoId, {
        $set: {
            title,
            description,
            thumbnail: thumbnailUrl?.url
        }
    }, {
        new: true
    })

    if (!updatedVideo) {
        throw new ApiError(500, "Failed to update video")
    }

    res.status(200).json(new ApiResponse(200, "Video updated successfully", updatedVideo))
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    if (video.thumbnail && video.videoFile) {

        const pattern = /\/v\d+\/([^\/]+)\./;
        const match = video.thumbnail.match(pattern);
        if (!match) {
            throw new ApiError(500, "unable to match thumbnail url")
        }

        const deleteThumbnail = await deleteToCloudinary(match[1])

        if (!deleteThumbnail === "ok") {
            throw new ApiError(504, "unable to delete thumbnail")
        }

        const pattern2 = /\/v\d+\/([^\/]+)\./;
        const match2 = video.videoFile.match(pattern2);

        if (!match2) {
            throw new ApiError(500, "unable to match video url")
        }

        const deleteVideo = await deleteVideoFromCloudinary(match2[1])
        console.log("deleteVideo", deleteVideo)
        if (!deleteVideo === "ok") {
            throw new ApiError(504, "unable to delete video")
        }
    }

    const deletedVideo = await Video.findByIdAndDelete(video)

    if (!deletedVideo) {
        throw new ApiError(500, "Failed to delete video")
    }

    res.status(200).json(new ApiResponse(200, "Video deleted successfully", { status: true }))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }
    const togglePublishStatus = await Video.findByIdAndUpdate(videoId, {
        $set: {
            isPublished: !video.isPublished
        }
    }, {
        new: true
    })

    if (!togglePublishStatus) {
        throw new ApiError(500, "Failed to toggle publish status")
    }

    res.status(200).json(new ApiResponse(200, "Publish status toggled successfully", togglePublishStatus))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}