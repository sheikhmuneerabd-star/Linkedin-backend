import jwt from 'jsonwebtoken';

const generatedToken = async (user_id) => {
    try {
        let token = await jwt.sign({user_id}, process.env.JWT_SECRET, {
            expiresIn: "7d"
        })
        return token;
    } catch (error) {
        console.log("token Error: ", error);
    }
}

export default generatedToken;