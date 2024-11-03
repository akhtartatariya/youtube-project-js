import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
export async function uploadToCloudinary(localFilePath) {

    try {
        // Configuration
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET
        });

        // Upload on Cloudinary
        const uploadResult = await cloudinary.uploader
            .upload(
                localFilePath,
                { resource_type: "auto", }
            )
            .catch((error) => {
                console.log(error);
            });
        if (uploadResult) fs.unlinkSync(localFilePath)
        return uploadResult
    } catch (error) {
        console.log("error in connecting to cloudinary", error)
        fs.unlinkSync(localFilePath)
        return null
    }

}