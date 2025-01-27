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
    const pipeline = []


    if (query) {
        pipeline.push(
            {
                $search: {
                    index: "default", // Replace "default" with your actual text index name if it's custom.
                    text: {
                        query: query, // The text search query
                        path: ["title", "description"] // The field to search on; replace with the actual field name
                    }
                }
            },
            {
                $addFields: {
                    score: { $meta: "searchScore" } // Add the relevance score to the documents
                }
            },
            {
                $sort: {
                    score: -1 // Sort by the relevance score in descending order
                }
            });
    }


    if (userId) {

        if (!isValidObjectId(userId)) {
            throw new ApiError(400, "Invalid UserID")
        }
        pipeline.push({
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        })
    }

    pipeline.push({ $match: { isPublished: true } });

    if (sortBy && sortType) {
        pipeline.push({
            $sort: {
                [sortBy]: sortType === "asc" ? 1 : -1
            }
        })
    }

    pipiline.push(
        {
            $lookup: {
                from: "users",
                foreignField: "_id",
                localField: "owner",
                as: "ownerDetails",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            "avatar.url": 1
                        }
                    }
                ]
            },
        },
        { $unwind: "$ownerDetails" }
    )

    const videoAggregate = await Video.aggregate(pipeline);

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    };

    const video = await Video.aggregatePaginate(videoAggregate, options);

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Videos fetched successfully"));
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
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid VideoId")
    }


    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "video",
                as: "comment"
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
                        $lookup: {
                            from: "subscriptions",
                            localField: "_id",
                            foreignField: "channel",
                            as: "subscribers",
                        }

                    },
                    {
                        $addFields: {
                            subscribeCount: { $size: "$subscribers" },
                            isSubscribed: {
                                $cond: {
                                    if: { $in: [req.user?._id, "subscribers._id"] },   // {$in:[ObjectId('64aef22e573a3a27f8d14446'),{ $map: { input: "$videos._id", as: "vid", in: "$$vid" } }]}
                                    then: true,
                                    else: flase
                                }
                            }
                        }
                    },
                    {
                        $project: {
                            owner: 1,
                            subscribeCount: 1,
                            isSubscribed: 1


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
                as: "likes",
                pipeline: [{
                    $match: { isLike: true }
                }]
            }
        },
        {
            $addFields: {
                likedCount: { $size: "$likes" },
                isLiked: {
                    $cond: {
                        if: { $in: [req.user?._id, "likes.likeBy"] },   // {$in:[ObjectId('64aef22e573a3a27f8d14446'),{ $map: { input: "$videos._id", as: "vid", in: "$$vid" } }]}
                        then: true,
                        else: flase
                    }
                }
            }
        },
        {
            $project: {
                videoFile: 1,
                title: 1,
                description: 1,
                view: 1,
                createdAt: 1,
                duration: 1,
                owner: 1,
                subscribeCount: 1,
                isSubscribed: 1,
                comment: 1,
                likedCount: 1,
                isLiked: 1
            }
        }

    ])

    if (video) {
        new ApiError(404, "Not found")
    }


    const user = await User.findByIdAndUpdate(
        req.user?._id,
        { $addToSet: { watchHistory: videoId } },  // push will add duplicate value {$push:{watchHistory:vdeoId}}  and Addtoset will add unique value and both work with array(push and addtoset)
        { new: true }

    )

    await Video.findByIdAndUpdate(videoId, { $inc: { views: 1 } })

    console.log(user);



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

    return res
        .status(200)
        .json(
            new ApiResponse(200, video[0], "video details fetched successfully")
        );
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