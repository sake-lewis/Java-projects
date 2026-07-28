import { NextRequest, NextResponse } from "next/server"
import { asc, eq } from "drizzle-orm"
import { verifierEtRafraichir } from "@/lib/admin/auth"
import { db, catalogues, clients, produits } from "@/lib/db"
import { construireHtmlCatalogue } from "@/lib/pdf/render"

export const runtime = "nodejs"

/**
 * Aperçu HTML du catalogue — exactement le même moteur de rendu que le PDF
 * (mêmes templates Handlebars, mêmes ambiances, mêmes couleurs), mais sans
 * Puppeteer : le HTML est renvoyé tel quel et affiché dans l'éditeur.
 *
 * GRATUIT : ne débite aucun crédit et ne touche pas à derniereGenerationAt
 * (contrairement à la génération du PDF).
 */

/** Mise à l'échelle : les pages A4 (210 mm ≈ 794 px) s'adaptent à la largeur du panneau. */
const SCRIPT_AJUSTEMENT = `<script>
(function () {
  var LARGEUR_A4 = 794;
  function ajuster() {
    var w = document.documentElement.clientWidth;
    if (w > 0) document.body.style.zoom = String(w / LARGEUR_A4);
  }
  window.addEventListener("resize", ajuster);
  ajuster();
})();
</script>`

function pageMessage(message: string): string {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"></head>
<body style="margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:Arial,sans-serif;background:#F7F4EC;color:#6B6455;text-align:center;padding:24px">
<p style="max-width:420px;line-height:1.6">${message}</p></body></html>`
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await verifierEtRafraichir())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { id } = await params
  const catalogueId = Number(id)
  if (!Number.isInteger(catalogueId)) {
    return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 })
  }

  const [catalogue] = await db()
    .select()
    .from(catalogues)
    .where(eq(catalogues.id, catalogueId))
  if (!catalogue) {
    return NextResponse.json({ error: "Catalogue introuvable" }, { status: 404 })
  }

  const [client] = await db()
    .select()
    .from(clients)
    .where(eq(clients.id, catalogue.clientId))
  if (!client) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 })
  }

  const listeProduits = await db()
    .select()
    .from(produits)
    .where(eq(produits.catalogueId, catalogueId))
    .orderBy(asc(produits.ordre), asc(produits.id))

  try {
    let html: string
    if (listeProduits.length === 0) {
      html = pageMessage(
        "Ajoute un premier produit pour voir l'aperçu du catalogue ici. La couverture et les couleurs s'afficheront aussi."
      )
    } else {
      html = await construireHtmlCatalogue(client, catalogue, listeProduits)
      html = html.replace("</body>", `${SCRIPT_AJUSTEMENT}</body>`)
    }

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    })
  } catch (e) {
    console.error("Erreur aperçu catalogue:", e)
    return new NextResponse(pageMessage("L'aperçu n'a pas pu être généré. Réessaie dans un instant."), {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
    })
  }
}
