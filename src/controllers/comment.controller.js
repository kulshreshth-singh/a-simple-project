import mongoose , { isValidObjectId } from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query
    
    // MongoDB/Mongoose can sometimes handle casting in normal queries, but with an aggregation pipeline, don't rely on automatic casting.
    const videoObjectId = new mongoose.Types.ObjectId(videoId);


    if(!isValidObjectId(videoId)){
    throw new ApiError(400, "invalid video Id")
    }

    const pageNumber = Number(page);
    const limitNumber = Number(limit); 

    if (
    !Number.isInteger(pageNumber) ||
    pageNumber < 1 ||
    !Number.isInteger(limitNumber) ||
    limitNumber < 1
    ) {
         throw new ApiError(400, "invalid pagination values");
    }

   const matchStage = {
       video: videoObjectId
    };

    const pipeline = [
        {
            $match : matchStage
        }
    ];

     const options = {
    page: pageNumber,
    limit: limitNumber
    };

    const result = await Comment.aggregatePaginate(
        Comment.aggregate(pipeline),
        options
    )

    return res
    .status(200)
    .json(new ApiResponse(200, result , "succesfully paginate the comments"))

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId} = req.params;
    const {comment} = req.body;

    if(comment?.trim() === "" || !comment){
         throw new ApiError(400 , "comment is required")
    }

    if(!isValidObjectId(videoId)){
        throw new ApiError(400 , "invalid video Id")
    }

    const userComment = await Comment.create({
        content : comment,
        owner : req.user._id,
        video : videoId

    })

    return res 
    .status(201)
    .json(new ApiResponse(201 , userComment , "successfully created a comment"))
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const{commentId} = req.params;

    const{newContent} = req.body;

    if(!isValidObjectId(commentId)){
        throw new ApiError(400 , "invalid comment Id")
    }

    if(newContent?.trim() === "" || !newContent){
        throw new ApiError(400 , "updated comment required")
    }

    const commentOwner = await Comment.findById(commentId).select("owner")

    if(!commentOwner){
        throw new ApiError(404 ,"comment does not found")
    }

    if(!(commentOwner.owner.equals(req.user._id))){
        throw new ApiError(403 , "owner does not match with the user")
    }

    const updatedComment = await Comment.findByIdAndUpdate(
       commentId ,
        {
            $set :{
                content : newContent
            }
        },
        {
            new : true
        }
    )

    return res
    .status(200)
    .json(new ApiResponse(200 , updatedComment , "successfully updated the comment" ))


})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const{commentId} = req.params;
    
    if(!isValidObjectId(commentId)){
        throw new ApiError(400 , "Invalid comment Id")
    }

    const comment = await Comment.findById(commentId).select("owner");

    if(!comment){
        throw new ApiError(404 , "comment not found")
    }

    if(!(comment.owner.equals(req.user._id))){
        throw new ApiError(403 , "owner doesnot match with user")
    }

    const deletedComment = await Comment.findByIdAndDelete(commentId)


    return res
    .status(200)
    .json(new ApiResponse(200 , deletedComment , "comment is sucessfully deleted"))
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }
