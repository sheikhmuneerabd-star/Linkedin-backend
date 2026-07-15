import { Router } from 'express';
import isAuth from '../meddlewares/isAuth.js';
import upload from '../models/multer.js';
import { getConversations, getMessages, sendMessage } from '../controllers/message.controller.js';

let messageRouter = Router();

messageRouter.post("/send/:receiverId", isAuth, upload.single("image"), sendMessage);
messageRouter.get("/get/:userId", isAuth, getMessages);
messageRouter.get("/conversations", isAuth, getConversations);

export default messageRouter;