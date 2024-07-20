import dotenv from "dotenv"
import express from "express"
import connectDB from "./db/index.js";
const app = express();


dotenv.config({
    path: './env'
})


connectDB()
    .then(() => {
        app.on("error", (err) => {
            console.log("ERROR", err);
            throw err
        })
        app.listen(process.env.PORT || 8000, () => {
            console.log(`Server is running at port:${process.env.PORT}`)
        })
    })
    .catch((err) => {
        console.log("MONGO DB CONNECTION FAILED !!!", err)
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
