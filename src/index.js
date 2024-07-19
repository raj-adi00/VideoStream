import dotenv from "dotenv"
import express from "express"
import connectDB from "./db/index.js";
const app = express();


dotenv.config({
    path:'./env'
})


connectDB();
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
