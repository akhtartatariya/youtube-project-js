import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
export async function uploadToCloudinary(localFilePath) {

    try {
        // Upload on Cloudinary
        const uploadResult = await cloudinary.uploader
            .upload(
                localFilePath,
                { resource_type: "auto", }
            )
            .catch((error) => {
                console.log(" error in uploading to cloudinary", error);
            });
        // console.log("uploaded file is : ", uploadResult.url)
        if (uploadResult?.url) fs.unlinkSync(localFilePath)

        return uploadResult
    } catch (error) {
        console.log("error in connecting to cloudinary", error)
        fs.unlinkSync(localFilePath)
        return null
    }

}
export async function deleteToCloudinary(path) {
    try {
        console.log(" path is : ", path)
        const uploadResult = await cloudinary.uploader.destroy(path)
        console.log(" deleted file is : ",uploadResult)
        if (!uploadResult.result == "ok") return null;
        return true
    } catch (error) {
        console.log("error in connecting to cloudinary", error)
    }
}