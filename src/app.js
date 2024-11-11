import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import http from 'http';

import { Server as SocketIOServer } from "socket.io";


const app = express();
const server = http.createServer(app);

app.get('/', (req, res) => {
    res.send("hello")
})
const io = new SocketIOServer(server);


app.use(cors({
    origin: "https://itube-play.netlify.app",
    credentials: true
}));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "20kb" }));
app.use(express.static("Public"));
app.use(cookieParser());


import userRouter from './routes/User.routes.js';
import videoRouter from './routes/Video.routes.js';
import tweetRouter from './routes/Tweet.routes.js';
import commentRouter from './routes/Comment.routes.js'

app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/tweet", tweetRouter);
app.use("/api/v1/comments", commentRouter)
export { server, io };
export default app
