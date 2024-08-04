import { v2 as cloudinary } from "cloudinary";
import fs from "fs"

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return "No filie Path available"
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // console.log("File is uploaded on cloudinary", response.url)
        fs.unlinkSync(localFilePath)
        return response;
    } catch (err) {
        fs.unlinkSync(localFilePath)
        return "Couldn't Upload file"
    }
}
const deleteFromCloudinary = async (oldurl) => {
    try {
        if (!oldurl) return "Invalid url"
        const res = await cloudinary.uploader.destroy(oldurl.substring(oldurl.lastIndexOf('/')+1, oldurl.lastIndexOf('.')));
    } catch {
        console.log("coluldn't delte file")
    }
}
export { uploadOnCloudinary, deleteFromCloudinary }