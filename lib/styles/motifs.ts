// Petits motifs décoratifs posés sur les cadres photo, choisis par style.
// Source unique partagée entre l'aperçu de l'éditeur (React) et la génération
// PDF (master.html) : la même chaîne SVG est rendue dans les deux contextes,
// l'aperçu correspond donc au rendu final.
//
// Chaque motif est le MARKUP INTERNE d'un <svg viewBox="0 0 100 100"> fourni
// par l'appelant, dont la couleur de texte (`currentColor`) vaut l'accent du
// style. Pour un rendu « réel » (volume, matière), chaque forme superpose
// plusieurs tons DÉRIVÉS de l'accent via color-mix :
//   - reflet  = accent éclairci (mélange blanc)
//   - corps   = accent (currentColor)
//   - ombre   = accent assombri (mélange noir)
// color-mix(currentColor …) se résout aussi bien dans le navigateur que dans
// Chromium (PDF) : aucune variable supplémentaire n'est nécessaire.
//
// Quelques touches de couleur « naturelle » fixes complètent le réalisme là où
// c'est toujours lisible : feuillage vert sauge pour les motifs floraux (styles
// clairs uniquement), flamme chaude pour les bougies, confettis multicolores.
//
// Chaque style a un motif assorti à son thème ; "none" reste possible.

export type MotifId =
  | "roses-vintage"    // Floral vintage — bouquets de roses + eucalyptus aux coins
  | "coeurs-roses"     // Mariage / union — cœurs + roses
  | "bougies"          // Deuil / mémoire — bougies
  | "fleurs-douces"    // Héritage / élégance — petites roses
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

// ——— Tons dérivés de l'accent (currentColor) ———

const mix = (p: number, c: string) => `color-mix(in srgb, currentColor ${p}%, ${c})`
const HI = mix(38, "#fff")     // reflet vif
const LIGHT = mix(70, "#fff")  // éclairci
const BASE = "currentColor"    // corps
const SHADE = mix(72, "#000")  // ombre
const DEEP = mix(50, "#000")   // ombre profonde / cœur

// Verts sauge fixes (feuillage), chauds (flamme), confettis : lisibles sur les
// fonds des styles concernés.
const SAGE = "#7E9A6E"
const SAGE_L = "#9FB88F"
const SAGE_D = "#5A7650"

const fill = (c: string) => ` style="fill:${c}"`
const fillop = (c: string, o: number) => ` style="fill:${c};opacity:${o}"`
const line = (c: string, w: number, extra = "") =>
  ` style="fill:none;stroke:${c};stroke-width:${w};stroke-linecap:round;stroke-linejoin:round;${extra}"`

// ——— Formes de base (centrées sur 0,0, à translater/échelonner/pivoter) ———

// Pétale (goutte) pointant vers le haut, pour roses.
const PETALE = "M0 0 C-5.5 -4 -4.5 -9.4 0 -9.8 C4.5 -9.4 5.5 -4 0 0 Z"
const ring = (d: string, off = 0) =>
  [0, 72, 144, 216, 288].map(a => `<path d="${d}" transform="rotate(${a + off})"/>`).join("")

// Rose ancienne enroulée : halo d'aquarelle + corolle en volume + étamines.
const STAMENS = [0, 72, 144, 216, 288]
  .map(a => `<circle cx="0" cy="-3.4" r="0.6" transform="rotate(${a})"/>`)
  .join("")
const ROSE =
  `<g>` +
  `<circle r="10.6"${fillop(LIGHT, 0.32)}/>` +
  `<circle r="8.6"${fill(LIGHT)}/>` +
  `<g${fill(BASE)}>` + ring(PETALE) + `</g>` +
  `<g${fill(SHADE)} transform="scale(0.62)">` + ring(PETALE, 36) + `</g>` +
  `<circle r="2.6"${fill(DEEP)}/>` +
  `<g${fillop(HI, 0.9)}>` + STAMENS + `</g>` +
  `<path d="M-4 -1.4 C-4.4 -4.6 -1.2 -5.8 1.6 -4.6"${line(HI, 1)}/>` +
  `</g>`

// Bouton de rose : goutte en volume + calice vert.
const ROSEBUD =
  `<g>` +
  `<path d="M0 -5 C2.6 -5 3.3 -2 2.3 0.6 C1.7 2 0.8 2.6 0 2.6 C-0.8 2.6 -1.7 2 -2.3 0.6 C-3.3 -2 -2.6 -5 0 -5 Z"${fill(BASE)}/>` +
  `<path d="M0 -5 C2.6 -5 3.3 -2 2.3 0.6 C1.7 2 0.8 2.6 0 2.6 L0 -5 Z"${fillop(SHADE, 0.85)}/>` +
  `<path d="M0 -4.4 C-1.6 -3.4 -2 -1 -1.5 0.8"${line(LIGHT, 0.8)}/>` +
  `<path d="M0 2.6 L0 6.4 M0 4.2 L-2.3 2.6 M0 4.2 L2.3 2.6"${line(SAGE_D, 0.9)}/>` +
  `</g>`

