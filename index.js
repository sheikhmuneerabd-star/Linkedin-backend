import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import authRouter from './routes/auth.routes.js';
import connectDb from './config/db.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import userRouter from './routes/user.routes.js';
import postRouter from './routes/post.routes.js';
import connectionRouter from './routes/connection.routes.js';
import http from 'http'
import { Server } from 'socket.io';
import notificationRouter from './routes/notification.routes.js';

let app = express();

let server = http.createServer(app);
export const io = new Server(server, {
    cors: ({
        origin: "https://muneer-social-app.netlify.app",
        credentials: true
    })
})

let port = process.env.PORT;
app.use(cors({
    origin: "https://muneer-social-app.netlify.app",
    credentials: true
}))
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/post", postRouter);
app.use("/api/connection", connectionRouter);
app.use("/api/notification", notificationRouter);

export const userShocketMap = new Map();

io.on("connection", (socket) => {
    socket.on("register", (userId) => {
        userShocketMap.set(userId, socket.id);
        console.log(userShocketMap);
    })

    socket.on("disconnect", () => {
    })
})

server.listen(port, () => {
    connectDb();
    console.log("server is started...");
<<<<<<< HEAD
})
=======
})

export default app;
>>>>>>> 83b006a1022ed0409e52633c275199bdc8a9c666
