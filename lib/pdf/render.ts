import { readFile } from "fs/promises"
import path from "path"
import Handlebars from "handlebars"
import type { Client, Catalogue, Produit } from "@/lib/db"
import { AMBIANCES, FONTS_IMPORT } from "@/lib/pdf/ambiances"
import { SECTEURS } from "@/lib/config"
import { formatFCFA, lienWhatsappProduit } from "@/lib/utils"
import { estUrlPhotoAutorisee, urlPhotoProduit, urlPhotoZoom } from "@/lib/cloudinary"

/**
 * Défense en profondeur : au moment du rendu, seule une URL Cloudinary de
 * notre cloud (ou une image inline `data:image/` — utilisée par les tests)
 * est passée à Puppeteer. Tout le reste devient un placeholder.
 */
function urlSure(url: string | null): string | null {
  if (!url) return null
  if (url.startsWith("data:image/")) return url
  return estUrlPhotoAutorisee(url) ? url : null
}

// Nombre de produits par page selon le palier (déterminé par le forfait)
const PRODUITS_PAR_PAGE = { basic: 4, standard: 4, premium: 3 } as const

/** "+237 675 947 160" pour l'affichage humain. */
function formaterNumero(num: string): string {
  if (num.length === 12 && num.startsWith("237")) {
    return `+237 ${num.slice(3, 6)} ${num.slice(6, 9)} ${num.slice(9)}`
  }
  return `+${num}`
}

function chunk<T>(arr: T[], taille: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += taille) out.push(arr.slice(i, i + taille))
  return out
}

// ------------------------------------------------------------
// Ornements de coin du forfait PREMIUM — trait fin, esprit
// magazine. Dessinés pour le coin HAUT-GAUCHE (le template les
// fait pivoter pour les 3 autres coins).
// ------------------------------------------------------------
type Ornement = "floral" | "volute" | "fleuron"

const ORNEMENTS: Record<Ornement, (c: string) => string> = {
  // Branche fleurie : arc + feuilles + petite fleur à 5 pétales
  floral: (c) =>
    `<g fill="none" stroke="${c}" stroke-width="1.4" stroke-linecap="round">` +
    `<path d="M6 42 C 6 22 22 6 42 6"/>` +
    `</g>` +
    `<path d="M16 31 C 10 30 7 26 8 22 C 13 24 16 27 16 31 Z" fill="${c}"/>` +
    `<path d="M30 17 C 29 11 31 7 35 6 C 36 11 34 15 30 17 Z" fill="${c}"/>` +
    `<circle cx="42" cy="6" r="1.6" fill="${c}"/>` +
    `<circle cx="45.4" cy="6" r="1.1" fill="${c}"/><circle cx="38.6" cy="6" r="1.1" fill="${c}"/>` +
    `<circle cx="42" cy="2.6" r="1.1" fill="${c}"/><circle cx="42" cy="9.4" r="1.1" fill="${c}"/>` +
    `<circle cx="6" cy="45.5" r="1.3" fill="${c}"/>`,
  // Arabesque classique : arc terminé par deux volutes en spirale
  volute: (c) =>
    `<g fill="none" stroke="${c}" stroke-width="1.4" stroke-linecap="round">` +
    `<path d="M6 42 C 6 22 22 6 42 6"/>` +
    `<path d="M42 6 c -6 0 -9 4.2 -7.6 8 c 1.2 3 5 3.6 6.8 1.2 c 1.3 -1.9 0.4 -4.6 -2.4 -4.4"/>` +
    `<path d="M6 42 c 0 -6 4.2 -9 8 -7.6 c 3 1.2 3.6 5 1.2 6.8 c -1.9 1.3 -4.6 0.4 -4.4 -2.4"/>` +
    `</g>` +
    `<circle cx="23" cy="23" r="1.5" fill="${c}"/>`,
  // Fleuron minimal : équerre fine + losange + point
  fleuron: (c) =>
    `<g fill="none" stroke="${c}" stroke-width="1.5">` +
    `<path d="M5 26 L5 5 L26 5"/>` +
    `</g>` +
    `<rect x="8.5" y="8.5" width="8" height="8" transform="rotate(45 12.5 12.5)" fill="${c}"/>` +
    `<circle cx="23" cy="23" r="1.8" fill="${c}"/>`,
}

