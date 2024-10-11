import dotenv from 'dotenv';
import { app, io, server } from './app.js'; // Import server from app.js
import connectDB from './db/index.js';
import setupSocketHandlers from './SocketWeb/SocketServer.js'

dotenv.config({ path: './.env' });

connectDB()
    .then(() => {
        setupSocketHandlers(io)
        server.listen(process.env.PORT || 8000, () => {
            console.log(`Server is running on port ${process.env.PORT || 8000}`);
        });
    })
    .catch((err) => {
        console.log("MONGO DB CONNECTION FAILED !!!", err);
    });

/*
; (async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error", (err) => {
            console.log("ERROR", err);
            throw err
        })

        app.listen(process.env.PORT, () => {
            console.log("APP is listening on port", process.env.PORT)
        })
    } catch (err) {
        console.log("ERROR:", err)
        throw err
    }
})()
    */
