import mongoose from "mongoose"
import dotenv from 'dotenv'
dotenv.config();
let mongoDb_url = process.env.MONGODB_URL;
const connectDb = async () => {
    await mongoose.connect(mongoDb_url);
    console.log("connect Db");
}
export default connectDb;