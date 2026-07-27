import { NextRequest, NextResponse } from "next/server"
import { asc, eq } from "drizzle-orm"
import { verifierEtRafraichir } from "@/lib/admin/auth"
import { db, catalogues, clients, produits } from "@/lib/db"
import { construireHtmlCatalogue } from "@/lib/pdf/render"
import { htmlVersPdf } from "@/lib/pdf/browser"
import { assainirNomFichier } from "@/lib/utils"

export const runtime = "nodejs"
export const maxDuration = 120

/**
 * Génère le PDF du catalogue et le renvoie directement en téléchargement,
 * nommé d'après l'entreprise du client. Aucun stockage en ligne du PDF.
 * Relance la fenêtre de rétention des photos (7 jours).
 */
export async function POST(req: NextRequest) {
  if (!(await verifierEtRafraichir())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const catalogueId = Number(body?.catalogueId)
  if (!Number.isInteger(catalogueId)) {
    return NextResponse.json({ error: "Catalogue invalide" }, { status: 400 })
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

  const listeProduits = await db()
    .select()
    .from(produits)
    .where(eq(produits.catalogueId, catalogueId))
    .orderBy(asc(produits.ordre), asc(produits.id))

  if (listeProduits.length === 0) {
    return NextResponse.json(
      { error: "Ajoute au moins un produit avant de générer le catalogue" },
      { status: 400 }
    )
  }

  try {
    const html = await construireHtmlCatalogue(client, catalogue, listeProduits)
    const pdf = await htmlVersPdf(html)

    // La génération (re)lance la fenêtre de rétention des photos : 7 jours
    await db()
      .update(catalogues)
      .set({ derniereGenerationAt: new Date() })
      .where(eq(catalogues.id, catalogueId))

    const nomFichier = `${assainirNomFichier(client.nomEntreprise)}.pdf`
    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${nomFichier}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (e) {
    console.error("Erreur génération PDF:", e)
    return NextResponse.json(
      { error: "La génération du PDF a échoué. Réessaie dans un instant." },
      { status: 500 }
    )
  }
}
