import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription

      // TODO: validate channelId

    // TODO: get the logged-in user's ID from req.user

    // TODO: check whether a subscription already exists
    // between the logged-in user and this channel

    // TODO: if subscription exists, delete it
    // TODO: if subscription does not exist, create it

    // TODO: return an appropriate response

    // check if it valid or not 
    if(!isValidObjectId(channelId)){
        throw new ApiError(400,"channel id is not found");
        
    }
     
    // check relationship in database
    const subscription = await Subscription.findOne({
    subscriber: req.user._id,
    channel: channelId
    });
    
    // creating scope outside
    let userSubscription ;
    //if subscription exists, delete it
    // if subscription does not exist, create it
    if(subscription){
         userSubscription = await Subscription.findByIdAndDelete(
            subscription._id
        )
    }else{
         userSubscription = await Subscription.create({
             subscriber: req.user._id,
             channel: channelId
        })
    }

   // return resopnse
    return res 
    .status(200)
    .json(new ApiResponse(200 , userSubscription , "toggle complete"))

      

})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
      //fetch channeldetail in url 
    // valid channel id 
    // midleware validate the user
    // find in user related to channel in database 
    // return response

    // fetching channel detail in url
    const {channelId} = req.params
    // valid channel id by isValidObjectId
    if(!isValidObjectId(channelId)){
        throw new ApiError(400 , "channelId is not valid")
    }
    // find subcription list in database by channelId 
//     findById() → search by Subscription _id
// findOne() → find one matching relationship
// find() → find all matching relationships
    const subscribeList = await Subscription.find({channel : channelId}).select("subscriber")
    
    // return response
    return res
    .status(200)
    .json(new ApiResponse(200 , subscribeList , "suceesfully fetch subscriber list"))

})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  
    //fetching subscriberId in url
    const { subscriberId } = req.params
    // check if its valid
    if(!isValidObjectId(subscriberId)){
        throw new ApiError(400 , "subscriberId is not valid")
    }
    // find channel list in database by subscriberId
    // using find()  for multiple document 
    const channelList = await Subscription.find({subscriber : subscriberId}).select("channel")
     // return response
    return res
    .status(200)
    .json(new ApiResponse(200 , channelList , "channelList sucessfully fetched"))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}