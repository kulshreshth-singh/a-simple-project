import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"; 

const generateAccessAndRefreshTokens = async(userId) => {
    try {
      const user = await User.findById(userId)
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();

        user.refreshToken = refreshToken
        // save without validation
        await user.save({validateBeforeSave: false})

        return { accessToken , refreshToken }
       
    } catch (error) {
        throw new ApiError(500 ,"something went wrong while gernating refresh and access token")
    }


}

const registerUser = asyncHandler( async (req , res) =>{
   //get user details from frontend 
   //validation - not empty
   //check if user already exists: username, email
   //check for images, check for avatar
   //upload them to cloudinary
   //create user object - create entry in db
   //remove password and refresh token field from response
   //check for user creation
   //return res

//fetching data for user
   const {fullName, email, username , password} = req.body
   console.log("req.body --> ",req.body);

   //check if something empty some mean any of it , field just  variable ,?. "If this thing doesn't exist, don't crash the program; give me undefined instead." or is optional chain pervent from undefined and null, trim() help to remove empty space in string , if empty throw api Error

  if (
    [fullName, password, email, username].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required")
  }

  // check if username or email already exit then throw an error , use await for other than promise ,$or: help to either this or that should be true , if true throw error
 const existedUser = await User.findOne({
     $or: [{ username },{ email }]
  })
  if(existedUser){
    throw new ApiError(409, "User with email or username already exits")
  } 
console.log("req.files--> ",req.files);

    // check if image and avatar is exist or not 
    //req.files api for requesting files files is in multer that store data in object from and that key store the arary therfore [0], .path is the local address of avatar or image , ?. represent "If this thing doesn't exist, don't crash the program; give me undefined instead."
  const avatarlocalPath = req.files?.avatar?.[0]?.path
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  if(!avatarlocalPath){
    throw new ApiError(400, "Avatar files is required")
  }

  //upload on cloudinary
  const avatar = await uploadOnCloudinary(avatarlocalPath)
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  //check avatar been uploaded
   if(!avatar){
    throw new ApiError(400, "Avatar is required")
   }
 //creating user ,
   const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase()

   })

   const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
   )

   if(!createdUser){
    throw new ApiError(500, "something went wrong while registring the user")
   }

   return res.status(201).json(
    new ApiResponse(200, createdUser, "User registered sucessfully")
   )


})

const loginUser = asyncHandler( async (req , res) => {
    //req.body --> data
    //username or email
    // must be in database 
    //password should be correct for that user
    // aceess and refresh  token
    //send cookie
    //response
    //forget passward??

    //req.body se data
    const {username , email , password } = req.body;
     
    //check if both find is not empty
    if(!username && !email){
        throw new ApiError(400, "username or email is required")
    }
    
    //find either of one btw uesrname or email
   const user = await User.findOne({
     $or: [{username},{email}]
    })
     
    //if user is not exist then throw api error
    if(!user){
        throw new ApiError(404, "User does not exist")
    }
     
  

   const isPasswordValid =  await user.isPasswordCorrect(password)

   if(!isPasswordValid){
    throw new ApiError(401 , "password is incorrect")
   }
//Access Token
// = temporary ID card

// Refresh Token
// = long-term permission to get a new ID card
  const { accessToken , refreshToken } = await generateAccessAndRefreshTokens(user._id)
  
  const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
  
  // httpOnly: true means JavaScript running in the browser cannot normally access that cookie through document.cookie.

//That's useful for reducing exposure to certain kinds of XSS attacks.

  const options = {
    httpOnly: true,
    secure: true
  }

  return res
  .status(200)
  .cookie("accessToken", accessToken, options)
  .cookie("refreshToken", refreshToken, options)
  .json(
      new ApiResponse(
        200,
        {
            user: loggedInUser,
             accessToken, 
             refreshToken
        },
        "User logged in Successfully"
      )
  )

})


const logoutUser = asyncHandler( async(req,res) => {
    // find user
    //then jwtverify middleware user -> req.body
    //clear refresh token in database 
    //clear in browser access and refresh token
  await User.findByIdAndUpdate(
    req.user._id,
    {
        $unset: {
            refreshToken: 1
        }
    },
    {
        returnDocument: "after"
    }
)
   const options = {
    httpOnly: true,
    secure: true
  }

  return res
  .status(200)
  .clearCookie("accessToken",options)
  .clearCookie("refreshToken",options)
  .json(new ApiResponse(200, {}, "User logged Out"))
})

//access token --> it is used to not doing login again and again for api req
// short live and have information and payload
//refresh token --> it is use to refresh the accees token for a long period of time 
//Access token = proof that the user has already authenticated, attached to protected API requests.