// Brin d'eucalyptus : tige + feuilles rondes vert sauge en volume.
const eucLeaf = (cx: number, cy: number, rx: number, ry: number, rot: number) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${cx} ${cy})"/>`
const EUCALYPTUS =
  `<g>` +
  `<path d="M0 7 C-0.6 1 0.6 -5 0 -12"${line(SAGE_D, 1)}/>` +
  `<g style="fill:${SAGE}">` +
  eucLeaf(-3.6, 0.5, 2.4, 3.5, -34) +
  eucLeaf(3.6, -1.5, 2.4, 3.5, 34) +
  eucLeaf(-3.2, -4.4, 2.1, 3.1, -30) +
  eucLeaf(3.2, -6.4, 2.1, 3.1, 30) +
  eucLeaf(0, -11.5, 1.7, 2.6, 0) +
  `</g>` +
  `<g style="fill:${SAGE_L};opacity:0.75">` +
  eucLeaf(-4, -0.2, 1.1, 2.1, -34) +
  eucLeaf(3.3, -2.2, 1.1, 2.1, 34) +
  `</g>` +
  `</g>`

// Cœur en volume (corps + moitié ombrée + reflet).
const COEUR_D = "M0 7 C0 7 -7.4 1 -7.4 -3.6 C-7.4 -6.1 -5.4 -7.4 -3.6 -7.4 C-2 -7.4 -0.6 -6.3 0 -4.9 C0.6 -6.3 2 -7.4 3.6 -7.4 C5.4 -7.4 7.4 -6.1 7.4 -3.6 C7.4 1 0 7 0 7 Z"
const COEUR =
  `<g>` +
  `<path d="${COEUR_D}"${fill(BASE)}/>` +
  `<path d="M0 7 C0 7 -7.4 1 -7.4 -3.6 C-7.4 -6.1 -5.4 -7.4 -3.6 -7.4 C-2 -7.4 -0.6 -6.3 0 -4.9 L0 7 Z"${fillop(SHADE, 0.8)}/>` +
  `<ellipse cx="-3" cy="-3.4" rx="1.7" ry="2.3" transform="rotate(-30 -3 -3.4)"${fillop(HI, 0.85)}/>` +
  `</g>`

// Bougie : flamme chaude + halo, corps en volume.
const BOUGIE =
  `<g>` +
  `<ellipse cx="0" cy="-9" rx="5" ry="7"${fillop("#F7DD8E", 0.4)}/>` +
  `<path d="M0 -2 C3 -6 3 -11 0 -15 C-3 -11 -3 -6 0 -2 Z" style="fill:#EFA53C"/>` +
  `<path d="M0 -3.5 C1.6 -6 1.6 -9.2 0 -12 C-1.6 -9.2 -1.6 -6 0 -3.5 Z" style="fill:#F8D778"/>` +
  `<rect x="-0.5" y="-2.2" width="1" height="2.8"${fill(DEEP)}/>` +
  `<rect x="-3.6" y="0.6" width="7.2" height="15" rx="1.4"${fill(BASE)}/>` +
  `<rect x="-3.6" y="0.6" width="2.1" height="15" rx="1"${fillop(LIGHT, 0.8)}/>` +
  `<rect x="1.6" y="0.6" width="2" height="15" rx="1"${fillop(SHADE, 0.7)}/>` +
  `<ellipse cx="0" cy="0.8" rx="3.6" ry="1.2"${fill(LIGHT)}/>` +
  `</g>`

// Étoile en volume (corps + petite étoile-reflet décalée).
const ETOILE_D = "M0 -6 L1.6 -1.9 L6 -1.9 L2.4 0.9 L3.7 5.4 L0 2.6 L-3.7 5.4 L-2.4 0.9 L-6 -1.9 L-1.6 -1.9 Z"
const ETOILE =
  `<g>` +
  `<path d="${ETOILE_D}"${fill(BASE)}/>` +
  `<path d="${ETOILE_D}" transform="translate(-0.5 -0.7) scale(0.58)"${fillop(HI, 0.85)}/>` +
  `</g>`

// Feuille en volume (corps + nervure claire + moitié ombrée).
const FEUILLE =
  `<g>` +
  `<path d="M0 4 q -7 -12 2 -21 q 9 9 -2 21 Z"${fill(BASE)}/>` +
  `<path d="M0 4 q -3.5 -10 1 -19 q 4.5 8 -1 19 Z"${fillop(SHADE, 0.7)}/>` +
  `<path d="M0.3 3 q -2 -10 1.4 -18.5"${line(LIGHT, 0.8)}/>` +
  `</g>`

