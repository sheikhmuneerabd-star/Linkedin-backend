import jwt from 'jsonwebtoken';

const isAuth = (req, res, next) => {
    try {
        let {token} = req.cookies;
        if(!token){
            return res.status(400).json({message: "user doesn't have token"});
        }
        let verifyToken = jwt.verify(token, process.env.JWT_SECRET);
        if(!verifyToken){
            return res.status(400).json({message: "user doesn't have valid token"});
        }
        req.userId = verifyToken.user_id;
        next();
    } catch (error) {
        console.log("isAuth Error: ", error);
        return res.status(400).json({message: "user doesn't have token"});
    }
}

export default isAuth;