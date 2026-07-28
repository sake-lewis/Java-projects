import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { verifierEtRafraichir } from "@/lib/admin/auth"
import { db, catalogues } from "@/lib/db"
import { supprimerPhotosCatalogue } from "@/lib/cloudinary"

type Params = { params: Promise<{ id: string }> }

/**
 * Valide une couleur de couverture : hex strict "#RRGGBB", ou null pour
 * revenir à l'ambiance du secteur. `undefined` = champ non fourni (inchangé).
 */
function couleurValidee(valeur: unknown): string | null | undefined {
  if (valeur === undefined) return undefined
  if (valeur === null || valeur === "") return null
  const hex = String(valeur).trim()
  return /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : undefined
}

/**
 * Mise à jour d'un catalogue : titre et/ou couleurs de couverture
 * (1re et 4e de couverture). Les changements de couleurs sont gratuits
 * (comme le renommage) : ils ne décomptent aucun crédit.
 */
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
  const maj: Partial<{
    titre: string
    couvFond: string | null
    couvEncre: string | null
    finFond: string | null
    finEncre: string | null
  }> = {}

  // --- Titre (optionnel) ---
  if (body?.titre !== undefined) {
    const titre = String(body.titre || "").trim()
    if (titre.length < 1 || titre.length > 80) {
      return NextResponse.json({ error: "Titre invalide" }, { status: 400 })
    }
    maj.titre = titre
  }

  // --- Couleurs de couverture (optionnelles) ---
  const couleurs = body?.couleurs
  if (couleurs && typeof couleurs === "object") {
    for (const champ of ["couvFond", "couvEncre", "finFond", "finEncre"] as const) {
      const v = couleurValidee(couleurs[champ])
      if (v !== undefined) maj[champ] = v
      else if (couleurs[champ] !== undefined) {
        return NextResponse.json(
          { error: "Couleur invalide (format attendu : #RRGGBB)" },
          { status: 400 }
        )
      }
    }
  }

  if (Object.keys(maj).length === 0) {
    return NextResponse.json({ error: "Aucune modification fournie" }, { status: 400 })
  }

  const [catalogue] = await db()
    .update(catalogues)
    .set(maj)
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
