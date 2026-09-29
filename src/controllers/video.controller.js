import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { validateHeaderValue } from "http"
import { v2 as cloudinary } from "cloudinary";


const getAllVideos = asyncHandler(async (req, res) => {
    // All request is in string
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination

    // convert into a number
    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    // const skip = (pageNumber - 1)*limitNumber;

    let matchStage = {};

    if(query){
        matchStage.title = {
                  //search
                    $regex: query,
                    // all case
                    $options: "i"
              
        }
    }

    if(userId){
    matchStage.owner = userId;
    }

    let sortStage = {};
    // sortBy = field name
    //    sortType = direction (1 ,-1)
    
   // Square brackets mean "use the value inside this variable"
    if(sortBy){
        sortStage[sortBy] = sortType;
    }

    

    // const allVideo = await Video.aggregate([
    // const allVideo = await Video.aggregatepagination([

    
    //     {
    //         $match : matchStage
    //     },
    //     {
    //         $sort : sortStage
    //     },
    //     // {
    //     //    // Don't return the first 20 documents in this query's result.
    //     //     $skip : skip
    //     // },
    //     // {
    //     //     // Return at most 10 documents.
    //     //     $limit : limitNumber
    //     // }

    // ])
    
   const pipeline = [
    {
        $match: matchStage
    },
    {
        $sort: sortStage
    }
   ];

   const options = {
    page: pageNumber,
    limit: limitNumber
    };

    const result = await Video.aggregatePaginate(
    Video.aggregate(pipeline),
    options
    );

    return res
    .status(200)
    .json(new ApiResponse(200 , result , "videos successfully paginate"))
     
    
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, discription} = req.body
    // TODO: get video, upload to cloudinary, create video
    const {videoFile , thumbnail} = req.files;
    

    if( !videoFile  || videoFile.length === 0 ){
        throw new ApiError( 400 , "vedioFile is empty");
        
    }
    if( !thumbnail  || thumbnail.length === 0){
        throw new ApiError( 400 , "thumbnail is empty");
        
    }


    const videoPath = await uploadOnCloudinary(videoFile[0].path)
    const thumbnailPath = await uploadOnCloudinary(thumbnail[0].path)

    if(!videoPath?.url){
        throw new ApiError(400 , "vedioPath is not found");
    }
    if(!thumbnailPath?.url){
        throw new ApiError(400 , "thumbnailPath is not found");
    }

    const createVideo = await Video.create({
        title,
        discription,
        thumbnail : thumbnailPath.url,
        videoFile : videoPath.url,
        owner : req.user?._id,
        isPublished : true

    })

    
    if(!createVideo){
        throw new ApiError(400 , "video is not published")
    }

    return res
    .status(201)
    .json(new ApiResponse(201 , createVideo , "video is published"))

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    //TODO: get video by id
    if(!isValidObjectId(videoId)){
    throw new ApiError(400 , "not correct videoId")
    }

    
    const videoOg = await Video.findById(videoId)
   
     if(!videoOg){

         throw new ApiError(404, "video not found")


        }

      
      
      return res
      .status(200)
      .json(new ApiResponse(200 , videoOg , "video found"))
     

})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, discription, thumbnail


//  Get videoId
//  Validate ObjectId
//  Get new title/description
//  Get thumbnail if provided
//  Find the video
//  Check that the logged-in user owns it
//  Upload new thumbnail if needed
//  Update allowed fields
//  Return updated video

    
     if(!isValidObjectId(videoId)){
    throw new ApiError(400 , "Invalid vedio Id")
    }
    
           const videoOwner = await Video.findById(videoId).select("owner")
            // check is find or not
            if(!videoOwner){
                throw new ApiError(404,"video not found");
                
            }
            // check the owner and the updater are same or not
            if(!(videoOwner.owner.equals(req.user._id))){
                throw new ApiError(403 , "You are not authorized to update this video");
                
            }

    const {title , discription } = req.body; 
    
    const thumbnailPath = req.file?.path;

    const updateData = {};

    if (title) {
    updateData.title = title;
    }

    if(discription){
        updateData.discription = discription;
    }

    if (thumbnailPath) {
    // upload to Cloudinary
    // get URL
    // put URL into updateData.thumbnail
    const updateThumbnail = await uploadOnCloudinary(thumbnailPath)
    if(!updateThumbnail.url){
        throw new ApiError(400 , "thumbnail url is not fetched");
        
    }
    updateData.thumbnail = updateThumbnail.url;
    }

    if(Object.keys(updateData).length === 0){
        throw new ApiError(400,"atleast one fiield required");
        
    }
    

      const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set : {
                 ...updateData
            }
        },
        {new : true}
      )


      if (!updatedVideo) {
    throw new ApiError(404, "Video not found");
     }
        
        return res
        .status(200)
        .json(new ApiResponse(200 , updatedVideo, " sucessfully update"))
        

})


const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    // Validate videoId
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    // Find video
    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Check ownership
    if (!video.owner.equals(req.user._id)) {
        throw new ApiError(
            403,
            "You are not authorized to delete this video"
        );
    }

    // Delete video from Cloudinary
    if (video.videoFile) {
        const videoPublicId = video.videoFile
            .split("/")
            .slice(-2)
            .join("/")
            .split(".")[0];

        await cloudinary.uploader.destroy(videoPublicId, {
            resource_type: "video"
        });
    }

    // Delete thumbnail from Cloudinary
    if (video.thumbnail) {
        const thumbnailPublicId = video.thumbnail
            .split("/")
            .slice(-2)
            .join("/")
            .split(".")[0];

        await cloudinary.uploader.destroy(thumbnailPublicId, {
            resource_type: "image"
        });
    }

    // Delete video document from MongoDB
    const deletedVideo = await Video.findByIdAndDelete(videoId);

    if (!deletedVideo) {
        throw new ApiError(404, "Video not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                deletedVideo,
                "Video deleted successfully"
            )
        );
});





const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    
    if(!isValidObjectId(videoId)){
        throw new ApiError(400 , "invalid videoId")
    }
   
    const videoOwner = await Video.findById(videoId).select("owner isPublished")

    if(!videoOwner){
        throw new ApiError(404 , "video not found")
    }

    if(!(videoOwner.owner.equals(req.user._id))){
        throw new ApiError(403,"You are not authorized to toggle this video")
    }


    let newPublish;

    if(videoOwner.isPublished){
        newPublish = await Video.findByIdAndUpdate(
            videoId,
            {
                $set:{
                    isPublished : false
                }
            },
            {new : true}
        )
    }else{
        newPublish = await Video.findByIdAndUpdate(
            videoId,
            {
                $set:{
                    isPublished : true
                }
            },
            {new : true}
        )
    }

    return res
    .status(200)
    .json(new ApiResponse(200 , newPublish , "successfully togggle the video"))


})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
