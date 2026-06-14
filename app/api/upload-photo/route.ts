import { NextRequest, NextResponse } from "next/server"
import { verifierToken } from "@/lib/session/manager"
import { uploadPhoto } from "@/lib/cloudinary/upload"
import { v2 as cloudinary } from 'cloudinary'

export const runtime = 'nodejs'
export const maxDuration = 30

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request: NextRequest) {
  try {
    const { token, image } = await request.json()

    if (!token || typeof image !== "string" || !image) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 })
    }

    const session = await verifierToken(token)
    if (!session) {
      return NextResponse.json({ error: "Session invalide" }, { status: 403 })
    }

    // Formats raster uniquement (le SVG peut embarquer du script).
    if (!/^data:image\/(jpeg|jpg|png|webp|gif|heic|heif|avif);base64,/i.test(image)) {
      return NextResponse.json({ error: "Format d'image non supporté" }, { status: 400 })
    }
    // Plafond de taille côté serveur (base64 ~+33 %).
    if ((image.length * 3) / 4 > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Image trop volumineuse (max 10 Mo)" }, { status: 413 })
    }

    try {
      const url = await uploadPhoto(image, token)
      return NextResponse.json({ url })
    } catch (e) {
      // On ne renvoie pas le détail de l'erreur Cloudinary au client.
      console.error("Erreur upload Cloudinary:", e)
      return NextResponse.json({ error: "Échec de l'envoi de l'image" }, { status: 502 })
    }
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { token, url } = await request.json()

    if (!token || !url || typeof url !== "string") {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 })
    }

    const session = await verifierToken(token)
    if (!session) {
      return NextResponse.json({ error: "Session invalide" }, { status: 403 })
    }

    // Valide d'abord que l'URL pointe bien vers le bon compte Cloudinary
    // (garde anti-SSRF + anti-suppression croisée).
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    if (!cloudName || !url.startsWith(`https://res.cloudinary.com/${cloudName}/`)) {
      return NextResponse.json({ error: "URL invalide" }, { status: 400 })
    }

    // Extrait le public_id et vérifie qu'il appartient au dossier du token.
    // Sans cette garde, un client avec un token valide pourrait supprimer la
    // photo d'un autre client en devinant son URL.
    const parts = url.split("/")
    const folderIndex = parts.indexOf("everbloom")
    if (folderIndex === -1) {
      return NextResponse.json({ error: "URL hors périmètre" }, { status: 400 })
    }
    const tokenDansUrl = parts[folderIndex + 1]
    if (tokenDansUrl !== token) {
      return NextResponse.json({ error: "Photo non rattachée à la session" }, { status: 403 })
    }

    const publicIdWithExt = parts.slice(folderIndex).join("/")
    const publicId = publicIdWithExt.split(".")[0]
    await cloudinary.uploader.destroy(publicId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erreur suppression photo:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
