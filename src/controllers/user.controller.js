import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";


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
   console.log("email: ", email);

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


export {registerUser}