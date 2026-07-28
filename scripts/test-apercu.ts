/**
 * Test de rendu HTML (sans base de données) + captures d'écran des
 * couvertures pour vérifier les couleurs personnalisées.
 */
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

function produits(n: number): Produit[] {
  return Array.from({ length: n }, (_, i) => ({
    id: i + 1, catalogueId: 1,
    nom: `Produit démo ${i + 1}`, prix: 5000 + i * 1000,
    description: i % 2 === 0 ? "Belle description du produit, qualité supérieure." : null,
    photoUrl: PHOTOS[i % PHOTOS.length], photoPublicId: null, ordre: i, createdAt: new Date(),
  }))
}

async function main() {
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||= "demo"
  await chargerPhotos()
  const outDir = path.join(process.cwd(), "scripts", "out")
  await mkdir(outDir, { recursive: true })

  const cas = [
    { nom: "basic-defaut", forfait: "basic", couleurs: null },
    { nom: "basic-couleurs", forfait: "basic", couleurs: { couvFond: "#5C1F2B", couvEncre: "#F5E7DC", finFond: "#5C1F2B", finEncre: "#F5E7DC" } },
    { nom: "standard-couleurs", forfait: "standard", couleurs: { couvFond: "#10263D", couvEncre: "#EDE7DA", finFond: "#1C4A32", finEncre: "#EAF2E2" } },
    { nom: "premium-defaut", forfait: "premium", couleurs: null },
    { nom: "premium-couleurs", forfait: "premium", couleurs: { couvFond: "#E4D3AF", couvEncre: "#3A2E17", finFond: "#371A4D", finEncre: "#F2E9F7" } },
    // Couleur invalide → doit retomber sur l'ambiance sans casser le rendu
    { nom: "premium-injection", forfait: "premium", couleurs: { couvFond: "red;}</style><script>alert(1)</script>", couvEncre: "#FFFFFF", finFond: null, finEncre: null } },
  ] as const

  for (const c of cas) {
    const client: Client = {
      id: 1, nomEntreprise: "Boutique Mariama", secteur: "mode", whatsapp: "237675947160",
      forfait: c.forfait as Client["forfait"], creditsRestants: 3, dateAchat: new Date(),
      dateExpirationCredits: new Date(Date.now() + 180 * 86400000), notes: null, createdAt: new Date(),
    }
    const catalogue: Catalogue = {
      id: 1, clientId: 1, titre: "Démo", derniereGenerationAt: null, photosExpirees: false,
      couvFond: (c.couleurs as any)?.couvFond ?? null,
      couvEncre: (c.couleurs as any)?.couvEncre ?? null,
      finFond: (c.couleurs as any)?.finFond ?? null,
      finEncre: (c.couleurs as any)?.finEncre ?? null,
      createdAt: new Date(),
    }
    const html = await construireHtmlCatalogue(client, catalogue, produits(4))
    if (html.includes("<script>alert")) throw new Error(`INJECTION NON FILTRÉE dans ${c.nom}`)
    await writeFile(path.join(outDir, `${c.nom}.html`), html)
    console.log(`✓ ${c.nom}.html (${Math.round(html.length / 1024)} Ko)`)
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