// Étincelle : éclat à quatre branches + cœur lumineux.
const ETINCELLE_D = "M0 -8 C0.6 -2.5 2.5 -0.6 8 0 C2.5 0.6 0.6 2.5 0 8 C-0.6 2.5 -2.5 0.6 -8 0 C-2.5 -0.6 -0.6 -2.5 0 -8 Z"
const ETINCELLE =
  `<g>` +
  `<path d="${ETINCELLE_D}"${fill(BASE)}/>` +
  `<path d="${ETINCELLE_D}" transform="scale(0.5)"${fill(LIGHT)}/>` +
  `<circle r="1"${fill(HI)}/>` +
  `</g>`

// Point : petite sphère (corps + reflet).
const POINT =
  `<g>` +
  `<circle r="2.8"${fill(BASE)}/>` +
  `<circle cx="-0.8" cy="-0.9" r="1.1"${fillop(HI, 0.9)}/>` +
  `</g>`

// Flocon : cristal à deux tons + gemme centrale.
const FLOCON_ARMS =
  `<line x1="0" y1="-7.5" x2="0" y2="7.5"/>` +
  `<line x1="-6.5" y1="-3.7" x2="6.5" y2="3.7"/>` +
  `<line x1="-6.5" y1="3.7" x2="6.5" y2="-3.7"/>` +
  `<path d="M0 -7.5 l-1.8 2 M0 -7.5 l1.8 2 M0 7.5 l-1.8 -2 M0 7.5 l1.8 -2"/>`
const FLOCON =
  `<g${line(BASE, 1.3)}>` + FLOCON_ARMS + `</g>` +
  `<g${line(LIGHT, 0.5)}>` + FLOCON_ARMS + `</g>` +
  `<circle r="1.4"${fill(HI)}/>`

// Soleil : disque en volume + rayons.
const SOLEIL =
  `<g${line(BASE, 1.1)}>` +
  `<line x1="0" y1="-5.5" x2="0" y2="-8.5"/><line x1="0" y1="5.5" x2="0" y2="8.5"/>` +
  `<line x1="-5.5" y1="0" x2="-8.5" y2="0"/><line x1="5.5" y1="0" x2="8.5" y2="0"/>` +
  `<line x1="-4" y1="-4" x2="-6" y2="-6"/><line x1="4" y1="4" x2="6" y2="6"/>` +
  `<line x1="-4" y1="4" x2="-6" y2="6"/><line x1="4" y1="-4" x2="6" y2="-6"/>` +
  `</g>` +
  `<circle r="3.6"${fill(BASE)}/>` +
  `<circle cx="-0.7" cy="-0.7" r="2"${fillop(HI, 0.9)}/>`

// Vague : eau (creux ombré + crête claire).
const VAGUE =
  `<g${line(BASE, 1.3)}><path d="M-10 0 q 5 -6 10 0 q 5 6 10 0"/></g>` +
  `<g${line(LIGHT, 0.8)}><path d="M-10 -2.4 q 5 -6 10 0 q 5 6 10 0"/></g>`

// Confettis multicolores (fête) — couleurs fixes festives, légère ombre.
const CONFETTI =
  `<g>` +
  `<circle cx="-5" cy="-3" r="2.2" style="fill:#E0563B"/>` +
  `<rect x="2" y="-6.5" width="4.2" height="4.2" transform="rotate(22 4 -4.5)" style="fill:#E9B43C"/>` +
  `<path d="M-3 5 l4.4 0 l-2.2 4.4 Z" style="fill:#3FA9A0"/>` +
  `<circle cx="6" cy="4" r="1.7" style="fill:#B0519E"/>` +
  `<path d="M-8.5 1.5 l3 -0.6"${line("#E9B43C", 1.3)}/>` +
  `</g>`

// ——— Helpers de placement ———

function place(x: number, y: number, s: number, shape: string, r = 0, op = 1): string {
  const o = op < 1 ? ` opacity="${op}"` : ""
  return `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})"${o}>${shape}</g>`
}

// Même forme aux quatre coins (grande/petite/petite/grande).
function coins(shape: string, s = 0.7, ss = 0.55): string {
  return (
    place(12, 13, s, shape) +
    place(88, 13, ss, shape, 0, 0.9) +
    place(12, 87, ss, shape, 0, 0.9) +
    place(88, 87, s, shape)
  )
}

// ——— Motifs composés (placés près des coins du cadre) ———

