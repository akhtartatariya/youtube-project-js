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
                { resource_type: "auto" }
            )
            .catch((error) => {
                console.log(" error in uploading to cloudinary", error);
            });
        console.log("uploaded file is : ", uploadResult.url)
        if (uploadResult?.url) fs.unlinkSync(localFilePath)

        return uploadResult
    } catch (error) {
        console.log("error in connecting to cloudinary", error)
        fs.unlinkSync(localFilePath)
        return null
    }

}
// delete image from cloudinary
export async function deleteToCloudinary(path) {
    try {
        const uploadResult = await cloudinary.uploader.destroy(path, { resource_type: "image" })
        console.log(" deleted file is : ", uploadResult.result)
        return uploadResult.result
    } catch (error) {
        console.log("error in connecting to cloudinary", error)
    }
}
// delete video from cloudinary
export async function deleteVideoFromCloudinary(path) {
    try {
        const uploadResult = await cloudinary.uploader.destroy(path, { resource_type: "video" })
        console.log(" deleted file is : ", uploadResult.result)
        return uploadResult.result
    } catch (error) {
        console.log("error in connecting to cloudinary", error)
    }
}