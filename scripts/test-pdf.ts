/**
 * Test local de génération PDF — n'utilise PAS la base de données.
 * Génère un catalogue de démonstration pour chaque forfait :
 *   npx tsx scripts/test-pdf.ts
 * Sortie : scripts/out/demo-<forfait>.pdf
 */
import { mkdir, readFile, writeFile } from "fs/promises"
import path from "path"
import { construireHtmlCatalogue } from "../lib/pdf/render"
import { htmlVersPdf } from "../lib/pdf/browser"
import type { Client, Catalogue, Produit } from "../lib/db/schema"
import type { Forfait, Secteur } from "../types"

// Photos de démo locales (scripts/photo0.jpg … photo7.jpg) en data URL.
let PHOTOS: string[] = []
async function chargerPhotos() {
  PHOTOS = await Promise.all(
    Array.from({ length: 8 }, async (_, i) => {
      const buf = await readFile(path.join(process.cwd(), "scripts", `photo${i}.jpg`))
      return `data:image/jpeg;base64,${buf.toString("base64")}`
    })
  )
}

const NOMS = [
  "Robe wax élégance", "Ensemble pagne brodé", "Chemise lin premium",
  "Sac à main cuir", "Escarpins soirée", "Boubou grand modèle",
  "Montre classique dorée", "Foulard soie motifs",
]

function faireProduits(n: number, catalogueId: number): Produit[] {
  return Array.from({ length: n }, (_, i) => ({
    id: i + 1,
    catalogueId,
    nom: NOMS[i % NOMS.length] + (i >= NOMS.length ? ` n°${i + 1}` : ""),
    prix: 4500 + i * 1500,
    description:
      i % 3 === 0
        ? "Tissu de qualité supérieure, coupe moderne. Tailles S à XXL disponibles, livraison rapide sur Douala et Yaoundé."
        : i % 3 === 1
          ? "Article très demandé, stock limité."
          : null,
    photoUrl: i % 4 === 3 ? null : PHOTOS[i % PHOTOS.length], // 1 produit sur 4 sans photo
    photoPublicId: null,
    ordre: i,
    createdAt: new Date(),
  }))
}

async function main() {
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||= "demo"
  await chargerPhotos()
  const outDir = path.join(process.cwd(), "scripts", "out")
  await mkdir(outDir, { recursive: true })

  const cas: { forfait: Forfait; secteur: Secteur; n: number; suffixe?: string }[] = [
    { forfait: "basic", secteur: "mode", n: 8 },
    { forfait: "standard", secteur: "alimentation", n: 7 },
    { forfait: "premium", secteur: "electronique", n: 5 },
    { forfait: "premium", secteur: "beaute", n: 5, suffixe: "-floral" },
  ]

  for (const { forfait, secteur, n, suffixe } of cas) {
    const client: Client = {
      id: 1,
      nomEntreprise: "Boutique Mariama",
      secteur,
      whatsapp: "237675947160",
      forfait,
      creditsRestants: 3,
      dateAchat: new Date(),
      dateExpirationCredits: new Date(Date.now() + 180 * 86400000),
      notes:
        "Depuis 2018, Boutique Mariama sélectionne pour vous le meilleur, au meilleur prix. Commandez sur WhatsApp, livraison partout au Cameroun.",
      createdAt: new Date(),
    }
    const catalogue: Catalogue = {
      id: 1,
      clientId: 1,
      titre: "Boutique Mariama",
      derniereGenerationAt: null,
      photosExpirees: false,
      createdAt: new Date(),
    }

    const html = await construireHtmlCatalogue(client, catalogue, faireProduits(n, 1))
    const pdf = await htmlVersPdf(html)
    const fichier = path.join(outDir, `demo-${forfait}${suffixe || ""}.pdf`)
    await writeFile(fichier, pdf)
    console.log(`✓ ${fichier} (${Math.round(pdf.length / 1024)} Ko)`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
