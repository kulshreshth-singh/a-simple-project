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
   const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

   if(!incomingRefreshToken){
    throw new ApiError(401, "unauthorise request")
   }

  try {
     const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
     )
  
    const user = await User.findById(decodedToken?._id)
    if(!user){
      throw new ApiError(401, "Invalid refresh token")
     }
     
     if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used")
     }
  
     const options ={
      httpOnly: true,
      secure: true
     }
  
    const {accessToken, newrefreshToken} = await generateAccessAndRefreshTokens(user._id);
  
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


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
}