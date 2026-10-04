import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"
import { Comment } from "../models/comment.model.js"
import { Tweet } from "../models/tweet.model.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    // 1. Validate videoId
        // ↓
// 2. Find Video
        // ↓
// 3. If not found → 404
        // ↓
// 4. Find existing Like for this user + video
        // ↓
// 5. Like exists → delete
//    Like doesn't exist → create
        // ↓
// 6. Send response
    const {videoId} = req.params
    //TODO: toggle like on video

    if(!isValidObjectId(videoId)){
        throw new ApiError(400 ,"video id is not valid");
    }
    const video = await Video.findById(videoId);

    if (!video) {
    throw new ApiError(404, "video not found");
    }

    const likingVideo = await Like.findOne({
        video : videoId,
        likedBy : req.user._id
    })
     
     let toggled;
     let liked;

    if (likingVideo) {
    // delete
    toggled = await likingVideo.deleteOne();
    liked = false;
    
    } else {
    // create
    toggled = await Like.create({
         video : videoId,
         likedBy : req.user._id
    })
    liked = true;
    }

    let message ;
    if(liked){
        message = "video liked successfully"
    }else{
        message = "video unliked successfully"
    }

    return res
    .status(200)
    .json(new ApiResponse(200 , liked , message))


    
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    // validate commentId
    // check comment exist or not in comment schema 
    // serach liked comment in database
    // if liked --> delete like
    // if unliked -- > create it 
    // send response

    if(!isValidObjectId(commentId)){
        throw new ApiError(400 , "comment it is not valid")
    }

    const comment = await Comment.findById(commentId);
    if(!comment){
        throw new ApiError(404 , "comment not exist");
    }

    const likingComment = await Like.findOne({
        comment : commentId,
        likedBy : req.user._id
    })
    let liked;

    if(likingComment){
        const deleteLike = await likingComment.deleteOne();
        liked = false;
    }else{
        const createdLike = await Like.create({
              comment : commentId,
              likedBy : req.user._id
        });
        liked = true;
    }
    
    let message ;
    if(liked){
        message = "Comment liked successfully"
    }else{
        message = "Comment unliked successfully"
    }

    return res
    .status(200)
    .json(new ApiResponse(200 , liked , message))
    

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400 , "tweetId is not valid")
    }

    const tweets = await Tweet.findById(tweetId);
    if(!tweets){
        throw new ApiError(404 , "tweets not exist");
    }

    const likingtweet = await Like.findOne({
        tweet : tweetId,
        likedBy : req.user._id
    })
    let liked;

    if(likingtweet){
        const deleteLike = await likingtweet.deleteOne();
        liked = false;
    }else{
        const createdLike = await Like.create({
              tweet : tweetId,
              likedBy : req.user._id
        });
        liked = true;
    }
    
    let message ;
    if(liked){
        message = "tweet liked successfully"
    }else{
        message = "tweet unliked successfully"
    }

    return res
    .status(200)
    .json(new ApiResponse(200 , liked , message))
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
  // Find all likes made by the current user,
// select the video reference, and populate it with the actual Video document
const allVideo = await Like.find({
    likedBy: req.user._id
})
.select("video")
.populate("video");

   return res
   .status(200)
   .json(new ApiResponse(200 , allVideo , "successfully fetched all video like by user"))
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}