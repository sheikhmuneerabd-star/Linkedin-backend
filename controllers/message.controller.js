import uploadOnCloudinary from "../config/cloudinary.js";
import { io, userShocketMap } from "../index.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";

const areConnected = async (userAId, userBId) => {
    let user = await User.findById(userAId);
    if (!user) return false;
    return user.connection.some((id) => id.toString() === userBId.toString());
}

export const sendMessage = async (req, res) => {
    try {
        let senderId = req.userId;
        let { receiverId } = req.params;
        let { text } = req.body;

        if (senderId == receiverId) {
            return res.status(400).json({ message: "you can not message yourself" });
        }

        let connected = await areConnected(senderId, receiverId);
        if (!connected) {
            return res.status(403).json({ message: "you can only message your connections" });
        }

        let image = "";
        if (req.file) {
            image = await uploadOnCloudinary(req.file.path);
        }

        if (!text?.trim() && !image) {
            return res.status(400).json({ message: "message can not be empty" });
        }

        let receiverSocketId = userShocketMap.get(receiverId);

        let message = await Message.create({
            sender: senderId,
            receiver: receiverId,
            text: text || "",
            image,
            status: receiverSocketId ? "delivered" : "sent"
        });

        message = await message.populate("sender", "firstName lastName profileImage");
        message = await message.populate("receiver", "firstName lastName profileImage");

        // deliver instantly to the receiver if they're online
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", message);
        }

        // let the sender's own UI know the delivery status (single vs double gray tick)
        let senderSocketId = userShocketMap.get(senderId);
        if (senderSocketId) {
            io.to(senderSocketId).emit("messageStatusUpdate", { messageId: message._id, status: message.status });
        }

        return res.status(201).json(message);
    } catch (error) {
        console.log("sendMessage: ", error);
        return res.status(500).json({ message: `sendMessage: ${error}` });
    }
}

export const getMessages = async (req, res) => {
    try {
        let myId = req.userId;
        let { userId } = req.params;

        let messages = await Message.find({
            $or: [
                { sender: myId, receiver: userId },
                { sender: userId, receiver: myId }
            ]
        }).sort({ createdAt: 1 });

        // mark any messages the other person sent me as "seen" now that I've opened the chat
        let unseenIds = messages
            .filter((m) => m.receiver.toString() === myId && m.status !== "seen")
            .map((m) => m._id);

        if (unseenIds.length > 0) {
            await Message.updateMany({ _id: { $in: unseenIds } }, { status: "seen" });
            messages.forEach((m) => {
                if (unseenIds.some((id) => id.equals(m._id))) m.status = "seen";
            });

            let senderSocketId = userShocketMap.get(userId);
            if (senderSocketId) {
                io.to(senderSocketId).emit("messagesSeen", { by: myId, messageIds: unseenIds });
            }
        }

        return res.status(200).json(messages);
    } catch (error) {
        console.log("getMessages: ", error);
        return res.status(500).json({ message: `getMessages: ${error}` });
    }
}

export const getConversations = async (req, res) => {
    try {
        let myId = req.userId;
        let user = await User.findById(myId).populate("connection", "firstName lastName userName profileImage headline");

        let conversations = await Promise.all(user.connection.map(async (conn) => {
            let lastMessage = await Message.findOne({
                $or: [
                    { sender: myId, receiver: conn._id },
                    { sender: conn._id, receiver: myId }
                ]
            }).sort({ createdAt: -1 });

            let unreadCount = await Message.countDocuments({
                sender: conn._id,
                receiver: myId,
                status: { $ne: "seen" }
            });

            return { user: conn, lastMessage, unreadCount };
        }));

        conversations.sort((a, b) => {
            let aTime = a.lastMessage ? new Date(a.lastMessage.createdAt) : new Date(0);
            let bTime = b.lastMessage ? new Date(b.lastMessage.createdAt) : new Date(0);
            return bTime - aTime;
        });

        return res.status(200).json(conversations);
    } catch (error) {
        console.log("getConversations: ", error);
        return res.status(500).json({ message: `getConversations: ${error}` });
    }
}