const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const createStorage = (folder, resourceType = 'auto') =>
  new CloudinaryStorage({
    cloudinary,
    params: {
      folder: `gym-management/${folder}`,
      resource_type: resourceType,
      allowed_formats: resourceType === 'video'
        ? ['mp4', 'mov', 'avi']
        : ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      transformation: resourceType === 'image'
        ? [{ width: 1200, height: 800, crop: 'limit', quality: 'auto' }]
        : [],
    },
  });

const uploadAvatar = multer({
  storage: createStorage('avatars', 'image'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'), false);
  },
});

const uploadExerciseMedia = multer({
  storage: createStorage('exercises', 'auto'),
  limits: { fileSize: 100 * 1024 * 1024 },
});

const deleteMedia = async (publicId) => {
  return await cloudinary.uploader.destroy(publicId);
};

module.exports = { cloudinary, uploadAvatar, uploadExerciseMedia, deleteMedia };
