import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { verifierEtRafraichir } from "@/lib/admin/auth"
import { db, catalogues, clients, produits } from "@/lib/db"
import { verifierEtDebiterCredit } from "@/lib/credits"
import { estUrlPhotoAutorisee, supprimerPhoto } from "@/lib/cloudinary"

type Params = { params: Promise<{ id: string }> }

async function chargerContexte(produitId: number) {
  const [produit] = await db().select().from(produits).where(eq(produits.id, produitId))
  if (!produit) return null
  const [catalogue] = await db()
    .select()
    .from(catalogues)
    .where(eq(catalogues.id, produit.catalogueId))
  if (!catalogue) return null
  const [client] = await db()
    .select()
    .from(clients)
    .where(eq(clients.id, catalogue.clientId))
  if (!client) return null
  return { produit, catalogue, client }
}

/**
 * Modification d'un produit.
 * - Un simple réordonnancement (champ `ordre` seul) est gratuit.
 * - Tout changement de contenu (nom, prix, description, photo) coûte
 *   1 crédit si le catalogue a déjà été généré.
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  if (!(await verifierEtRafraichir())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }
  const { id } = await params
  const produitId = Number(id)
  if (!Number.isInteger(produitId)) {
    return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 })
  }

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Corps invalide" }, { status: 400 })

  const ctx = await chargerContexte(produitId)
  if (!ctx) return NextResponse.json({ error: "Produit introuvable" }, { status: 404 })
  const { produit, catalogue, client } = ctx

  const maj: Partial<typeof produits.$inferInsert> = {}
  let contenuModifie = false

  if (body.nom !== undefined) {
    const nom = String(body.nom).trim()
    if (nom.length < 1 || nom.length > 80) {
      return NextResponse.json({ error: "Nom du produit invalide" }, { status: 400 })
    }
    if (nom !== produit.nom) { maj.nom = nom; contenuModifie = true }
  }
  if (body.prix !== undefined) {
    const prix = Number(body.prix)
    if (!Number.isFinite(prix) || prix < 0 || prix > 1_000_000_000) {
      return NextResponse.json({ error: "Prix invalide" }, { status: 400 })
    }
    if (Math.round(prix) !== produit.prix) { maj.prix = Math.round(prix); contenuModifie = true }
  }
  if (body.description !== undefined) {
    const d = String(body.description).trim()
    if (d.length > 220) {
      return NextResponse.json({ error: "Description trop longue (max 220 caractères)" }, { status: 400 })
    }
    if ((d || null) !== produit.description) { maj.description = d || null; contenuModifie = true }
  }
  if (body.photoUrl !== undefined || body.photoPublicId !== undefined) {
    // Anti-SSRF : seules les photos de NOTRE Cloudinary sont acceptées
    if (body.photoUrl && !estUrlPhotoAutorisee(body.photoUrl)) {
      return NextResponse.json({ error: "URL de photo non autorisée" }, { status: 400 })
    }
    if (body.photoPublicId &&
        (String(body.photoPublicId).length > 300 || String(body.photoPublicId).includes(".."))) {
      return NextResponse.json({ error: "Identifiant de photo invalide" }, { status: 400 })
    }
    maj.photoUrl = body.photoUrl ? String(body.photoUrl) : null
    maj.photoPublicId = body.photoPublicId ? String(body.photoPublicId) : null
    contenuModifie = true
  }
  if (body.ordre !== undefined) {
    const ordre = Number(body.ordre)
    if (!Number.isInteger(ordre) || ordre < 0) {
      return NextResponse.json({ error: "Ordre invalide" }, { status: 400 })
    }
    maj.ordre = ordre
  }

  if (Object.keys(maj).length === 0) {
    return NextResponse.json({ error: "Rien à mettre à jour" }, { status: 400 })
  }

  let creditsRestants = client.creditsRestants
  let gratuit = true
  if (contenuModifie) {
    const debit = await verifierEtDebiterCredit(client, catalogue)
    if (!debit.ok) {
      return NextResponse.json({ error: debit.message, raison: debit.raison }, { status: 402 })
    }
    creditsRestants = debit.creditsRestants
    gratuit = debit.gratuit
  }

  // Remplacement de photo : on efface l'ancienne de Cloudinary
  if (contenuModifie && maj.photoPublicId !== undefined && produit.photoPublicId &&
      maj.photoPublicId !== produit.photoPublicId) {
    await supprimerPhoto(produit.photoPublicId)
  }

  const [majProduit] = await db()
    .update(produits)
    .set(maj)
    .where(eq(produits.id, produitId))
    .returning()

  return NextResponse.json({
    produit: majProduit,
    creditsRestants,
    modificationGratuite: gratuit,
  })
}

/** Suppression d'un produit (1 crédit si le catalogue est déjà livré). */
export async function DELETE(_req: NextRequest, { params }: Params) {
  if (!(await verifierEtRafraichir())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }
  const { id } = await params
  const produitId = Number(id)
  if (!Number.isInteger(produitId)) {
    return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 })
  }

  const ctx = await chargerContexte(produitId)
  if (!ctx) return NextResponse.json({ error: "Produit introuvable" }, { status: 404 })
  const { produit, catalogue, client } = ctx

  const debit = await verifierEtDebiterCredit(client, catalogue)
  if (!debit.ok) {
    return NextResponse.json({ error: debit.message, raison: debit.raison }, { status: 402 })
  }

  if (produit.photoPublicId) {
    await supprimerPhoto(produit.photoPublicId)
  }
  await db().delete(produits).where(eq(produits.id, produitId))

  return NextResponse.json({
    ok: true,
    creditsRestants: debit.creditsRestants,
    modificationGratuite: debit.gratuit,
  })
}
