import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId, isLiked } = req.params
    //TODO: toggle like on video

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoID")
    }


    const AlreadyLiked = await Like.findOne({ video: videoId, likeBy: req.user._id })
    // const AreadyLiked = await Like.aggreagate([  //but give value if matches
    //     {
    //         $match: {
    //             video: videoId,
    //             user: userId,
    //         }
    //     }
    // ])

    if (!AlreadyLiked && isLiked) {
        const addedLike = await Like.create({
            video: videoId,
            likeBy: req.user._id,
            isLike: isLiked,
        })

        return res.status(200).json(
            new ApiResponse(200, { reaction: true, isLike: true })  //reaction=true for storing value isLike=true for likes means ThumsUp
        )
    }
    else if (!AlreadyLiked && !isLiked) {
        const addedLike = await Like.create({
            video: videoId,
            likeBy: req.user._id,
            isLike: isLiked,
        })

        return res.status(200).json(
            new ApiResponse(200, { reaction: true, isLike: false }) //'reaction=true' for storing value 'isLike=false' for dislike means ThumsDown
        )
    }
    else {
        const deletedLike = Like.findByIdAndDelete({ _id: AlreadyLiked._id });

        return res.status(200).json(
            new ApiResponse(200, { reaction: false })  //reaction=false for delete like or dislike
        )
    }

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId, isLiked } = req.params
    //TODO: toggle like on comment

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid commentId")
    }

    if (req.user?._id) {
        throw new ApiError(400, "unathorized person")
    }


    const AlreadyLiked = await Like.findOne({ comment: commentId, likeBy: req.user?._id })


    if (!AlreadyLiked && isLiked) {
        const addedLike = await Like.create({
            comment: commentId,
            likeBy: req.user._id,
            isLike: isLiked,
        })

        return res.status(200).json(
            new ApiResponse(200, { reaction: true, isLike: true })  //reaction=true for storing value isLike=true for likes means ThumsUp
        )
    }
    else if (!AlreadyLiked && !isLiked) {
        const addedLike = await Like.create({
            comment: commentId,
            likeBy: req.user._id,
            isLike: isLiked,
        })

        return res.status(200).json(
            new ApiResponse(200, { reaction: true, isLike: false }) //'reaction=true' for storing value 'isLike=false' for dislike means ThumsDown
        )
    }
    else {
        const deletedLike = Like.findByIdAndDelete({ _id: AlreadyLiked._id });

        return res.status(200).json(
            new ApiResponse(200, { reaction: false })  //store=false for delete like or dislike
        )
    }

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId, isLiked } = req.params
    //TODO: toggle like on tweet


    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid tweetId")
    }

    if (req.user?._id) {
        throw new ApiError(400, "unathorized person")
    }

    const AlreadyLiked = await Like.findOne({ tweet: tweetId, likeBy: req.user?._id })

    if (!AlreadyLiked && isLiked) {
        const addedLike = await Like.create({
            tweet: tweetId,
            likeBy: req.user._id,
            isLike: isLiked,
        })

        return res.status(200).json(
            new ApiResponse(200, { reaction: true, isLike: true })  //reaction=true for storing value isLike=true for likes means ThumsUp
        )
    }
    else if (!AlreadyLiked && !isLiked) {
        const addedLike = await Like.create({
            tweet: tweetId,
            likeBy: req.user._id,
            isLike: isLiked,
        })

        return res.status(200).json(
            new ApiResponse(200, { reaction: true, isLike: false }) //'reaction=true' for storing value 'isLike=false' for dislike means ThumsDown
        )
    }
    else {
        const deletedLike = Like.findByIdAndDelete({ _id: AlreadyLiked._id });

        return res.status(200).json(
            new ApiResponse(200, { reaction: false })  //reaction=false for delete like or dislike
        )
    }
})

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos

    const allLikedVideo = await Like.find({
        likeBy: req.user?._id,                // Matches documents where the `likeBy` field equals `UserId`
        video: { $exists: true }  // Ensures `video` exists
    });

    if (allLikedVideo) {
        return res.status(200).json(
            new ApiResponse(200, allLikedVideo, 'All liked Video')
        )
    }
    else { }




    // db.collection.aggregate([
    //     {
    //         $match: {
    //             "like": UserId,           // Matches documents where the `like` field equals `UserId`
    //             "fieldName": { $exists: true }  // Ensures `fieldName` exists
    //         }
    //     }
    // ]);





})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}