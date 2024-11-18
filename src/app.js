import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import http from "http";

import { Server as SocketIOServer } from "socket.io";

const app = express();
const server = http.createServer(app);

const io = new SocketIOServer(server,{
    cors: {
      origin: ["https://itube-play.netlify.app", "http://localhost:5173"],
      credentials: true,
    },
  });

// app.use(cors({
//     origin: "https://itube-play.netlify.app",
//     credentials: true
// }));
// app.use(cors({
//     origin: "http://localhost:5173",
//     credentials: true
// }));
const allowedOrigins = [
  "https://itube-play.netlify.app",
  "http://localhost:5173",
];

setupSocketIo(io)
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "20kb" }));
app.use(express.static("Public"));

import userRouter from "./routes/User.routes.js";
import videoRouter from "./routes/Video.routes.js";
import tweetRouter from "./routes/Tweet.routes.js";
import commentRouter from "./routes/Comment.routes.js";
import setupSocketIo from "./SocketWeb/SocketServer.js";


app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/tweet", tweetRouter);
app.use("/api/v1/comments", commentRouter);


export { server, io };
export default app;
