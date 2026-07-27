import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { verifierEtRafraichir } from "@/lib/admin/auth"
import { db, catalogues } from "@/lib/db"
import { uploadPhotoProduit, urlPhotoProduit } from "@/lib/cloudinary"

export const runtime = "nodejs"

/** Upload d'une photo produit (base64) vers Cloudinary. */
export async function POST(req: NextRequest) {
  if (!(await verifierEtRafraichir())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  // Lecture bornée : même en transfert "chunked" (sans Content-Length,
  // donc invisible pour le garde-fou du proxy), le corps est plafonné ici.
  const texte = await req.text().catch(() => "")
  if (texte.length > 15 * 1024 * 1024) {
    return NextResponse.json({ error: "Image trop volumineuse (max 10 Mo)" }, { status: 413 })
  }
  let body: { image?: unknown; catalogueId?: unknown } | null = null
  try {
    body = JSON.parse(texte)
  } catch {
    body = null
  }
  const image = body?.image
  const catalogueId = Number(body?.catalogueId)

  if (typeof image !== "string" || !Number.isInteger(catalogueId)) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 })
  }

  const [catalogue] = await db()
    .select()
    .from(catalogues)
    .where(eq(catalogues.id, catalogueId))
  if (!catalogue) return NextResponse.json({ error: "Catalogue introuvable" }, { status: 404 })

  try {
    const { url, publicId } = await uploadPhotoProduit(image, catalogueId)

    // De nouvelles photos existent : le catalogue n'est plus « photos expirées »
    if (catalogue.photosExpirees) {
      await db()
        .update(catalogues)
        .set({ photosExpirees: false })
        .where(eq(catalogues.id, catalogueId))
    }

    return NextResponse.json({
      url,
      publicId,
      apercu: urlPhotoProduit(publicId, 400),
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Échec de l'upload"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
