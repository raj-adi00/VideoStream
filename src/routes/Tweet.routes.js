import { Router } from "express";
import { createTweet, deleteTweet, getAllTweet, updateTweet } from "../controllers/Tweet.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";


const router = Router()

router.route('/create-tweet').post(verifyJWT, upload.none(), createTweet)
router.route('/get-tweets').get(getAllTweet)
router.route('/update-tweet/:tweetid')
    .post(verifyJWT, updateTweet)
router.route('/:tweetid')
    .delete(verifyJWT, deleteTweet)
export default router