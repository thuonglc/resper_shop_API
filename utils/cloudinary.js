import cloudinary from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

const cloudinaryConfig = cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinaryConfig;
