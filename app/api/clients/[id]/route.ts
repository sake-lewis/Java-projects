import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { verifierEtRafraichir } from "@/lib/admin/auth"
import { db, clients, catalogues } from "@/lib/db"
import { FORFAITS, SECTEURS } from "@/lib/config"
import { normaliserWhatsapp } from "@/lib/utils"
import { supprimerPhotosCatalogue } from "@/lib/cloudinary"
import type { Forfait, Secteur } from "@/types"

type Params = { params: Promise<{ id: string }> }

/** Mise à jour des informations d'un client. */
export async function PATCH(req: NextRequest, { params }: Params) {
  if (!(await verifierEtRafraichir())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }
  const { id } = await params
  const clientId = Number(id)
  if (!Number.isInteger(clientId)) {
    return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 })
  }

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Corps invalide" }, { status: 400 })

  const maj: Partial<typeof clients.$inferInsert> = {}

  if (body.nomEntreprise !== undefined) {
    const nom = String(body.nomEntreprise).trim()
    if (nom.length < 2 || nom.length > 60) {
      return NextResponse.json({ error: "Nom d'entreprise invalide" }, { status: 400 })
    }
    maj.nomEntreprise = nom
  }
  if (body.secteur !== undefined) {
    if (!SECTEURS[body.secteur as Secteur]) {
      return NextResponse.json({ error: "Secteur invalide" }, { status: 400 })
    }
    maj.secteur = body.secteur as Secteur
  }
  if (body.forfait !== undefined) {
    if (!FORFAITS[body.forfait as Forfait]) {
      return NextResponse.json({ error: "Forfait invalide" }, { status: 400 })
    }
    maj.forfait = body.forfait as Forfait
  }
  if (body.whatsapp !== undefined) {
    const num = normaliserWhatsapp(String(body.whatsapp))
    if (num.length < 8 || num.length > 15) {
      return NextResponse.json({ error: "Numéro WhatsApp invalide" }, { status: 400 })
    }
    maj.whatsapp = num
  }
  if (body.notes !== undefined) {
    maj.notes = String(body.notes).trim() || null
  }

  if (Object.keys(maj).length === 0) {
    return NextResponse.json({ error: "Rien à mettre à jour" }, { status: 400 })
  }

  const [client] = await db()
    .update(clients)
    .set(maj)
    .where(eq(clients.id, clientId))
    .returning()

  if (!client) return NextResponse.json({ error: "Client introuvable" }, { status: 404 })
  return NextResponse.json({ client })
}

/** Suppression d'un client (catalogues, produits et photos inclus). */
export async function DELETE(_req: NextRequest, { params }: Params) {
  if (!(await verifierEtRafraichir())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }
  const { id } = await params
  const clientId = Number(id)
  if (!Number.isInteger(clientId)) {
    return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 })
  }

  const cats = await db()
    .select({ id: catalogues.id })
    .from(catalogues)
    .where(eq(catalogues.clientId, clientId))

  // Purge Cloudinary de chaque catalogue avant la cascade SQL
  for (const c of cats) {
    await supprimerPhotosCatalogue(c.id)
  }

  await db().delete(clients).where(eq(clients.id, clientId))
  return NextResponse.json({ ok: true })
}
