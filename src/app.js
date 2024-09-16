import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser';

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "20kb" }))
app.use(express.static("Public"))
app.use(cookieParser())


//routes import

import userRouter from './routes/User.routes.js'
import videoRouter from './routes/Video.routes.js'
import tweetRouter from './routes/Tweet.routes.js'
//routes declaration
app.use("/api/v1/users", userRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/tweet",tweetRouter)
export { app }