/** Data URI d'un ornement de coin (48×48). */
function ornementDataUri(type: Ornement, couleur: string): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">` +
    ORNEMENTS[type](couleur) +
    `</svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}


/**
 * Construit le HTML complet du catalogue à partir du template du palier
 * (= forfait du client) et de l'ambiance du secteur.
 */
export async function construireHtmlCatalogue(
  client: Client,
  catalogue: Catalogue,
  listeProduits: Produit[]
): Promise<string> {
  const palier = client.forfait
  const ambiance = AMBIANCES[client.secteur]
  const secteur = SECTEURS[client.secteur]

  const cheminTemplate = path.join(
    process.cwd(),
    "lib",
    "pdf",
    "templates",
    `${palier}.html`
  )
  const source = await readFile(cheminTemplate, "utf-8")
  const template = Handlebars.compile(source)

  const parPage = PRODUITS_PAR_PAGE[palier]

  const produitsPrepares = listeProduits.map((p, i) => {
    const prixFormate = formatFCFA(p.prix)
    const aPhoto = !!(p.photoPublicId || p.photoUrl)
    return {
      nom: p.nom,
      description: p.description || "",
      prixFormate,
      // Recadrage intelligent Cloudinary (g_auto) à la livraison
      photoUrl: p.photoPublicId ? urlPhotoProduit(p.photoPublicId) : urlSure(p.photoUrl),
      // Version haute définition NON RECADRÉE pour la page zoom (image entière)
      photoZoom: p.photoPublicId ? urlPhotoZoom(p.photoPublicId) : urlSure(p.photoUrl),
      waUrl: lienWhatsappProduit(client.whatsapp, p.nom, prixFormate),
      numero: i + 1,
      numeroAffiche: String(i + 1).padStart(2, "0"),
      // Liens internes au PDF : photo → page zoom, et retour vers la page produits
      aPhoto,
      ancreZoom: aPhoto ? `zoom-${i + 1}` : null,
      ancrePage: `produits-${Math.floor(i / parPage) + 1}`,
    }
  })

  const groupes = chunk(produitsPrepares, parPage)
  const pages = groupes.map((produits, i) => ({
    produits,
    numero: i + 1,
    totalPages: groupes.length,
  }))

  // Pages zoom : une page pleine par produit AVEC photo. Cliquer la photo dans
  // le catalogue saute vers sa page zoom ; « Retour » ramène à la bonne page.
  const zooms = produitsPrepares.filter((p) => p.aPhoto)

  const maintenant = new Date()
  const dateGeneration = maintenant.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  })

  const accueil = `https://wa.me/${client.whatsapp}?text=${encodeURIComponent(
    `Bonjour, je vous contacte après avoir vu le catalogue de ${client.nomEntreprise}.`
  )}`

  return template({
    entreprise: client.nomEntreprise,
    monogramme: client.nomEntreprise.trim().charAt(0).toUpperCase(),
    secteurLabel: secteur.label,
    secteurLabelMin: secteur.label.toLowerCase(),
    tagline: secteur.tagline,
    dateGeneration,
    totalProduits: listeProduits.length,
    whatsappAffiche: formaterNumero(client.whatsapp),
    waAccueil: accueil,
    notes: client.notes || "",
    a: ambiance,
    fontsImport: FONTS_IMPORT,
    // Ornements de coin Premium : version pages claires et version couverture
    ornementCoin: ornementDataUri(ambiance.ornement, ambiance.accent),
    ornementCover: ornementDataUri(ambiance.ornement, ambiance.coverEncre),
    pages,
    zooms,
  })
}
