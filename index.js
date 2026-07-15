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
import messageRouter from './routes/message.routes.js';

let app = express();

let server = http.createServer(app);
export const io = new Server(server, {
    cors: ({
        origin: "http://localhost:5173",
        credentials: true
    })
})

let port = process.env.PORT;
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}))
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/post", postRouter);
app.use("/api/connection", connectionRouter);
app.use("/api/notification", notificationRouter);
app.use("/api/message", messageRouter);

export const userShocketMap = new Map(); // userId -> socket.id (also doubles as our "online users" list)
const socketUserMap = new Map();          // socket.id -> userId (needed to know who disconnected)

io.on("connection", (socket) => {
    socket.on("register", (userId) => {
        userShocketMap.set(userId, socket.id);
        socketUserMap.set(socket.id, userId);

        // tell everyone this user just came online, and tell THIS user who else is already online
        io.emit("userOnline", userId);
        socket.emit("onlineUsers", Array.from(userShocketMap.keys()));

        console.log(userShocketMap);
    })

    socket.on("disconnect", () => {
        let userId = socketUserMap.get(socket.id);
        if (userId) {
            userShocketMap.delete(userId);
            socketUserMap.delete(socket.id);
            io.emit("userOffline", userId);
        }
    })
})

server.listen(port, () => {
    connectDb();
    console.log("server is started...");
})