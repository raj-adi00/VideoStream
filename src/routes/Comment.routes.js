import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createComment, DeleteComment, GetAllComment, updateComment } from "../controllers/Comment.controller.js";
import { UserVerification } from "../middlewares/UserVerification.middleware.js";


const router = Router()
router.route('/create-comment/:videoid').post(verifyJWT, createComment)
router.route('/update-comment/:commentid').patch(verifyJWT, updateComment)
router.route('/delete-comment/:commentid').delete(verifyJWT, DeleteComment)
router.route('/get-comment/:videoid').get(UserVerification, GetAllComment)
export default router