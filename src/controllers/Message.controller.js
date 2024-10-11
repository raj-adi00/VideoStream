// import { Message } from "../models/message.model";
// import { ApiResponse } from "../utils/ApiResponse";
// import { asyncHandler } from "../utils/asyncHandler";


// const CreateMessage = asyncHandler(async (senderId, recipientId, message) => {
//     try {
//         const sentMessage = await Message.create({
//             sender: senderId,
//             receiver: recipientId,
//             message: message,
//         })
//         if (sentMessage)
//             return new ApiResponse(200, sentMessage, "Message stored Successfully")
//         else
//             return new ApiResponse(500, {}, "Something went wrong")
//     } catch (error) {
//         console.log("Error at creating message", error)
//         return new ApiResponse(500, {}, "SOmething went wrong")
//     }
// })

// const getChatHistory = asyncHandler(async (req, res) => {
//     const user = req?.user
//     const sender = user?._id
//     if (!user || !sender)
//         return res
//             .status(400)
//             .json(new ApiResponse(400, {}, "Unauthorised Access"))

//     const { receiver } = req?.body
//     if (!receiver) {
//         return res
//             .status(403)
//             .json(new ApiResponse(403, {}, "Invalid requesst"))
//     }

// })

// export { CreateMessage }