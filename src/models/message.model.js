import mongoose, { Schema } from "mongoose";


const MessageSchema = new Schema({
    sender: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    receiver: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    message: {
        type: String,
        required: true
    },
    isDelivered: {
        type: Boolean,
        default: false
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
})

export const Message = mongoose.model("Message", MessageSchema)