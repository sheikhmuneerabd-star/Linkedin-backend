import { Router } from 'express';
import isAuth from '../meddlewares/isAuth.js';
import upload from '../models/multer.js';
import { comment, createPost, getPost, like } from '../controllers/post.controller.js';
let postRouter = Router();

postRouter.post("/create", isAuth, upload.single("image"), createPost);
postRouter.get("/getPost", isAuth, getPost);
postRouter.get("/like/:id", isAuth, like);
postRouter.post("/comment/:id", isAuth, comment);

export default postRouter;