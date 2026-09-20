import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    // fetching form frontend 
    // midlleware jwtVerify the user
    // check if string is empty or not 
    // create a tweet 
    // check it is created or not 
    // success got and json response


    // fetching data from frontend
    let {content} = req.body;
    
    // check if content is empty 
    if(content.trim() === ""){
        throw new ApiError(400 ," content is required")
    }
    //jwtVerify verify the user and have user._id 

    //so no need to write this below code to fetch id feom database (it is not optimce)
   // const owner = await User.findById(req.user?._id);


   //creating tweet and store it 
    const tweet = await Tweet.create({
        content,
        // direct refrence from verify Jwt
        owner : req.user?._id
        //tweets Id in this which is to find created Tweets
    })
    
    // fetching the createdtweet
    const createdTweet = await Tweet.findById(tweet._id);
    // check for create or not
    if(!createdTweet){
        throw new ApiError(500 , "Something went wrong while creating the Tweet");
        
    }
   // response 
    return res
    .status(200)
    .json(new ApiResponse(200, createdTweet , "Tweet create successfully"))

    // what i do wrong first typos, do not figure out data flowing , and other thing because of incomplete thing

})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    // destructing or find user Id in url
    // check userId 
    // extract data from Scehma by userId
    // return response  
    // what if no tweets was created by user?-->return it
    

    // fetching from url
    const {userId} = req.params
    // userId got trim and if nothing left api error
   if(!isValidObjectId(userId)){
    throw new ApiError(400, "userId is not valid");
    }
   // important part where i get various learnig 
   // which thing i was find ---owner , by who's help --userId
   // which use find for all the tweets 
   // now which field i want content so select content 

    const tweets = await Tweet.find({owner: userId}).select("content");

// return if empty or not 
    return res
    .status(200)
    .json (new ApiResponse(200, tweets , "tweets fetch succesfully"))

})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    //fetching user detail in url
    // fetching updating content from frontend 
    // check both 
    // then exceess the data 
    // and update then 
    // return response

    // featching tweetId from url
    let{tweetId} = req.params
    // fetching newcontent from frontend
    let{newContent} = req.body
     
    // check if empty or not
if(!isValidObjectId(tweetId)){
    throw new ApiError(400, "tweetId is not valid");
}      // check if empty or not
    if(!newContent?.trim()){
        throw new ApiError(400 , "newContent is required")
    }
    // fetching owner detail from database by tweet id
    const tweetOwner = await Tweet.findById(tweetId).select("owner")
    // check is find or not
    if(!tweetOwner){
        throw new ApiError(400,"tweetOwner not found");
        
    }
    // check the owner and the updater are same or not
    if(!(tweetOwner.owner.equals(req.user._id))){
        throw new ApiError(404 , "this is not the tweet owner");
        
    }
      // updating the tweet 
    const updatedContent = await Tweet.findByIdAndUpdate(
         tweetId,
        {
           $set:{
            content: newContent
           }
        },
        { new : true}
    )
  //send Response
   return res
   .status(200)
   .json(new ApiResponse(200, updatedContent ," newContent will update sucessfully"))

})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    // fetchind tweetId from url
    // check tweetId 
    // check tweet in database 
    // if not exist throw error
    // find it user and check if both are or not 
    // delete 
    // send response

    let{tweetId} = req.params;

  if(!isValidObjectId(tweetId)){
    throw new ApiError(400, "tweetId is not valid");
}

    const tweeted = await Tweet.findById(tweetId).select("owner")

    if(!tweeted){
        throw new ApiError(400 , "tweet not exist")
    }

    if(!(tweeted.owner.equals(req.user._id))){
        throw new ApiError(400, "TweetId does not match")
    }

    const deletedTweet = await Tweet.findByIdAndDelete(
        tweetId
    )

    return res
    .status(200)
    .json(new ApiResponse(200, deletedTweet , "sucessfully delete the tweet"))


})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
