import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Formats raster autorisés. SVG exclu volontairement (peut embarquer du script).
const FORMATS_AUTORISES = /^data:image\/(jpeg|jpg|png|webp|gif|heic|heif|avif);base64,/i

/**
 * Upload d'une photo produit.
 * - Dossier par catalogue : `catalogues/<id>` (purge simple 7 jours après génération)
 * - `limit` 2000px : on plafonne les dimensions sans déformer
 * Le recadrage intelligent (IA `g_auto`) est appliqué à la LIVRAISON via
 * `urlPhotoProduit`, pas au stockage — l'original reste disponible.
 */
export async function uploadPhotoProduit(
  base64Image: string,
  catalogueId: number
): Promise<{ url: string; publicId: string }> {
  if (!FORMATS_AUTORISES.test(base64Image)) {
    throw new Error("Format d'image non supporté")
  }
  const approxSize = (base64Image.length * 3) / 4
  if (approxSize > 10 * 1024 * 1024) {
    throw new Error("Fichier trop volumineux (max 10 Mo)")
  }

  const result = await cloudinary.uploader.upload(base64Image, {
    folder: `catalogues/${catalogueId}`,
    transformation: [{ width: 2000, height: 2000, crop: "limit" }],
  })

  return { url: result.secure_url, publicId: result.public_id }
}

/**
 * URL de livraison d'une photo produit pour les VIGNETTES du catalogue :
 * - `c_fill,g_auto` : recadrage carré INTELLIGENT (l'IA Cloudinary centre le produit)
 * - `f_auto,q_auto` : compression/format automatiques (WebP…)
 */
export function urlPhotoProduit(publicId: string, taille = 900): string {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  return `https://res.cloudinary.com/${cloud}/image/upload/c_fill,g_auto,w_${taille},h_${taille},f_auto,q_auto/${publicId}`
}

/**
 * URL de livraison pour la PAGE ZOOM du PDF : image ENTIÈRE, non recadrée,
 * en haute définition (`c_limit` plafonne à 1600px sans rien couper).
 * L'image est incrustée dans le PDF à la génération → zoom 100% offline.
 */
export function urlPhotoZoom(publicId: string): string {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  return `https://res.cloudinary.com/${cloud}/image/upload/c_limit,w_1600,h_1600,q_auto:good/${publicId}`
}

/**
 * Anti-SSRF / anti-injection : une URL de photo n'est acceptée en base et
 * dans les PDF que si elle pointe vers NOTRE espace Cloudinary. Empêche
 * d'injecter des URLs internes (169.254.x.x, localhost…) ou des schémas
 * dangereux (file:, javascript:) qui seraient chargés par Puppeteer.
 */
export function estUrlPhotoAutorisee(url: unknown): boolean {
  if (typeof url !== "string" || url.length > 600) return false
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  return url.startsWith(`https://res.cloudinary.com/${cloud}/`)
}

/** Supprime une photo produit isolée (suppression / remplacement d'un produit). */
export async function supprimerPhoto(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId)
  } catch (error) {
    console.error(`Erreur suppression photo ${publicId}:`, error)
  }
}

/** Purge toutes les photos d'un catalogue (cron 7 jours, ou suppression du catalogue). */
export async function supprimerPhotosCatalogue(catalogueId: number): Promise<void> {
  try {
    await cloudinary.api.delete_resources_by_prefix(`catalogues/${catalogueId}`)
    await cloudinary.api.delete_folder(`catalogues/${catalogueId}`)
  } catch (error) {
    console.error(`Erreur purge photos catalogue ${catalogueId}:`, error)
  }
}
