import mongoose,{Schema} from "mongoose";


const videoSchema = new Schema({
    videoFile:{
        type: String,
        required: [true , "Video File is required"],
    },
    thumbnail:{
        type: String,
        required: [true , "Thumbnail is required"],
    },
    owner:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    title:{
        type: String,
        required: [true , "Title is required"],
    },
    description:{
        type: String,
    },
    duration:{
        type:Number,
        required: [true , "Duration is required"],
    },
    views:{
        type: Number,
        default: 0
    },
    isPublished:{
        type: Boolean,
        default: true
    },
},{timestamps: true})


export const Video = mongoose.model("Video", videoSchema)