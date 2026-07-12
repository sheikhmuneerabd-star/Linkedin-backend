import generatedToken from "../config/token.js";
import User from "../models/user.model.js";
import bcrypt from 'bcryptjs';

export const signUp = async (req, res) => {
    try {
        let { firstName, lastName, userName, email, password } = req.body;

        let emailExist = await User.findOne({email});
        if(emailExist){
            return res.status(400).json({message: "Email already exist!"});
        }

        let userNameExist = await User.findOne({userName});
        if(userNameExist){
            return res.status(400).json({message: "User name already exist!"});
        }

        if(password.length < 8){
            return res.status(400).json({message: "Password must be at least 8 characters!"});
        }

        let passwordHash = await bcrypt.hash(password, 10);

        let user = await User.create({
            firstName,
            lastName,
            userName,
            email,
            password: passwordHash
        })

        let token = await generatedToken(user._id);

        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "strict",
            maxAge: 7*24*60*60*1000,
            secure: process.env.NODE_ENVIRONMENT === "production"
        })

        return res.status(201).json(user);
    } catch (error) {
        console.log("SignUp Error: ", error);
            
    }
}

export const login = async (req, res) => {
    try {
        let { email, password } = req.body;

        let user = await User.findOne({email});
        if(!user){
            return res.status(400).json({message: "User does not exist!"});
        }

        if(password.length < 8){
            return res.status(400).json({message: "Password must be at least 8 characters!"});
        }

        let isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch){
            return res.status(400).json({message: "Password Incorrect!"});
        }

        let token = await generatedToken(user._id);

        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "strict",
            maxAge: 7*24*60*60*1000,
            secure: process.env.NODE_ENVIRONMENT === "production"
        })

        return res.status(200).json(user);
    } catch (error) {
        console.log("Login Error: ", error);
        return res.status(500).json({message: "Login Error"});
    }
}

export const logout = (req, res) => {
    try {
        res.clearCookie("token");
        return res.status(200).json({message: "Logout successfully!"});
    } catch (error) {
        console.log("Logout Error: ", error);
        return res.status(500).json({message: "Logout Error"});
    }
}