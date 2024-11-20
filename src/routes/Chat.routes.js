import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { AddFreinds, GetAllNonFriendUsers, GetAllUserChat, saveMessage } from "../controllers/Chat.controller.js";

const router = Router();
router.route("/get-non-friend-users").get(verifyJWT, GetAllNonFriendUsers);
router.route('/add-friend').get(verifyJWT,AddFreinds)
router.route('/get-messages').get(verifyJWT,GetAllUserChat)
router.route('/save-message').post(verifyJWT,saveMessage)
export default router;
