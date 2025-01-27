import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"
// (async function () {

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET  // Click 'View API Keys' above to copy your API secret
})
// })(); 

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        //upload the file on cloudinary
        console.log(localFilePath);

        const response = await cloudinary.uploader.upload(localFilePath,
            {
                resource_type: "auto"
            }
        )
        //file has been upload successfully
        console.log("file uploaded on cloudinary.");
        fs.unlinkSync(localFilePath)
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath)  // remove the locally saved temporary file as the upload operation got fialed

        return null;
    }
}

const deleteFromCloudinary = async (publicId, resource_type="image") => {

    try {
        if (!publicId) return null;

        // delete file from cloudinary
        const response = await cloudinary.uploader.destroy(publicId, { resource_type: `${resource_type}` })     // { resource_type: `${resource_type}` } take as argument
        return response;

    } catch (error) {

        return error;
    }
}

// Upload an image
// const uploadResult = cloudinary.uploader
//     .upload(
//         'https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg', {
//         public_id: 'shoes',
//     }
//     )
//     .catch((error) => {
//         console.log(error);
//     });

export { uploadOnCloudinary, deleteFromCloudinary }