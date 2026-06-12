// Petits motifs décoratifs posés sur les cadres photo, choisis par style.
// Source unique partagée entre l'aperçu de l'éditeur (React) et la génération
// PDF (master.html) : la même chaîne SVG est rendue dans les deux contextes,
// l'aperçu correspond donc au rendu final.
//
// Chaque motif est le MARKUP INTERNE d'un <svg viewBox="0 0 100 100"> fourni
// par l'appelant. Les formes utilisent `currentColor` : la couleur vient du
// CSS (accent de la palette du style), jamais codée en dur ici.

export type MotifId =
  | "coeurs-roses"     // Mariage / union — cœurs + roses
  | "bougies"          // Deuil / mémoire — bougies
  | "fleurs-douces"    // Héritage / fête — petites fleurs
  | "etoiles-tendres"  // Enfance / innocence — étoiles + cœurs
  | "none"

// ——— Formes de base (centrées sur 0,0, à translater/échelonner) ———

const COEUR = `<path d="M0 7 C0 7 -7.4 1 -7.4 -3.6 C-7.4 -6.1 -5.4 -7.4 -3.6 -7.4 C-2 -7.4 -0.6 -6.3 0 -4.9 C0.6 -6.3 2 -7.4 3.6 -7.4 C5.4 -7.4 7.4 -6.1 7.4 -3.6 C7.4 1 0 7 0 7 Z" fill="currentColor"/>`

const FLEUR = `<g fill="currentColor"><g opacity="0.8"><ellipse cx="0" cy="-7" rx="3.6" ry="6.2"/><ellipse cx="0" cy="-7" rx="3.6" ry="6.2" transform="rotate(72)"/><ellipse cx="0" cy="-7" rx="3.6" ry="6.2" transform="rotate(144)"/><ellipse cx="0" cy="-7" rx="3.6" ry="6.2" transform="rotate(216)"/><ellipse cx="0" cy="-7" rx="3.6" ry="6.2" transform="rotate(288)"/></g><circle r="2.4"/></g>`

const BOUGIE = `<g fill="currentColor"><path d="M0 0 C3 -4 3 -8 0 -12 C-3 -8 -3 -4 0 0 Z"/><rect x="-0.5" y="0" width="1" height="3"/><rect x="-3.6" y="3" width="7.2" height="15" rx="1.4" opacity="0.5"/></g>`

const ETOILE = `<path d="M0 -6 L1.6 -1.9 L6 -1.9 L2.4 0.9 L3.7 5.4 L0 2.6 L-3.7 5.4 L-2.4 0.9 L-6 -1.9 L-1.6 -1.9 Z" fill="currentColor"/>`

// ——— Motifs composés (placés près des coins du cadre) ———

const MOTIFS: Record<Exclude<MotifId, "none">, string> = {
  // Cœur en haut-gauche, rose en bas-droite, plus deux accents discrets.
  "coeurs-roses": `
    <g transform="translate(11 12) scale(0.95)">${COEUR}</g>
    <g transform="translate(86 86) scale(0.62)">${FLEUR}</g>
    <g transform="translate(89 13) scale(0.42)" opacity="0.85">${FLEUR}</g>
    <g transform="translate(11 87) scale(0.6)" opacity="0.85">${COEUR}</g>
  `,
  // Deux bougies en bas (esprit recueillement), petite flamme en haut.
  "bougies": `
    <g transform="translate(13 84) scale(0.95)">${BOUGIE}</g>
    <g transform="translate(87 84) scale(0.95)">${BOUGIE}</g>
    <g transform="translate(50 17) scale(0.55)" opacity="0.8"><path d="M0 0 C3 -4 3 -8 0 -12 C-3 -8 -3 -4 0 0 Z" fill="currentColor"/></g>
  `,
  // Fleurs douces aux quatre coins.
  "fleurs-douces": `
    <g transform="translate(12 13) scale(0.72)">${FLEUR}</g>
    <g transform="translate(88 13) scale(0.6)" opacity="0.85">${FLEUR}</g>
    <g transform="translate(12 87) scale(0.6)" opacity="0.85">${FLEUR}</g>
    <g transform="translate(88 87) scale(0.72)">${FLEUR}</g>
  `,
  // Étoiles tendres + petits cœurs.
  "etoiles-tendres": `
    <g transform="translate(12 13) scale(1.05)">${ETOILE}</g>
    <g transform="translate(87 86) scale(0.85)">${ETOILE}</g>
    <g transform="translate(88 13) scale(0.55)" opacity="0.85">${COEUR}</g>
    <g transform="translate(12 87) scale(0.55)" opacity="0.85">${COEUR}</g>
  `,
}

/** Markup SVG interne du motif d'un style, ou chaîne vide si aucun. */
export function motifInner(id: MotifId): string {
  if (id === "none") return ""
  return MOTIFS[id]
}
