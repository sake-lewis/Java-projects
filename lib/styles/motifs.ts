// Petits motifs décoratifs posés sur les cadres photo, choisis par style.
// Source unique partagée entre l'aperçu de l'éditeur (React) et la génération
// PDF (master.html) : la même chaîne SVG est rendue dans les deux contextes,
// l'aperçu correspond donc au rendu final.
//
// Chaque motif est le MARKUP INTERNE d'un <svg viewBox="0 0 100 100"> fourni
// par l'appelant. Les formes utilisent `currentColor` : la couleur vient du
// CSS (accent de la palette du style), jamais codée en dur ici.
//
// Chaque style a un motif assorti à son thème ; "none" reste possible.

export type MotifId =
  | "coeurs-roses"     // Mariage / union — cœurs + roses
  | "bougies"          // Deuil / mémoire — bougies
  | "fleurs-douces"    // Héritage / élégance — petites fleurs
  | "etoiles-tendres"  // Enfance / innocence — étoiles + cœurs
  | "feuilles"         // Nature — feuilles
  | "soleil"           // Nature ensoleillée — petits soleils
  | "vagues"           // Océan — vaguelettes
  | "etincelles"       // Élégance / néon — étincelles
  | "etoiles"          // Nuit étoilée / fête — étoiles
  | "flocons"          // Cristal / glace — flocons
  | "confettis"        // Vif / fête — confettis
  | "points"           // Moderne / minimal — points discrets
  | "none"

// ——— Formes de base (centrées sur 0,0, à translater/échelonner/pivoter) ———

const COEUR = `<path d="M0 7 C0 7 -7.4 1 -7.4 -3.6 C-7.4 -6.1 -5.4 -7.4 -3.6 -7.4 C-2 -7.4 -0.6 -6.3 0 -4.9 C0.6 -6.3 2 -7.4 3.6 -7.4 C5.4 -7.4 7.4 -6.1 7.4 -3.6 C7.4 1 0 7 0 7 Z" fill="currentColor"/>`
const FLEUR = `<g fill="currentColor"><g opacity="0.8"><ellipse cx="0" cy="-7" rx="3.6" ry="6.2"/><ellipse cx="0" cy="-7" rx="3.6" ry="6.2" transform="rotate(72)"/><ellipse cx="0" cy="-7" rx="3.6" ry="6.2" transform="rotate(144)"/><ellipse cx="0" cy="-7" rx="3.6" ry="6.2" transform="rotate(216)"/><ellipse cx="0" cy="-7" rx="3.6" ry="6.2" transform="rotate(288)"/></g><circle r="2.4"/></g>`
const BOUGIE = `<g fill="currentColor"><path d="M0 0 C3 -4 3 -8 0 -12 C-3 -8 -3 -4 0 0 Z"/><rect x="-0.5" y="0" width="1" height="3"/><rect x="-3.6" y="3" width="7.2" height="15" rx="1.4" opacity="0.5"/></g>`
const ETOILE = `<path d="M0 -6 L1.6 -1.9 L6 -1.9 L2.4 0.9 L3.7 5.4 L0 2.6 L-3.7 5.4 L-2.4 0.9 L-6 -1.9 L-1.6 -1.9 Z" fill="currentColor"/>`
const FEUILLE = `<path d="M0 4 q -7 -12 2 -21 q 9 9 -2 21 Z" fill="currentColor"/>`
const ETINCELLE = `<path d="M0 -8 C0.6 -2.5 2.5 -0.6 8 0 C2.5 0.6 0.6 2.5 0 8 C-0.6 2.5 -2.5 0.6 -8 0 C-2.5 -0.6 -0.6 -2.5 0 -8 Z" fill="currentColor"/>`
const POINT = `<circle r="2.6" fill="currentColor"/>`
const FLOCON = `<g stroke="currentColor" stroke-width="1.1" stroke-linecap="round"><line x1="0" y1="-7.5" x2="0" y2="7.5"/><line x1="-6.5" y1="-3.7" x2="6.5" y2="3.7"/><line x1="-6.5" y1="3.7" x2="6.5" y2="-3.7"/></g>`
const SOLEIL = `<g fill="currentColor"><circle r="3"/><g stroke="currentColor" stroke-width="1.1" stroke-linecap="round"><line x1="0" y1="-5.5" x2="0" y2="-8.5"/><line x1="0" y1="5.5" x2="0" y2="8.5"/><line x1="-5.5" y1="0" x2="-8.5" y2="0"/><line x1="5.5" y1="0" x2="8.5" y2="0"/><line x1="-4" y1="-4" x2="-6" y2="-6"/><line x1="4" y1="4" x2="6" y2="6"/><line x1="-4" y1="4" x2="-6" y2="6"/><line x1="4" y1="-4" x2="6" y2="-6"/></g></g>`
const VAGUE = `<path d="M-10 0 q 5 -6 10 0 q 5 6 10 0" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>`
const CONFETTI = `<g fill="currentColor"><circle cx="-5" cy="-3" r="2.2"/><rect x="2" y="-6.5" width="4.2" height="4.2" transform="rotate(22 4 -4.5)"/><path d="M-3 5 l4.4 0 l-2.2 4.4 Z"/><circle cx="6" cy="4" r="1.6" opacity="0.85"/></g>`

