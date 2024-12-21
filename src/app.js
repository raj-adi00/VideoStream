import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import http from "http";

import { Server as SocketIOServer } from "socket.io";

const app = express();
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: [
      "https://itube-play.netlify.app",
      "http://localhost:5173",
      "http://localhost",
    ],
    credentials: true,
  },
});

const allowedOrigins = [
  "https://itube-play.netlify.app",
  "http://localhost:5173",
  "http://localhost",
];

setupSocketIo(io);
app.use(
  cors({
    origin: (origin, callback) => {
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
import chatRouter from "./routes/Chat.routes.js";
import mongoose from "mongoose";

app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/tweet", tweetRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/chat", chatRouter);

app.get("/health", async (req, res) => {
  try {
    // Check database connection
    const dbState = mongoose.connection.readyState; // 1 = connected
    if (dbState !== 1) {
      return res
        .status(503)
        .json({ status: "FAILED", message: "Database not connected" });
    }

    // Additional checks can go here (e.g., external APIs, Redis, etc.)

    res.status(200).json({ status: "OK", message: "Backend is healthy" });
  } catch (error) {
    res
      .status(500)
      .json({
        status: "ERROR",
        message: "An error occurred",
        error: error.message,
      });
  }
});
export { server, io };
export default app;
