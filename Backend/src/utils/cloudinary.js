import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

(async function () {
  // Configuration
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const uploadOnCloudinary = async (localfilepath) => {
    try {
      if (!localfilepath) return null;

      //upload file on cloudinary
      const response = await cloudinary.uploader.upload(localfilepath, {
        resource_type: "auto",
      });
      console.log(`file uploaded on cloudinary ${response.url}`);
      return response;
    } catch (error) {
      fs.unlinkSync(localfilepath); //remove the file as upload operation got failed
    }
  };
})();
