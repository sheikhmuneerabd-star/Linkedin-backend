import uploadOnCloudinary from "../config/cloudinary.js";
import { io, userShocketMap } from "../index.js";
import Notification from "../models/notification.js";
import Post from "../models/post.model.js";

export const createPost = async (req, res) => {
    try {
        let { description } = req.body;

        let newPost;
        if(req.file){
            let image = await uploadOnCloudinary(req.file.path);
            newPost = await Post.create({
                author: req.userId,
                description,
                image
            })
        }else{
            newPost = await Post.create({
                author: req.userId,
                description
            })
        }

        // populate author info so every connected client can render the post immediately
        newPost = await newPost.populate("author", "firstName lastName profileImage headline userName");

        // broadcast the new post to everyone in real time (no refresh needed)
        io.emit("newPost", newPost);

        return res.status(201).json(newPost);
    } catch (error) {
        return res.status(201).json(`create post error: `, error);
    }
}

export const getPost = async (req, res) => {
    try {
        let post = await Post.find()
        .populate("author", "firstName lastName profileImage headline userName")
        .sort({createdAt: -1})
        .populate("comment.user", "firstName lastName profileImage headline");
        return res.status(200).json(post);
    } catch (error) {
        console.log("get post error: ", error); 
        return res.status(201).json(`get post error: `, error);
    }
}

export const like = async (req, res) => {
    try {
        let postId = req.params.id;
        let userId = req.userId;

        let post = await Post.findById(postId);

        if(!post){
            return res.status(400).json({message: "post not found"})
        }

        if(post.like.includes(userId)){
            post.like = post.like.filter((postId) => postId != userId)
        }else{
            post.like.push(userId);

            if(post.author != userId){
                let notification = await Notification.create({
                    receiver: post.author,
                    type: "like",
                    relatedUser: userId,
                    relatedPost: postId
                })

                notification = await notification.populate("relatedUser", "firstName lastName profileImage");
                notification = await notification.populate("relatedPost", "image description");

                let receiverSocketId = userShocketMap.get(post.author.toString());
                if(receiverSocketId){
                    io.to(receiverSocketId).emit("newNotification", notification);
                }
            }
        }

        await post.save()
        io.emit("likeUpdated", {postId, likes: post.like})

        return res.status(200).json(post)
    } catch (error) {
        console.log("error like: ", error);
        return res.status(200).json({message: "error like: ", error})
    }
}

export const comment = async (req, res) => {
    try {
        let postId = req.params.id;
        let userId = req.userId;
        let {content} = req.body;

        let post = await Post.findByIdAndUpdate(postId, {
            $push: {comment: {content, user:userId}}
        }, {new: true})
        .populate("comment.user", "firstName lastName profileImage headline");

        if(post.author != userId){
            let notification = await Notification.create({
                receiver: post.author,
                type: "comment",
                relatedUser: userId,
                relatedPost: postId
            })

            notification = await notification.populate("relatedUser", "firstName lastName profileImage");
            notification = await notification.populate("relatedPost", "image description");

            let receiverSocketId = userShocketMap.get(post.author.toString());
            if(receiverSocketId){
                io.to(receiverSocketId).emit("newNotification", notification);
            }
        }

        io.emit("commentAdded", {postId, comm: post.comment})
        
        return res.status(200).json(post);
    } catch (error) {
        console.log("error comment: ", error);
        return res.status(200).json({message: "error comment: ", error})
    }
}