import crypto from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { and, eq, gt, isNotNull, lt } from "drizzle-orm"
import { db, catalogues, clients, produits } from "@/lib/db"
import { supprimerPhotosCatalogue } from "@/lib/cloudinary"
import { RETENTION_PHOTOS_JOURS } from "@/lib/config"

export const runtime = "nodejs"
export const maxDuration = 60

/**
 * Cron quotidien (2h UTC — voir vercel.json) :
 * 1. Purge les photos Cloudinary des catalogues générés il y a plus de
 *    7 jours (règle validée : rétention 7 jours après la dernière génération).
 * 2. Met à zéro les crédits des clients dont la validité (6 mois) est dépassée.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const auth = req.headers.get("authorization") || ""
  const attendu = `Bearer ${secret}`
  // Comparaison à temps constant (évite les attaques par mesure de temps)
  const valide =
    !!secret &&
    auth.length === attendu.length &&
    crypto.timingSafeEqual(Buffer.from(auth), Buffer.from(attendu))
  if (!valide) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const seuil = new Date(Date.now() - RETENTION_PHOTOS_JOURS * 24 * 60 * 60 * 1000)

  // --- 1. Photos à purger ---
  const aPurger = await db()
    .select({ id: catalogues.id })
    .from(catalogues)
    .where(
      and(
        eq(catalogues.photosExpirees, false),
        isNotNull(catalogues.derniereGenerationAt),
        lt(catalogues.derniereGenerationAt, seuil)
      )
    )

  for (const c of aPurger) {
    await supprimerPhotosCatalogue(c.id)
    await db()
      .update(produits)
      .set({ photoUrl: null, photoPublicId: null })
      .where(eq(produits.catalogueId, c.id))
    await db()
      .update(catalogues)
      .set({ photosExpirees: true })
      .where(eq(catalogues.id, c.id))
  }

  // --- 2. Crédits expirés (6 mois) ---
  const expires = await db()
    .update(clients)
    .set({ creditsRestants: 0 })
    .where(
      and(
        lt(clients.dateExpirationCredits, new Date()),
        gt(clients.creditsRestants, 0)
      )
    )
    .returning({ id: clients.id })

  return NextResponse.json({
    ok: true,
    photosPurgees: aPurger.length,
    creditsExpires: expires.length,
    date: new Date().toISOString(),
  })
}