const MOTIFS: Record<Exclude<MotifId, "none">, string> = {
  // Floral vintage : deux bouquets en diagonale (rose + eucalyptus + bouton),
  // composition d'un cadre floral d'inspiration aquarelle.
  "roses-vintage":
    // Bouquet dominant — coin bas droite
    place(85, 84, 1.0, ROSE) +
    place(72, 90, 0.72, EUCALYPTUS, 60, 0.95) +
    place(92, 73, 0.72, EUCALYPTUS, -40, 0.95) +
    place(74, 76, 0.52, ROSEBUD, -28, 0.95) +
    // Bouquet secondaire — coin haut gauche (miroir, plus léger)
    place(15, 16, 0.82, ROSE, 0, 0.95) +
    place(28, 11, 0.6, EUCALYPTUS, -120, 0.85) +
    place(10, 28, 0.6, EUCALYPTUS, 140, 0.85) +
    place(26, 25, 0.44, ROSEBUD, 152, 0.85),

  // Mariage / union : rose + eucalyptus en bas droite, cœurs en contrepoint.
  "coeurs-roses":
    place(85, 85, 0.9, ROSE) +
    place(72, 90, 0.62, EUCALYPTUS, 58, 0.9) +
    place(13, 13, 0.6, COEUR, 0, 0.95) +
    place(15, 86, 0.48, ROSEBUD, 150, 0.85) +
    place(88, 14, 0.46, COEUR, 0, 0.8),

  // Deux bougies en bas (recueillement), petite flamme en haut.
  "bougies":
    place(13, 80, 0.95, BOUGIE) +
    place(87, 80, 0.95, BOUGIE) +
    place(50, 16, 0.5, `<g><ellipse cx="0" cy="-9" rx="4" ry="6" style="fill:#F7DD8E;opacity:0.4"/><path d="M0 -2 C3 -6 3 -11 0 -15 C-3 -11 -3 -6 0 -2 Z" style="fill:#EFA53C"/><path d="M0 -3.5 C1.6 -6 1.6 -9.2 0 -12 C-1.6 -9.2 -1.6 -6 0 -3.5 Z" style="fill:#F8D778"/></g>`, 0, 0.9),

  // Petites roses aux coins (plus deux boutons en contrepoint).
  "fleurs-douces":
    place(14, 14, 0.62, ROSE) +
    place(86, 86, 0.7, ROSE) +
    place(86, 15, 0.42, ROSEBUD, 0, 0.85) +
    place(14, 86, 0.42, ROSEBUD, 180, 0.85),

  // Étoiles tendres + petits cœurs.
  "etoiles-tendres":
    place(12, 13, 1.05, ETOILE) +
    place(87, 86, 0.85, ETOILE) +
    place(88, 13, 0.55, COEUR, 0, 0.9) +
    place(12, 87, 0.55, COEUR, 0, 0.9),

  // Feuilles orientées vers l'intérieur, organiques.
  "feuilles":
    place(12, 14, 0.85, FEUILLE, 35) +
    place(88, 14, 0.62, FEUILLE, -35, 0.9) +
    place(12, 86, 0.62, FEUILLE, 145, 0.9) +
    place(88, 86, 0.85, FEUILLE, -145),

  "soleil": coins(SOLEIL, 0.72, 0.52),

  // Vaguelettes le long des bords haut et bas.
  "vagues":
    place(24, 13, 1, VAGUE) +
    place(76, 13, 0.8, VAGUE, 0, 0.85) +
    place(24, 87, 0.8, VAGUE, 0, 0.85) +
    place(76, 87, 1, VAGUE),

  "etincelles": coins(ETINCELLE, 0.7, 0.5),

  "etoiles": coins(ETOILE, 1, 0.65),

  "flocons": coins(FLOCON, 0.8, 0.58),

  "confettis": coins(CONFETTI, 0.9, 0.65),

  // Points minimalistes, très discrets.
  "points": coins(POINT, 1, 0.75),
}

// Filtre « aquarelle » : bords irréguliers (déplacement par bruit) + très légère
// diffusion. Embarqué dans chaque motif pour rester auto-suffisant — il rend à
// l'identique dans l'éditeur, le sélecteur et le PDF, sans dépendance externe.
const WC_FILTER =
  `<filter id="ev-wc" x="-25%" y="-25%" width="150%" height="150%">` +
  `<feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves="1" seed="4" result="n"/>` +
  `<feDisplacementMap in="SourceGraphic" in2="n" scale="2.6" xChannelSelector="R" yChannelSelector="G" result="d"/>` +
  `<feGaussianBlur in="d" stdDeviation="0.35"/>` +
  `</filter>`

/** Markup SVG interne du motif d'un style, ou chaîne vide si aucun. */
export function motifInner(id: MotifId): string {
  if (id === "none") return ""
  return `<defs>${WC_FILTER}</defs><g filter="url(#ev-wc)">${MOTIFS[id]}</g>`
}
