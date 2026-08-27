import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const vedioSchema = new mongoose.Schema({
 
    vedioFile: {
        type: String,   //cloudinary url
        required: true
    },

    thumbnails: {
        type: String, // cloudinary url
        required: true
    },
    title: {
        type: String,
        required: true
    },
    discription: {
        type: String,
        required: true
    },
    duration: {
        type: Number,
        required: true
    },
    views: {
        type: Number,
        default: 0
    },
    isPublished: {
        type: Boolean,
        default: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }



},{timestamps: true})

VedioSchema.plugin(mongooseAggregatePaginate)

export const Vedio = mongoose.model("Vedio",vedioSchema);