const refreshAccessToken = asyncHandler(async (req, res) =>{
    //extracting browser refesh token
   const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
//is it empty or not
   if(!incomingRefreshToken){
    throw new ApiError(401, "unauthorise request")
   }
//try catch
  try {
    // decoding the refresh token
     const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
     )
     //finding user by it in decoded token
  
    const user = await User.findById(decodedToken?._id)
    //exist or not
    if(!user){
      throw new ApiError(401, "Invalid refresh token")
     }

     // compare decoded or actually mongoose store refresh token
     if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used")
     }

     //option
  
     const options ={
      httpOnly: true,
      secure: true
     }
     //gernating new access and refresh token
    const {accessToken, newrefreshToken} = await generateAccessAndRefreshTokens(user._id);
  // returing response and giving new access and refresh token to browser
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newrefreshToken, options)
    .json(
      new ApiResponse(
          200,
          {accessToken, refreshToken: newrefreshToken },
          "Access token refresh"
      )
    )
  } catch (error) {
     throw new ApiError(401, error?.message || "Invalid refresh token")
  }

})

//changing password before that a jwtVerify middleware conform the user exit by id in tokens and user data by token and database by auth midlleware
const changeCurrentPassword = asyncHandler( async(req,res) => {
 // taking information from frontend
    const {oldPassword, newPassword /*, confPassword*/ } = req.body

    // if(newPassword !== confPassword){
    //     throw new ApiError(400, "conform password is incorrect")
    // }

    //  finding userId by token and jwtVerify midlleware
    const user = await User.findById(req.user?._id)
    
    // compare password 
   const isPasswordCorrect =  await user.isPasswordCorrect(oldPassword)
     // if not then api error
   if(!isPasswordCorrect) {
    throw new ApiError(400,"Incorrect password")
   }
   
   //  set new password to save in data and the mongoose middleware that i write is used to set hash and then we save
   user.password = newPassword
   await user.save({validateBeforeSave: false})
  //return response
   return res
   .status(200)
   .json(new ApiResponse(200, {}, "password changed successfuly"))

})
   
// get user route
const getCurrentUser = asyncHandler( async(req, res) => {
    return res
    .status(200)
    .json(
    new ApiResponse(
        200,
        req.user,
        "current user fetched successfully"
    )
)
})

// updating account
const updateAccountDetails = asyncHandler( async(req, res) => {
    // requesting frontend for details
    const {fullName, email} = req.body
    // check if not empty
    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }
    
    // find id by jwt verify midlleware in req.user and udate the values and remove password in response
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email
            }
        },
        { new :true }
    ).select("-password")

     // just for check and knowledge purpose
    console.log(user)
  // response 
    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))



})

////files update by midllleware first multer,loggedin 
//now controller
const updateUserAvatar = asyncHandler( async(req, res) => {
    // finding path or url of that file
    const avatarlocalPath = req.file?.path
    // check if not empty
    if (!avatarlocalPath) {
        throw new ApiError(400, "avatar files is missing");
    }
    
    // that file uploaded to cloudinary
   const avatar = await uploadOnCloudinary(avatarlocalPath);
     // check if empty or not
    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar");
    }
    console.log(avatar);
     
    // find id by jwt verify midlleware in req.user and update avatar  and remove password in response
   const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
       $set:{
        avatar :avatar.url
       }
    },
    {new: true}

    ).select("-password")

    // just for check and knowledge purpose
    console.log(user)
    // response
    return res
    .status(200)
    .json(new ApiResponse(200, user, "avatar is updated"))
    
})

////files update by midllleware first multer,loggedin 
//now controller
const updateUsercoverImage = asyncHandler( async(req, res) => {
    // fetching the path of file
    const coverImagelocalPath = req.file?.path
    // check if is coreect or not
    if (!coverImagelocalPath) {
        throw new ApiError(400, "cover Image file is missing");
    }
   // upload in cloudinary
   const coverImage = await uploadOnCloudinary(coverImagelocalPath);
     //  check if coreect or not
    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on coverImage");
    }
    console.log(coverImage);
   
    // find id by jwt verify midlleware in req.user and update coverImage  and remove password in response
   const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
       $set:{
        coverImage :coverImage.url
       }
    },
    {new: true}

    ).select("-password")

    // just for check and knowledge purpose
    console.log(user)
    // response
    return res
    .status(200)
    .json(new ApiResponse(200, user, "coverImage is updated"))
    
})

const getUserChannelProfile = asyncHandler( async(req, res) =>{
    //destructring
    const {username} = req.params

    if(!username?.trim()){
        throw new ApiError(400, "username is missing");
        
    }

    const channel = await User.aggregate([
        // finding the user
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        // finding or makeing mongoose find for various user subscribe
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        // a user subscribed to channel
        {
            $lookup: {
                 from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            // counting the length of document according to needs
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                //
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id,"$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
      //  $project controls what fields should be returned.
      //      1 means: Include this field.
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1


            }
        }
    ])
     console.log(channel);

     if (!channel?.length) {
        throw new ApiError(404, "channel does not exist")
     }

     return res
     .status(200)
     .json(
        new ApiResponse(200, channel[0],"User channel fetched successfully")
     )

})



const getWatchHistory = asyncHandler( async (req, res) => {

    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField:"watchHistory",
                foreignField: "_id",
                as : watchHistroy,
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline :[
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistroy,
            "watch history fetched successfully"
        )
    )
})





export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUsercoverImage,
    getUserChannelProfile,
    getWatchHistory 
    
}