import { io, userShocketMap } from "../index.js";
import Connection from "../models/connection.model.js";
import Notification from "../models/notification.js";
import User from "../models/user.model.js";

export const sendConnection = async (req, res) => {
    try {
        let {id} = req.params;
        let sender = req.userId;

        if(sender == id){
            return res.status(400).json({message: "you can not send request yourself"})
        }

        let user = await User.findById(sender);
        if(user.connection.includes(id)){
            return res.status(400).json({message: "you are already connected"})
        }

        let existingConnection = await Connection.findOne({
            sender,
            receiver: id,
            status: "pending"
        })

        if(existingConnection){
            return res.status(400).json({message: "request already exist"})
        }

        let newRequest = await Connection.create({
            sender,
            receiver: id
        })

        // populate so the receiver's Network page can render it immediately, no refresh needed
        newRequest = await newRequest.populate("sender", "firstName lastName userName profileImage headline");

        let receiverSocketId = userShocketMap.get(id);
        let senderSocketId = userShocketMap.get(sender);

        if(receiverSocketId){
            io.to(receiverSocketId).emit("statusUpdate", {updatedUserId: sender, newStatus: "received"})
            io.to(receiverSocketId).emit("newConnectionRequest", newRequest)
        }
        if(senderSocketId){
            io.to(senderSocketId).emit("statusUpdate", {updatedUserId: id, newStatus: "pending"})
        }

        return res.status(400).json(newRequest)
    } catch (error) {
        console.log("send Connection: ", error);
        return res.status(400).json({message: `send Connection: ${error}`})
    }
}

export const acceptConnection = async (req, res) => {
    try {
        let {connectionId} = req.params;
        let connection = await Connection.findById(connectionId);

        if(!connection){
            return res.status(400).json({message: "connection does not exist"})
        }

        if(connection.status != "pending"){
            return res.status(400).json({message: "request under process"})
        }

        connection.status = "accepted"

        let notification = await Notification.create({
            receiver: connection.sender,
            type: "connectionAccepted",
            relatedUser: req.userId,
        })

        notification = await notification.populate("relatedUser", "firstName lastName profileImage");

        await connection.save()
        await User.findByIdAndUpdate(req.userId, {
            $addToSet: {connection: connection.sender._id}
        })
        await User.findByIdAndUpdate(connection.sender._id, {
            $addToSet: {connection: req.userId}
        })

        let receiverSocketId = userShocketMap.get(connection.receiver._id.toString());
        let senderSocketId = userShocketMap.get(connection.sender._id.toString());

        if(receiverSocketId){
            io.to(receiverSocketId).emit("statusUpdate", {updatedUserId: connection.sender._id, newStatus: "disconnect"})
        }
        if(senderSocketId){
            io.to(senderSocketId).emit("statusUpdate", {updatedUserId: req.userId, newStatus: "disconnect"})
            io.to(senderSocketId).emit("newNotification", notification)
        }

        return res.status(200).json({message: "connection accepted"})
    } catch (error) {
        console.log("accept Connection: ", error);
        return res.status(200).json({message: `accept connection error: ${error}`})
    }
}

export const rejectConnection = async (req, res) => {
    try {
        let {connectionId} = req.params;
        let connection = await Connection.findById(connectionId);

        if(!connection){
            return res.status(400).json({message: "connection does not exist"})
        }

        if(connection.status != "pending"){
            return res.status(400).json({message: "request under process"})
        }

        connection.status = "rejected"
        await connection.save()

        // let the sender's button reset back to "Connect" instead of staying stuck on "Pending"
        let senderSocketId = userShocketMap.get(connection.sender.toString());
        if(senderSocketId){
            io.to(senderSocketId).emit("statusUpdate", {updatedUserId: connection.receiver.toString(), newStatus: "connect"})
        }

        return res.status(200).json({message: "connection rejected"})
    } catch (error) {
        console.log("reject Connection: ", error);
        return res.status(200).json({message: `rejected connection error: ${error}`})
    }
}

export const getConnectionStatus = async (req, res) => {
    try {
        const targetUserId = req.params.userId;
        const currentUserId = req.userId;

        let currentUser = await User.findById(currentUserId);
        if(currentUser.connection.includes(targetUserId)){
            return res.json({ status: "disconnect" })
        }

        const pendingRequest = await Connection.findOne({
            $or: [
                { sender: currentUserId, receiver: targetUserId },
                { sender: targetUserId, receiver: currentUserId },
            ],
            status: "pending"
        })
        
        if(pendingRequest){
            if(pendingRequest.sender.toString() === currentUserId.toString()){
                return res.json({ status: "pending" })
            }else{
                return res.json({ status: "received", requestId: pendingRequest._id })
            }
        }

        return res.json({ status: "connect" })
    } catch (error) {
        console.log("get Connection Status: ", error);
        return res.status(200).json({message: `getConnectionStatus error: ${error}`})
    }
}

export const removeConnection = async (req, res) => {
    try {
        const myId = req.userId;
        const otherUserId = req.params.userId;

        await User.findByIdAndUpdate(myId, { $pull: { connection: otherUserId } })
        await User.findByIdAndUpdate(otherUserId, { $pull: { connection: myId } })

        let receiverSocketId = userShocketMap.get(otherUserId);
        let senderSocketId = userShocketMap.get(myId);

        if(receiverSocketId){
            io.to(receiverSocketId).emit("statusUpdate", {updatedUserId: myId, newStatus: "connect"})
        }
        if(senderSocketId){
            io.to(senderSocketId).emit("statusUpdate", {updatedUserId: otherUserId, newStatus: "connect"})
        }

        return res.json({ message: "Connection removed successfully" })
    } catch (error) {
        console.log("removeConnection: ", error);
        return res.status(200).json({message: `removeConnection: ${error}`})
    }
}

export const getConnectionRequests = async (req, res) => {
    try {
        const userId = req.userId;

        const requests = await Connection.find({ receiver: userId, status: "pending"}).populate("sender", "firstName lastName email userName profileImage headline")

        return res.status(200).json(requests)
    } catch (error) {
        console.log("getConnectionRequests: ", error);
        return res.status(200).json({message: `getConnectionRequests: ${error}`})
    }
}

export const getUserConnections = async (req, res) => {
    try {
        const userId = req.userId;

        const user = await User.findById(userId).populate("connection", "firstName lastName userName profileImage headline connection")

        return res.status(200).json(user.connection)
    } catch (error) {
        console.log("getUserConnections: ", error);
        return res.status(200).json({message: `getUserConnections: ${error}`})
    }
}