import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadPhoto(base64Image: string, token: string): Promise<string> {
  if (!base64Image.startsWith('data:image/')) {
    throw new Error("Fichier invalide : doit être une image");
  }

  // Vérification approximative de la taille (base64 est ~33% plus grand que le binaire)
  const approxSize = (base64Image.length * 3) / 4;
  if (approxSize > 10 * 1024 * 1024) {
    throw new Error("Fichier trop volumineux (max 10 Mo)");
  }

  const result = await cloudinary.uploader.upload(base64Image, {
    folder: `everbloom/${token}`,
    transformation: [{
      width: 1080,
      height: 1920,
      crop: 'fill',
      gravity: 'center'
    }]
  });

  return result.secure_url;
}

export async function supprimerPhotosSession(token: string): Promise<void> {
  try {
    await cloudinary.api.delete_resources_by_prefix(`everbloom/${token}`);
    // Note: delete_folder only works if the folder is empty
    await cloudinary.api.delete_folder(`everbloom/${token}`);
  } catch (error) {
    console.error(`Erreur lors de la suppression des photos Cloudinary pour le token ${token}:`, error);
  }
}
