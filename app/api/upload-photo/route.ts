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

    if (!token || !image) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 })
    }

    const session = await verifierToken(token)
    if (!session) {
      return NextResponse.json({ error: "Session invalide" }, { status: 403 })
    }

    const url = await uploadPhoto(image, token)
    return NextResponse.json({ url })
  } catch (error: any) {
    console.error("Erreur upload photo:", error)
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { token, url } = await request.json()

    if (!token || !url) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 })
    }

    const session = await verifierToken(token)
    if (!session) {
      return NextResponse.json({ error: "Session invalide" }, { status: 403 })
    }

    // Extraire le public_id de l'URL Cloudinary
    // Format type: https://res.cloudinary.com/[cloud_name]/image/upload/v[version]/everbloom/[token]/[filename].[ext]
    const parts = url.split('/')
    const folderIndex = parts.indexOf('everbloom')
    if (folderIndex !== -1) {
      const publicIdWithExt = parts.slice(folderIndex).join('/')
      const publicId = publicIdWithExt.split('.')[0]
      await cloudinary.uploader.destroy(publicId)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Erreur suppression photo:", error)
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 })
  }
}
