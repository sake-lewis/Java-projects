import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { verifierEtRafraichir } from "@/lib/admin/auth"
import { db, catalogues } from "@/lib/db"
import { supprimerPhotosCatalogue } from "@/lib/cloudinary"

type Params = { params: Promise<{ id: string }> }

/** Renommage d'un catalogue. */
export async function PATCH(req: NextRequest, { params }: Params) {
  if (!(await verifierEtRafraichir())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }
  const { id } = await params
  const catalogueId = Number(id)
  if (!Number.isInteger(catalogueId)) {
    return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 })
  }

  const body = await req.json().catch(() => null)
  const titre = String(body?.titre || "").trim()
  if (titre.length < 1 || titre.length > 80) {
    return NextResponse.json({ error: "Titre invalide" }, { status: 400 })
  }

  const [catalogue] = await db()
    .update(catalogues)
    .set({ titre })
    .where(eq(catalogues.id, catalogueId))
    .returning()

  if (!catalogue) return NextResponse.json({ error: "Catalogue introuvable" }, { status: 404 })
  return NextResponse.json({ catalogue })
}

/** Suppression d'un catalogue (produits en cascade + purge photos). */
export async function DELETE(_req: NextRequest, { params }: Params) {
  if (!(await verifierEtRafraichir())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }
  const { id } = await params
  const catalogueId = Number(id)
  if (!Number.isInteger(catalogueId)) {
    return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 })
  }

  await supprimerPhotosCatalogue(catalogueId)
  await db().delete(catalogues).where(eq(catalogues.id, catalogueId))
  return NextResponse.json({ ok: true })
}
