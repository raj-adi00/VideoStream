import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { deleteVideo, getAllVideo, getVideoById, getVideoDetaisbyVideo_public_id, PublsihVideo, togglePublishStatus, updateVideoDetails } from "../controllers/Video.controller.js";


const router = Router()

router.route("/upload-video").post(verifyJWT, upload.fields([
    {
        name: 'thumbnail', maxCount: 1
    },
    {
        name: 'video', maxCount: 1
    }
]), PublsihVideo)

router.route("/").get(getAllVideo)
router
    .route("/:videoid")
    .get(getVideoById)
    .delete(verifyJWT, deleteVideo)
    .patch(verifyJWT, updateVideoDetails)

router
    .route("/publicid/:video_public_id").get(getVideoDetaisbyVideo_public_id)
router.route("/toggle/publish/:videoid").patch(verifyJWT, togglePublishStatus);
export default router