// Préparation client d'une photo avant upload : lecture des dimensions
// naturelles (pour le recadrage intelligent) + recompression JPEG.
// On plafonne le grand côté à 1600 px : suffisant pour une page A4 en 150 dpi,
// et le corps de requête reste loin de la limite Vercel (~4,5 Mo).

const COTE_MAX = 1600
const QUALITE = 0.9

export interface PhotoPreparee {
  base64: string
  ratio: number // largeur / hauteur
}

export function preparerPhoto(file: File): Promise<PhotoPreparee> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const ratio = img.naturalWidth / img.naturalHeight
      const echelle = Math.min(1, COTE_MAX / Math.max(img.naturalWidth, img.naturalHeight))
      const w = Math.round(img.naturalWidth * echelle)
      const h = Math.round(img.naturalHeight * echelle)

      const canvas = document.createElement("canvas")
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("Canvas non disponible"))
        return
      }
      ctx.drawImage(img, 0, 0, w, h)
      resolve({ base64: canvas.toDataURL("image/jpeg", QUALITE), ratio })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Image illisible"))
    }
    img.src = url
  })
}
