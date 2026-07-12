import { Router } from "express";
import { login, logout, signUp } from "../controllers/auth.controller.js";

const authRouter = Router();
authRouter.post("/signUp", signUp);
authRouter.post("/login", login);
authRouter.get("/logout", logout);
export default authRouter;