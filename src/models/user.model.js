import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrpyt from "bcrypt";

const userSchema = new mongoose.Schema({
    username : {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    email : {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    fullName : {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    avatar: {
        type: String,   // cloudinary url
        required: true
        
    }, coverImage: {
        type: String,
    },

    watchHistroy: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "video"
        }
    ],
    password: {
        type: String,
        required: [true,'password is required']
    },
    refreshToken: {
        type: String,
    }




},{timestamps: true})

// before saving in mongose --> .pre
// when user.save() is call before that this middleware will work
userSchema.pre("save", async function (){
    //  check if you modified your already encrypt password if not return old one
    if(!this.isModified("password")){
        return;
    }

    // before saving the password encrypt it
    this.password = await bcrpyt.hash(this.password, 10)
   
})
// arrow functions don't have their own dynamic this, so Mongoose cannot bind this to the document in the way this middleware needs.
// this mean user
// compare the password and return true and false
// arrow function cannot work with this ..
userSchema.methods.isPasswordCorrect = async function (password) {
   return await bcrpyt.compare(password,this.password)
}
// creates a method that every User document can use.

//Access Token
// = temporary ID card

// Refresh Token
// = long-term permission to get a new ID card
userSchema.methods.generateAccessToken = async function (){
    return await jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = async function () {
      return await jwt.sign(
        {
            _id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}




export const User = mongoose.model("User",userSchema);