/** Test du rendu Basic avec / sans description (champ facultatif). */
import { mkdir, readFile, writeFile } from "fs/promises"
import path from "path"
import { construireHtmlCatalogue } from "../lib/pdf/render"
import type { Client, Catalogue, Produit } from "../lib/db/schema"

let PHOTOS: string[] = []
async function chargerPhotos() {
  PHOTOS = await Promise.all(
    Array.from({ length: 4 }, async (_, i) => {
      const buf = await readFile(path.join(process.cwd(), "scripts", `photo${i}.jpg`))
      return `data:image/jpeg;base64,${buf.toString("base64")}`
    })
  )
}

const LONGUE =
  "Tissu wax authentique de qualité supérieure, coupe moderne et confortable. Disponible en tailles S à XXL, livraison rapide sur Douala et Yaoundé sous 48 heures."

function produits(mode: "toutes" | "aucune" | "mixte"): Produit[] {
  return Array.from({ length: 4 }, (_, i) => ({
    id: i + 1, catalogueId: 1,
    nom: `Robe wax élégance n°${i + 1}`, prix: 8500 + i * 2500,
    description:
      mode === "toutes" ? LONGUE
      : mode === "aucune" ? null
      : i % 2 === 0 ? LONGUE : null,
    photoUrl: PHOTOS[i % PHOTOS.length], photoPublicId: null, ordre: i, createdAt: new Date(),
  }))
}

async function main() {
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||= "demo"
  await chargerPhotos()
  const outDir = path.join(process.cwd(), "scripts", "out")
  await mkdir(outDir, { recursive: true })

  for (const mode of ["toutes", "aucune", "mixte"] as const) {
    const client: Client = {
      id: 1, nomEntreprise: "Boutique Mariama", secteur: "mode", whatsapp: "237675947160",
      forfait: "basic", creditsRestants: 3, dateAchat: new Date(),
      dateExpirationCredits: new Date(Date.now() + 180 * 86400000), notes: null, createdAt: new Date(),
    }
    const catalogue: Catalogue = {
      id: 1, clientId: 1, titre: "Démo", derniereGenerationAt: null, photosExpirees: false,
      couvFond: null, couvEncre: null, finFond: null, finEncre: null, createdAt: new Date(),
    }
    const html = await construireHtmlCatalogue(client, catalogue, produits(mode))
    await writeFile(path.join(outDir, `desc-${mode}.html`), html)
    console.log(`✓ desc-${mode}.html`)
  }
}
main().catch((e) => { console.error(e); process.exit(1) })
