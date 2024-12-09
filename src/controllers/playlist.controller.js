import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"

import { Video } from "../models/video.model.js"
const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body
    //TODO: create playlist
    if (!name || !description) {
        throw new ApiError(400, "All fields are required")
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user?._id
    })

    if (!playlist) {
        throw new ApiError(500, "Unable to create playlist")
    }

    res.status(201).json(new ApiResponse(201, "Playlist created successfully", playlist))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params
    //TODO: get user playlists

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user id")
    }

    const playlists = await Playlist.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
                pipeline: [
                    {
                        $project: {
                            thumbnail: 1,
                            views: 1,
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                totalVideos: {
                    $size: "$videos"
                },
                totalViews: {
                    $sum: "$videos.views"
                }
            }
        }


    ])

    if (!playlists) {
        throw new ApiError(404, "Playlists not found")
    }

    res.status(200).json(new ApiResponse(200, "User Playlists found", playlists))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    //TODO: get playlist by id

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist id")
    }

    const playlist = await Playlist.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
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
                    }
                ]
            }
        },

    ])

    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    res.status(200).json(new ApiResponse(200, "Playlist found", playlist))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    // TODO: add video to playlist

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist or video id")
    }

    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    if (playlist.videos.includes(videoId)) {
        throw new ApiError(400, "Video already exists in playlist")
    }
    const addVideo = await Playlist.findByIdAndUpdate(playlistId, {
        $addToSet: {
            videos: videoId
        }
    }, {
        new: true
    })

    if (!addVideo) {
        throw new ApiError(500, "Unable to add video to playlist")
    }

    res.status(200).json(new ApiResponse(200, "Video added to playlist", addVideo))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    // TODO: remove video from playlist

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist or video id")
    }

    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    if (!playlist.videos.includes(videoId)) {
        throw new ApiError(400, "Video not found in playlist")
    }

    const removeVideo = await Playlist.findByIdAndUpdate(playlistId, {
        $pull: {
            videos: videoId
        }
    }, {
        new: true
    })

    if (!removeVideo) {
        throw new ApiError(500, "Unable to remove video from playlist")
    }

    res.status(200).json(new ApiResponse(200, "Video removed from playlist successfully", removeVideo))

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    // TODO: delete playlist

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist id")
    }

    const playlist = await Playlist.findByIdAndDelete(playlistId)

    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    res.status(200).json(new ApiResponse(200, "Playlist deleted successfully", { status: true }))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body
    //TODO: update playlist

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist id")
    }
    if (!name || !description) {
        throw new ApiError(400, "Name and description are required")
    }

    const playlist = await Playlist.findByIdAndUpdate(playlistId, {
        name,
        description
    }, {
        new: true
    })

    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    res.status(200).json(new ApiResponse(200, "Playlist updated successfully", playlist))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}