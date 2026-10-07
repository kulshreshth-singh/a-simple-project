import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    /**
     *                 req.user._id
                     │
                     ▼
             Find channel videos
                     │
                     ▼
              ┌──────┴──────┐
              │             │
              ▼             ▼
        videos.length    videos.map()
              │             │
              ▼             ▼
        totalVideos     videoIds
                            │
                            ▼
                       Like + $in
                            │
                            ▼
                       totalLikes


        videos
           │
           ▼
       reduce()
           │
           ▼
       totalViews


        req.user._id
           │
           ▼
    Subscription
           │
           ▼
   countDocuments()
           │
           ▼
 totalSubscribers
     */

    // Get all videos owned by the currently logged-in channel
    const videos = await Video.find({ owner: req.user._id }).select("_id views");

    // Extract only the video IDs so we can find likes belonging to these videos
    const videoIds = videos.map(video => video._id);

    // Count total videos uploaded by the channel
    const totalVideos = videos.length;

    // Add the views of all videos together
    const totalViews = videos.reduce(
        (total, video) => total + video.views,
        0
    );

    // Count total subscribers of the channel
    const totalSubscribers = await Subscription.countDocuments({
        channel: req.user._id
    });

    // Count all likes received by the channel's videos
    const totalLikes = await Like.countDocuments({
        video: { $in: videoIds }
    });


    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    totalViews,
                    totalSubscribers,
                    totalVideos,
                    totalLikes
                },
                "Channel stats fetched successfully"
            )
        );
});

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const allVideo = await Video.find({owner : req.user._id})

    return res
    .status(200)
    .json(new ApiResponse(200 , allVideo , "fetched all video successfully"))
})

export {
    getChannelStats, 
    getChannelVideos
    }