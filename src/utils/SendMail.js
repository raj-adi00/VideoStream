import nodemailer from 'nodemailer'
import { asyncHandler } from './asyncHandler.js';
import { ApiResponse } from './ApiResponse.js';

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: "sharmagoldie6@gmail.com",
        pass: process.env.GOOGLE_ACCOUNT_PASS
    },
});
const sendMail = asyncHandler(async (subject, text, to) => {
    console.log(text)
    try {
        const info = await transporter.sendMail({
            from: '<sharmagoldie6@gmail.com >',
            to: to,
            subject: subject,
            html: `${text} <br> <b>From VideoStream Team</b>`, // html body
        });
        if (info.messageId)
            return new ApiResponse(200, { messageId: info.messageId }, "Message sent successfully")
        else
            return new ApiResponse(500, {}, "Somehting went wrong while sending mail")
    } catch (error) {
        console.log(error)
        return new ApiResponse(500, {}, "Somehting went wrong while sending mail")
    }
})
export default sendMail