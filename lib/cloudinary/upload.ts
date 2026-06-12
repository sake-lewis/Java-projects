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

  // `limit` plafonne les dimensions SANS changer le rapport largeur/hauteur :
  // le recadrage intelligent (mise en page par orientation) et le cadrage
  // manuel dépendent du format naturel de la photo.
  const result = await cloudinary.uploader.upload(base64Image, {
    folder: `everbloom/${token}`,
    transformation: [{
      width: 1600,
      height: 1600,
      crop: 'limit'
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

// public_id du PDF dans Cloudinary (resource_type "raw", hors du dossier photos
// pour ne pas être supprimé avec elles après génération).
function pdfPublicId(token: string): string {
  return `everbloom-pdf/${token}.pdf`;
}

/**
 * Assainit le nom de catalogue pour servir de nom de fichier sur tous les OS.
 * - Retire les caractères interdits sur Windows/macOS (< > : " / \ | ? *)
 * - Remplace les espaces et caractères non ASCII sûrs par "-"
 * - Tronque à 80 caractères pour éviter les limites de système de fichiers
 * - Fallback "catalogue" si le résultat est vide
 *
 * Note : on garde les lettres/chiffres ASCII, le tiret et l'underscore. Les
 * accents sont retirés (NFD) pour éviter les problèmes d'encodage HTTP dans
 * l'URL Cloudinary.
 */
function assainirNomFichier(nom: string): string {
  const sansAccents = nom.normalize('NFD').replace(/[̀-ͯ]/g, '');
  const propre = sansAccents
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')   // caractères interdits
    .replace(/[^A-Za-z0-9._-]+/g, '-')        // tout le reste → tiret
    .replace(/-+/g, '-')                      // tirets multiples
    .replace(/^[-.]+|[-.]+$/g, '')            // tirets/points en début/fin
    .slice(0, 80);
  return propre || 'catalogue';
}

/**
 * Stocke le PDF généré sur Cloudinary en "raw" (fichier livré tel quel, non
 * soumis à la restriction de livraison des PDF "image" de Cloudinary).
 * Renvoie une URL de téléchargement direct (fl_attachment), avec un nom de
 * fichier dérivé du nom du catalogue choisi par le client.
 */
export async function uploadPdf(
  buffer: Buffer,
  token: string,
  nomCatalogue: string
): Promise<string> {
  const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: 'raw', public_id: pdfPublicId(token), overwrite: true },
      (error, res) => (error || !res ? reject(error) : resolve(res as { secure_url: string }))
    );
    stream.end(buffer);
  });

  // fl_attachment:<nom> → Cloudinary sert le PDF avec
  // Content-Disposition: attachment;filename=<nom>.pdf
  // → le téléchargement reçoit directement le nom du catalogue.
  const nomFichier = assainirNomFichier(nomCatalogue);
  return result.secure_url.replace('/raw/upload/', `/raw/upload/fl_attachment:${nomFichier}/`);
}

/** Supprime le PDF Cloudinary d'une session (appelé à l'expiration). */
export async function supprimerPdf(token: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(pdfPublicId(token), { resource_type: 'raw' });
  } catch (error) {
    console.error(`Erreur lors de la suppression du PDF Cloudinary pour le token ${token}:`, error);
  }
}
