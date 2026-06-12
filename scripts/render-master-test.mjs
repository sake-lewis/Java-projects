// Rendu de test du template maître — usage dev local uniquement.
// node scripts/render-master-test.mjs <styleId>
import Handlebars from "handlebars"
import fs from "fs/promises"

Handlebars.registerHelper("add", (a, b) => a + b)
Handlebars.registerHelper("ifEgal", function (v, a, options) {
  return v === a ? options.fn(this) : options.inverse(this)
})

// Motifs copiés de lib/styles/motifs.ts (le module est en TS ; ce script .mjs
// évite la compilation, on duplique pour la vérif visuelle — garder en phase).
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
const place = (x, y, s, shape, r = 0, op = 1) =>
  `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})"${op < 1 ? ` opacity="${op}"` : ""}>${shape}</g>`
const coins = (shape, s = 0.7, ss = 0.55) =>
  place(12, 13, s, shape) + place(88, 13, ss, shape, 0, 0.85) +
  place(12, 87, ss, shape, 0, 0.85) + place(88, 87, s, shape)
const MOTIFS_TEST = {
  none: "",
  "coeurs-roses": place(11, 12, 0.95, COEUR) + place(86, 86, 0.62, FLEUR) + place(89, 13, 0.42, FLEUR, 0, 0.85) + place(11, 87, 0.6, COEUR, 0, 0.85),
  bougies: place(13, 84, 0.95, BOUGIE) + place(87, 84, 0.95, BOUGIE) + place(50, 17, 0.55, `<path d="M0 0 C3 -4 3 -8 0 -12 C-3 -8 -3 -4 0 0 Z" fill="currentColor"/>`, 0, 0.8),
  "fleurs-douces": coins(FLEUR, 0.72, 0.6),
  "etoiles-tendres": place(12, 13, 1.05, ETOILE) + place(87, 86, 0.85, ETOILE) + place(88, 13, 0.55, COEUR, 0, 0.85) + place(12, 87, 0.55, COEUR, 0, 0.85),
  feuilles: place(12, 14, 0.85, FEUILLE, 35) + place(88, 14, 0.62, FEUILLE, -35, 0.85) + place(12, 86, 0.62, FEUILLE, 145, 0.85) + place(88, 86, 0.85, FEUILLE, -145),
  soleil: coins(SOLEIL, 0.72, 0.52),
  vagues: place(24, 13, 1, VAGUE) + place(76, 13, 0.8, VAGUE, 0, 0.8) + place(24, 87, 0.8, VAGUE, 0, 0.8) + place(76, 87, 1, VAGUE),
  etincelles: coins(ETINCELLE, 0.7, 0.5),
  etoiles: coins(ETOILE, 1, 0.65),
  flocons: coins(FLOCON, 0.8, 0.58),
  confettis: coins(CONFETTI, 0.9, 0.65),
  points: coins(POINT, 1, 0.75),
}

// Palettes copiées du catalogue (le catalogue est en TS, on évite la compilation).
const STYLES_TEST = {
  2: { theme: "nature", themeLabel: "Nature & Organique", label: "Feuillage", mode: "clair",
    palette: { bg: "#F2F0E6", surface: "#D8E4D6", accent: "#2F7A57", encre: "#1E3B2E" },
    fontDisplay: "'Cormorant Garamond', serif", fontScript: "none", motif: "feuilles" },
  4: { theme: "nature", themeLabel: "Nature & Organique", label: "Océan Profond", mode: "sombre",
    palette: { bg: "#0F2A3D", surface: "#173A52", accent: "#3FB8AF", encre: "#F2F7F5" },
    fontDisplay: "'Playfair Display', serif", fontScript: "none", motif: "vagues" },
  5: { theme: "elegance", themeLabel: "Élégance & Premium", label: "Noir & Or", mode: "sombre",
    palette: { bg: "#161310", surface: "#262019", accent: "#C9A35C", encre: "#F0E6D2" },
    fontDisplay: "'Cinzel', serif", fontScript: "none", motif: "etincelles" },
  6: { theme: "elegance", themeLabel: "Élégance & Premium", label: "Ivoire Doux", mode: "clair",
    palette: { bg: "#F8F2E7", surface: "#EADFC8", accent: "#BFA478", encre: "#4A3F2E" },
    fontDisplay: "'Cormorant Garamond', serif", fontScript: "'Pinyon Script', cursive", motif: "fleurs-douces" },
  13: { theme: "moderne", themeLabel: "Moderne & Minimaliste", label: "Épuré", mode: "clair",
    palette: { bg: "#FCFCFB", surface: "#EFEFED", accent: "#1C1C1C", encre: "#2A2A2A" },
    fontDisplay: "'Montserrat', sans-serif", fontScript: "none", motif: "points" },
  18: { theme: "heritage", themeLabel: "Héritage & Événementiel", label: "Amour & Union", mode: "clair",
    palette: { bg: "#FDF8F2", surface: "#F4E3DA", accent: "#C04A4A", encre: "#44282A" },
    fontDisplay: "'Cormorant Garamond', serif", fontScript: "'Pinyon Script', cursive", motif: "coeurs-roses" },
  20: { theme: "heritage", themeLabel: "Héritage & Événementiel", label: "Mémoire", mode: "clair",
    palette: { bg: "#F3F2F4", surface: "#E0DEE4", accent: "#5B3A77", encre: "#3B3540" },
    fontDisplay: "'Cinzel', serif", fontScript: "none", motif: "bougies" },
}

