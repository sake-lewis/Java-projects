// Moteur de mise en page intelligent des pages d'album.
// Partagé entre l'aperçu de l'éditeur (React) et la génération PDF (serveur) :
// la même logique garantit que l'aperçu correspond au PDF final.

export type Orientation = "portrait" | "paysage" | "carre"

export type LayoutId =
  | "solo-portrait"   // 1 photo verticale — grand cadre premium
  | "solo-paysage"    // 1 photo horizontale — cadre large centré
  | "duo-colonnes"    // 2 photos verticales côte à côte
  | "duo-lignes"      // 2 photos horizontales empilées
  | "duo-mixte"       // 1 horizontale (pleine largeur) + 1 verticale (centrée)
  | "trio-gauche"     // 1 grande verticale + 2 empilées à droite
  | "trio-haut"       // 1 grande horizontale + 2 côte à côte dessous
  | "quatuor"         // grille 2 × 2

// Rapport largeur/hauteur de chaque cellule, par mise en page — miroir de la
// géométrie de la planche PDF (666 × 931 px, gouttière 18 px). Sert au cadre
// du réglage manuel : la fenêtre de recadrage a exactement la forme de la
// cellule où la photo sera posée.
const RATIOS_CELLULES: Record<LayoutId, number[]> = {
  "solo-portrait": [0.62],
  "solo-paysage": [1.33],
  "duo-colonnes": [0.35, 0.35],
  "duo-lignes": [1.46, 1.46],
  "duo-mixte": [1.59, 0.75],
  "trio-gauche": [0.42, 0.57, 0.57],
  "trio-haut": [1.27, 0.83, 0.83],
  "quatuor": [0.71, 0.71, 0.71, 0.71],
}

export function ratioCellule(layout: LayoutId, slot: number): number {
  const ratios = RATIOS_CELLULES[layout]
  return ratios[Math.max(0, Math.min(slot, ratios.length - 1))]
}

export function orientation(ratio?: number): Orientation {
  if (!ratio || !isFinite(ratio)) return "portrait"
  if (ratio >= 1.05) return "paysage"
  if (ratio <= 0.95) return "portrait"
  return "carre"
}

/**
 * Choisit la mise en page d'une page selon le nombre de photos et leurs
 * orientations. Le recadrage est ensuite automatique (object-fit: cover,
 * centré) dans la cellule attribuée.
 */
export function layoutPage(photos: { ratio?: number }[]): LayoutId {
  const o = photos.map(p => orientation(p.ratio))
  const paysages = o.filter(x => x === "paysage").length

  switch (photos.length) {
    case 1:
      return o[0] === "paysage" ? "solo-paysage" : "solo-portrait"
    case 2:
      if (paysages === 2) return "duo-lignes"
      if (paysages === 0) return "duo-colonnes"
      return "duo-mixte"
    case 3:
      // Majorité d'horizontales : la grande photo s'étale en haut.
      return paysages >= 2 ? "trio-haut" : "trio-gauche"
    default:
      return "quatuor"
  }
}

/**
 * Pour duo-mixte et trio-gauche : place la photo verticale en cellule
 * principale. Retourne les photos réordonnées pour le rendu (la cellule 1
 * est toujours la dominante de la mise en page).
 */
export function ordonnerPourLayout<T extends { ratio?: number }>(
  photos: T[],
  layout: LayoutId
): T[] {
  if (layout === "trio-gauche") {
    const i = photos.findIndex(p => orientation(p.ratio) !== "paysage")
    if (i > 0) {
      const copie = [...photos]
      const [dominante] = copie.splice(i, 1)
      copie.unshift(dominante)
      return copie
    }
  }
  if (layout === "duo-mixte" || layout === "trio-haut") {
    const i = photos.findIndex(p => orientation(p.ratio) === "paysage")
    if (i > 0) {
      const copie = [...photos]
      const [dominante] = copie.splice(i, 1)
      copie.unshift(dominante)
      return copie
    }
  }
  return photos
}
