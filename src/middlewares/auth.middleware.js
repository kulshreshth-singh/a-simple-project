// import { JsonWebTokenError } from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";

// “Before allowing the request to reach the protected controller, check whether the request contains a valid access token and identify the user.”

// run when you enter the page
export const verifyJWT = asyncHandler( async (req , res , next) => {
 try {
    // check you have token 
    //first in req.cookie and then req.header 
     const token =  req.cookies?.accessToken || req.header("Authorization")?.replace(/^Bearer\s+/i, "")
     
     // if not api error
     if(!token){
       throw new ApiError(401, "Unauthorized request")
     }
     console.log("TOKEN:", token);
     console.log("TOKEN TYPE:", typeof token);
      // verify wether your token valid
     const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
     // find user by your token and remove secret
     const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
      
     if(!user){
       //todo discuss about frontend
       throw new ApiError(401, "Invalid Access token")
     }
    
     // now all your verifyed data is in user 
     req.user = user;
     next()
 } catch (error) {
    // error and stufff
    throw new ApiError(401, error?.message || "Invalid access token")
 }



})
//“Give me the access token from the cookie or Authorization header. If you don't have one, reject the request. If you do, I'll verify it using my secret key. Then I'll use the user ID inside that token to find the user in MongoDB. If that user exists, I'll attach the user to req.user and allow the request to continue. Otherwise, reject it.”