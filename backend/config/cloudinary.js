import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_USERNAME || process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a local file to Cloudinary and removes it from local disk storage.
 * @param {string} localFilePath - Local path of the uploaded file
 * @param {string} folder - Target Cloudinary folder
 * @returns {Promise<{secure_url: string, public_id: string}>}
 */
export async function uploadToCloudinaryAndCleanup(localFilePath, folder = "kidney_scans") {
  if (!localFilePath) return null;

  try {
    const result = await cloudinary.uploader.upload(localFilePath, {
      folder: folder,
      resource_type: "image",
    });

    // Safely delete from local disk so hard drive doesn't fill up
    if (fs.existsSync(localFilePath)) {
      await fs.promises.unlink(localFilePath);
      console.log(`Local file removed after Cloudinary backup: ${localFilePath}`);
    }

    return {
      secure_url: result.secure_url,
      public_id: result.public_id,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error.message);
    // Cleanup local file on error as well
    if (fs.existsSync(localFilePath)) {
      try {
        await fs.promises.unlink(localFilePath);
      } catch (_) {}
    }
    throw error;
  }
}

export default cloudinary;
