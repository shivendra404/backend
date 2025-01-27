import mongoose from "mongoose"
import { Video } from "../models/video.models.js"
import { Subscription } from "../models/subscription.models.js"
import { Like } from "../models/like.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const userId = req.user?._id;

    const totalSubscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $count: "subscribeCount"
        }
    ]);

    const totalvideos = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        }, 
        {
            $group: {
              _id: null,                   
              totalViews: { $sum: "$views" }, // Sums the "value" field
              totalVideo: { $sum: 1 }         // Counts the documents
            }
          }
    ]);
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
})

export {
    getChannelStats,
    getChannelVideos
}