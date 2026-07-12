import { Router } from 'express';
import { getCurrentUser, getProfile, getSuggestedUser, search, updateProfile } from '../controllers/user.controller.js';
import isAuth from '../meddlewares/isAuth.js';
import upload from '../models/multer.js';

let userRouter = Router();

userRouter.get("/currentUser", isAuth, getCurrentUser);
userRouter.put("/updateProfile", isAuth, upload.fields([
    {name: "profileImage", maxCount: 1},
    {name: "coverImage", maxCount: 1}
]), updateProfile);
userRouter.get("/profile/:userName", isAuth, getProfile);
userRouter.get("/search", isAuth, search);
userRouter.get("/suggestedUsers", isAuth, getSuggestedUser);

export default userRouter;