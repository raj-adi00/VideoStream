import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { PublsihVideo } from "../controllers/Video.controller.js";


const router = Router()

router.route("/upload-video").post(verifyJWT, upload.fields([
    {
        name: 'thumbnail', maxCount: 1
    },
    {
        name: 'video', maxCount: 1
    }
]), PublsihVideo)
export default router