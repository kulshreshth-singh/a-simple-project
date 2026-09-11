import mongoose, {model, Schema} from "mongoose";

const likeSchema = new Schema({
    vedio :{
        type: Schema.Types.ObjectId,
        ref: "Vedio"
    },
    tweet:{
        type: Schema.Types.ObjectId,
        ref: "Tweet"
    },
    likedBy: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    comment: {
        type: Schema.Types.ObjectId,
        ref: "Comment"
    }

},

{
    timestamps: true
}

)

export const Like = mongoose.model("Like", likeSchema)