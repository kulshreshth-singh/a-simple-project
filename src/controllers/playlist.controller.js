import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"


const createPlaylist = asyncHandler(async (req, res) => {
    /**
     req.body
   ↓
validate
   ↓
trim/normalize
   ↓
req.user._id → owner
   ↓
Playlist.create()
   ↓
201 Created
   ↓
ApiResponse
     */
    const {name, description} = req.body
    //TODO: create playlist
    
    if(name?.trim() === "" || !name){
        throw new ApiError(400,"name is required")
    }

    if(description?.trim() === "" || !description){
        throw new ApiError(400,"description is required")
    }
    const cleanName = name.trim()
    const cleanDescription = description.trim()

    const createdPlaylist = await Playlist.create({
        name : cleanName,
        description : cleanDescription,
        owner : req.user._id
    })

    return res
    .status(201)
    .json(new ApiResponse(201 , createdPlaylist , "Playlist created successfully"))


})

const getUserPlaylists = asyncHandler(async (req, res) => {
    /*
    Invalid ObjectId
      ↓
     400

Valid ID but user doesn't exist
      ↓
     404

User exists
      ↓
Find playlists
      ↓
[] or playlists
      ↓
    200
    */
    const {userId} = req.params
    //TODO: get user playlists

    if(!isValidObjectId(userId)){
        throw new ApiError(400 , "Invalid user ID")
    }
    
    // Validate userId, verify the user exists, and fetch all playlists owned by the user
    const check = await User.findById(userId).select("-password -refreshtoken")
    if(!check){
        throw new ApiError(404 , "user does not exist")
    }

    const playlist = await Playlist.find({owner : userId});

    return res
    .status(200)
    .json(new ApiResponse(200, playlist ,"Playlist succesfully fetched"))

})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400 , "Invalid playlistId")
    }

    const playlistbyid = await Playlist.findById(playlistId).populate("videos");

    if(!playlistbyid){
        throw new ApiError(404 , "playlist  not found")
    }

    return res 
    .status(200)
    .json(new ApiResponse(200 , playlistbyid ,"Playlist fetched successfully" ))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    /**
     * Part	Status
Validate playlistId	✅
Validate videoId	✅
Check video exists	✅
Check playlist exists	✅
Check playlist ownership	✅ 403
Prevent duplicate video	✅ some() + .equals()
Add video	✅ .push()
Save document	✅ .save()
Return updated playlist	✅
HTTP status	✅ 200
     */
    const {playlistId, videoId} = req.params
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlistId")
    }
    
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid videoId")
    }

    const currentVideo = await Video.findById(videoId);
    if(!currentVideo){
       throw new ApiError(404 ,"video does not exist");
    }

     const playlist = await Playlist.findById(playlistId).select("owner videos");
     if(!playlist){
        throw new ApiError(404 , "playlist does not exist");
     }

     if(!playlist.owner.equals(req.user._id)){
        throw new ApiError(403, "You do not own this playlist");
     }

    const videoExists = playlist.videos.some(element => element.equals(videoId))
    if(videoExists){
        throw new ApiError(400 , "video already in playlist");
    }
    // save the videoId into videos array 
    // then save it
   // Add the video ID to the playlist's videos array and save the updated playlist
    playlist.videos.push(videoId);

   const updatedPlaylist = await playlist.save();

    return res
    .status(200)
    .json(new ApiResponse(200 , updatedPlaylist ,"Video added to playlist successfully"))

    /**
     some() → check if an item exists
     push() → add an item to an array
     save() → persist a modified Mongoose document and return the saved document
     */


})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist

    
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlistId")
    }
    
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid videoId")
    }

    const currentVideo = await Video.findById(videoId);
    if(!currentVideo){
       throw new ApiError(404 ,"video does not exist");
    }

     const playlist = await Playlist.findById(playlistId).select("owner videos");
     if(!playlist){
        throw new ApiError(404 , "playlist does not exist");
     }

     if(!playlist.owner.equals(req.user._id)){
        throw new ApiError(403, "You do not own this playlist");
     }

    const videoExists = playlist.videos.some(element => element.equals(videoId))
    if(!videoExists){
        throw new ApiError(400 , "video is not exist in playlist");
    }
//You could also use findByIdAndUpdate(), but save() is perfectly valid and often convenient when you've already fetched the document and performed logic/authorization checks on it.
     const updatedVideos = playlist.videos.filter(
     key => !key.equals(videoId)
     )
     playlist.videos = updatedVideos;
    const updatedPlaylist = await playlist.save();

    /**
     * save() does not mean "only insert."

It means:

Persist the current state of this Mongoose document to MongoDB.

So don't think:

"MongoDB already has it → I must use update."

Instead think:

"I have a Mongoose document → I can modify it and save() it."
     */

    return res
    .status(200)
    .json(new ApiResponse(200 ,updatedPlaylist , "successfully remove the video in playlist"))

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400 , "invalid playlistId")
    }
    const playlist = await Playlist.findById(playlistId).select("owner");
    if(!playlist){
        throw new ApiError(404 ,"playlist not found")
    }

    if(!playlist.owner.equals(req.user._id)){
        throw new ApiError(403 , "you are not the owner of this playlist")
    }
   ///correct
   // const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);
   const deletedPlaylist = await playlist.deleteOne();

    return res
    .status(200)
    .json(new ApiResponse(200 , deletedPlaylist ,"playlist deleted successfully"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400 , "invalid playlistId")
    }
  
    const playlist = await Playlist.findById(playlistId).select("owner name description")
    if(!playlist){
        throw new ApiError(404 ,"playlist not found")
    }
    if(!playlist.owner.equals(req.user._id)){
        throw new ApiError(403 , "you are not the owner ofthis playlist")
    }

    let updatedData = {};

    if(name && name?.trim() != ""){
        updatedData.name = name.trim();
    }

    if(description && description?.trim() != ""){
        updatedData.description = description.trim();
    }

     if(Object.keys(updatedData).length === 0){
        throw new ApiError(400,"atleast one fiield required");
        
    }
    // true but another call the database not required because it is alredy in use
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set : {
                ...updatedData
            }
        },
        {new : true}
    );
 //Model method: Playlist.findByIdAndUpdate(id, data)
//Document method: playlist.name = ... → playlist.save()
    //   playlist.name = updatedData.name ?? playlist.name;
    //   playlist.description = updatedData.description ?? playlist.description;


    // const updatedPlaylist = await playlist.save();

    return res
    .status(200)
    .json(new ApiResponse(200 , updatedPlaylist ,"playlist updated successfully"))

})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
