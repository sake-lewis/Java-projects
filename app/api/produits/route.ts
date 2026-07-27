import { NextRequest, NextResponse } from "next/server"
import { eq, sql } from "drizzle-orm"
import { verifierEtRafraichir } from "@/lib/admin/auth"
import { db, catalogues, clients, produits } from "@/lib/db"
import { FORFAITS } from "@/lib/config"
import { verifierEtDebiterCredit } from "@/lib/credits"
import { estUrlPhotoAutorisee } from "@/lib/cloudinary"

/**
 * Ajout d'un produit à un catalogue.
 * - Plafond de produits du forfait appliqué (blocage si dépassement)
 * - 1 crédit débité si le catalogue a déjà été généré (modification payante)
 */
export async function POST(req: NextRequest) {
  if (!(await verifierEtRafraichir())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Corps invalide" }, { status: 400 })

  const catalogueId = Number(body.catalogueId)
  const nom = String(body.nom || "").trim()
  const prix = Number(body.prix)
  const description = String(body.description || "").trim() || null
  const photoUrl = body.photoUrl ? String(body.photoUrl) : null
  const photoPublicId = body.photoPublicId ? String(body.photoPublicId) : null

  if (!Number.isInteger(catalogueId)) {
    return NextResponse.json({ error: "Catalogue invalide" }, { status: 400 })
  }
  if (nom.length < 1 || nom.length > 80) {
    return NextResponse.json({ error: "Nom du produit requis (max 80 caractères)" }, { status: 400 })
  }
  if (!Number.isFinite(prix) || prix < 0 || prix > 1_000_000_000) {
    return NextResponse.json({ error: "Prix invalide" }, { status: 400 })
  }
  if (description && description.length > 220) {
    return NextResponse.json({ error: "Description trop longue (max 220 caractères)" }, { status: 400 })
  }
  // Anti-SSRF : seules les photos de NOTRE Cloudinary sont acceptées
  if (photoUrl && !estUrlPhotoAutorisee(photoUrl)) {
    return NextResponse.json({ error: "URL de photo non autorisée" }, { status: 400 })
  }
  if (photoPublicId && (photoPublicId.length > 300 || photoPublicId.includes(".."))) {
    return NextResponse.json({ error: "Identifiant de photo invalide" }, { status: 400 })
  }

  const [catalogue] = await db()
    .select()
    .from(catalogues)
    .where(eq(catalogues.id, catalogueId))
  if (!catalogue) return NextResponse.json({ error: "Catalogue introuvable" }, { status: 404 })

  const [client] = await db()
    .select()
    .from(clients)
    .where(eq(clients.id, catalogue.clientId))
  if (!client) return NextResponse.json({ error: "Client introuvable" }, { status: 404 })

  // Plafond de produits du forfait
  const [{ total }] = await db()
    .select({ total: sql<number>`count(*)::int` })
    .from(produits)
    .where(eq(produits.catalogueId, catalogueId))
  const max = FORFAITS[client.forfait].produits_max
  if (total >= max) {
    return NextResponse.json(
      {
        error: `Limite du forfait ${FORFAITS[client.forfait].label} atteinte (${max} produits). Propose au client un forfait supérieur.`,
      },
      { status: 409 }
    )
  }

  // Crédit de modification si le catalogue est déjà livré
  const debit = await verifierEtDebiterCredit(client, catalogue)
  if (!debit.ok) {
    return NextResponse.json({ error: debit.message, raison: debit.raison }, { status: 402 })
  }

  const [produit] = await db()
    .insert(produits)
    .values({
      catalogueId,
      nom,
      prix: Math.round(prix),
      description,
      photoUrl,
      photoPublicId,
      ordre: total,
    })
    .returning()

  return NextResponse.json({
    produit,
    creditsRestants: debit.creditsRestants,
    modificationGratuite: debit.gratuit,
  })
}
