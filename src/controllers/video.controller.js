import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.models.js"
import { User } from "../models/user.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    // TODO: get video, upload to cloudinary, create video
    // console.log(title, description);

    const userId = req.user._id

    if (!userId) {
        throw new ApiError(401, "Unauthorized person")
    }
    // console.log(userId);


    if (
        [title, description].some((field) => field.trim() === "")
    ) { throw new ApiError(400, "Title and Description both are required") }

    const videoFileLocalPath = req.files?.videoFile[0]?.path

    if (!videoFileLocalPath) {
        throw new ApiError(400, "Video is required")
    }

    const thumbnailLocalPath = req.files?.thumbnail[0]?.path
    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail is required")
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    // console.log(video);

    // console.log(videoFile);
    console.log(thumbnail);


    if (!videoFile) {
        throw new ApiError(400, "Video is required")
    }

    if (!thumbnail) {
        throw new ApiError(400, "Thumbnail is required")
    }

    const video = await Video.create({
        videoFile: {
            url: videoFile.url,
            public_id: videoFile.public_id
        },
        thumbnail: {
            url: thumbnail.url,
            public_id: thumbnail.public_id
        },
        description,
        title,
        owner: userId,
        duration: videoFile.duration
    })

    const videoUploaded = await Video.findById(video._id);

    if (!videoUploaded) {
        throw new ApiError(500, "video upload fialed plaese try again!!")
    }
    // console.log(video);
    return res.status(200).json(
        new ApiResponse(200, video, "Video uplaoded successfully")
    )
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    const isVideo = isValidObjectId(videoId)

    if (!isVideo) {
        throw new ApiError(400, "Invalid Videoid")
    }


    const videoFile = await Video.findById(videoId);

    res.status(200).json(videoFile)

    // "videoFile.url": 1,
    // title: 1,
    // description: 1,
    // views: 1,
    // createdAt: 1,
    // duration: 1,
    // comments: 1,
    // owner: 1,
    // likesCount: 1,
    // isLiked: 1


})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    const isVideo = isValidObjectId(videoId)

    if (!isVideo) {
        throw new ApiError(400, "Video id is required")
    }

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    const isVideo = isValidObjectId(videoId)

    if (!isVideo) {
        throw new ApiError(400, "Video id is required")
    }

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const isVideo = isValidObjectId(videoId)
    // const isVideo = isValidObjectId(videoId)

    if (!isVideo) {
        throw new ApiError(400, "Video id is required")
    }

})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}