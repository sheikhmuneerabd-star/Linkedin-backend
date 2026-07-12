import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({ 
    cloud_name: process.env.CLOUD_NAME, 
    api_key: process.env.CLOUD_API_KEY, 
    api_secret: process.env.CLOUD_API_SECRET
});

const uploadOnCloudinary = async (filePath) => {
    try {
        if(!filePath){
            return null;
        }
        let uploadResult = await cloudinary.uploader.upload(filePath, {timeout: 120000,});
        fs.unlinkSync(filePath);
        return uploadResult.secure_url;
    } catch (error) {
        if(filePath && fs.existsSync(filePath)){
            fs.unlinkSync(filePath);
        }
        console.log("uploadOnCloudinary: ", error);
        return null;
    }
}

export default uploadOnCloudinary;