// ——— Helpers de placement ———

function place(x: number, y: number, s: number, shape: string, r = 0, op = 1): string {
  const o = op < 1 ? ` opacity="${op}"` : ""
  return `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})"${o}>${shape}</g>`
}

// Même forme aux quatre coins (grande/petite/petite/grande).
function coins(shape: string, s = 0.7, ss = 0.55): string {
  return (
    place(12, 13, s, shape) +
    place(88, 13, ss, shape, 0, 0.85) +
    place(12, 87, ss, shape, 0, 0.85) +
    place(88, 87, s, shape)
  )
}

// ——— Motifs composés (placés près des coins du cadre) ———

const MOTIFS: Record<Exclude<MotifId, "none">, string> = {
  // Cœur en haut-gauche, rose en bas-droite, plus deux accents discrets.
  "coeurs-roses":
    place(11, 12, 0.95, COEUR) +
    place(86, 86, 0.62, FLEUR) +
    place(89, 13, 0.42, FLEUR, 0, 0.85) +
    place(11, 87, 0.6, COEUR, 0, 0.85),

  // Deux bougies en bas (esprit recueillement), petite flamme en haut.
  "bougies":
    place(13, 84, 0.95, BOUGIE) +
    place(87, 84, 0.95, BOUGIE) +
    place(50, 17, 0.55, `<path d="M0 0 C3 -4 3 -8 0 -12 C-3 -8 -3 -4 0 0 Z" fill="currentColor"/>`, 0, 0.8),

  "fleurs-douces": coins(FLEUR, 0.72, 0.6),

  // Étoiles tendres + petits cœurs.
  "etoiles-tendres":
    place(12, 13, 1.05, ETOILE) +
    place(87, 86, 0.85, ETOILE) +
    place(88, 13, 0.55, COEUR, 0, 0.85) +
    place(12, 87, 0.55, COEUR, 0, 0.85),

  // Feuilles orientées vers l'intérieur, organiques.
  "feuilles":
    place(12, 14, 0.85, FEUILLE, 35) +
    place(88, 14, 0.62, FEUILLE, -35, 0.85) +
    place(12, 86, 0.62, FEUILLE, 145, 0.85) +
    place(88, 86, 0.85, FEUILLE, -145),

  "soleil": coins(SOLEIL, 0.72, 0.52),

  // Vaguelettes le long des bords haut et bas.
  "vagues":
    place(24, 13, 1, VAGUE) +
    place(76, 13, 0.8, VAGUE, 0, 0.8) +
    place(24, 87, 0.8, VAGUE, 0, 0.8) +
    place(76, 87, 1, VAGUE),

  "etincelles": coins(ETINCELLE, 0.7, 0.5),

  "etoiles": coins(ETOILE, 1, 0.65),

  "flocons": coins(FLOCON, 0.8, 0.58),

  "confettis": coins(CONFETTI, 0.9, 0.65),

  // Points minimalistes, très discrets.
  "points": coins(POINT, 1, 0.75),
}

/** Markup SVG interne du motif d'un style, ou chaîne vide si aucun. */
export function motifInner(id: MotifId): string {
  if (id === "none") return ""
  return MOTIFS[id]
}