const id = Number(process.argv[2] ?? 6)
const s = STYLES_TEST[id]
const tpl = Handlebars.compile(await fs.readFile("lib/pdf/templates/v3/master.html", "utf-8"))

const html = tpl({
  nom_catalogue: "Mariage de Jean & Marie",
  description: "Deux familles réunies sous le soleil de Douala, un jour que personne n'oubliera.",
  planches: [
    { layout: "solo-portrait", solo: true, caption: "L'entrée des mariés",
      photos: [{ url: "https://picsum.photos/seed/eb1/800/1200" }] },
    { layout: "duo-colonnes", solo: false, caption: "",
      photos: [{ url: "https://picsum.photos/seed/eb2/800/1200" }, { url: "https://picsum.photos/seed/eb3/800/1200" }] },
    { layout: "duo-mixte", solo: false, caption: "",
      photos: [{ url: "https://picsum.photos/seed/eb5/1200/800" }, { url: "https://picsum.photos/seed/eb4/800/1200" }] },
    { layout: "trio-gauche", solo: false, caption: "",
      photos: [{ url: "https://picsum.photos/seed/eb6/800/1200" }, { url: "https://picsum.photos/seed/eb7/1200/800" }, { url: "https://picsum.photos/seed/eb8/1200/800" }] },
    { layout: "trio-haut", solo: false, caption: "",
      photos: [{ url: "https://picsum.photos/seed/eb9/1200/800" }, { url: "https://picsum.photos/seed/eb10/800/1200" }, { url: "https://picsum.photos/seed/eb11/800/1200" }] },
    { layout: "quatuor", solo: false, caption: "",
      photos: [{ url: "https://picsum.photos/seed/eb12/800/1200" }, { url: "https://picsum.photos/seed/eb13/1200/800" }, { url: "https://picsum.photos/seed/eb14/800/1200" }, { url: "https://picsum.photos/seed/eb15/1200/800" }] },
    { layout: "solo-paysage", solo: true, caption: "La première danse",
      photos: [{ url: "https://picsum.photos/seed/eb16/1200/800" }] },
  ],
  total_planches: 7,
  boutique_url: "https://nova-tech.mychariow.shop",
  theme: s.theme,
  theme_label: s.themeLabel,
  style_label: s.label,
  mode: s.mode,
  font_display: s.fontDisplay,
  font_script: s.fontScript === "none" ? s.fontDisplay : s.fontScript,
  script_present: s.fontScript !== "none",
  palette: s.palette,
  motif_svg: MOTIFS_TEST[s.motif] ?? "",
  dedicace: "À nos parents, qui ont rendu ce jour possible.",
  dedicace_presente: true,
  photo_couverture: null,
  edition_unique: "EB-2026-A3F2",
  date_composition: "11 juin 2026",
})

await fs.mkdir("public", { recursive: true })
await fs.writeFile(`public/dev-master-${id}.html`, html)
console.log(`OK -> public/dev-master-${id}.html`)
