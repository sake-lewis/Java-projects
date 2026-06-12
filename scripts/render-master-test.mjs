// Rendu de test du template maître — usage dev local uniquement.
// node scripts/render-master-test.mjs <styleId>
import Handlebars from "handlebars"
import fs from "fs/promises"

Handlebars.registerHelper("add", (a, b) => a + b)
Handlebars.registerHelper("ifEgal", function (v, a, options) {
  return v === a ? options.fn(this) : options.inverse(this)
})

// Motifs copiés de lib/styles/motifs.ts (le module est en TS ; ce script .mjs
// évite la compilation, on duplique le strict nécessaire pour la vérif visuelle).
const COEUR = `<path d="M0 7 C0 7 -7.4 1 -7.4 -3.6 C-7.4 -6.1 -5.4 -7.4 -3.6 -7.4 C-2 -7.4 -0.6 -6.3 0 -4.9 C0.6 -6.3 2 -7.4 3.6 -7.4 C5.4 -7.4 7.4 -6.1 7.4 -3.6 C7.4 1 0 7 0 7 Z" fill="currentColor"/>`
const FLEUR = `<g fill="currentColor"><g opacity="0.8"><ellipse cx="0" cy="-7" rx="3.6" ry="6.2"/><ellipse cx="0" cy="-7" rx="3.6" ry="6.2" transform="rotate(72)"/><ellipse cx="0" cy="-7" rx="3.6" ry="6.2" transform="rotate(144)"/><ellipse cx="0" cy="-7" rx="3.6" ry="6.2" transform="rotate(216)"/><ellipse cx="0" cy="-7" rx="3.6" ry="6.2" transform="rotate(288)"/></g><circle r="2.4"/></g>`
const BOUGIE = `<g fill="currentColor"><path d="M0 0 C3 -4 3 -8 0 -12 C-3 -8 -3 -4 0 0 Z"/><rect x="-0.5" y="0" width="1" height="3"/><rect x="-3.6" y="3" width="7.2" height="15" rx="1.4" opacity="0.5"/></g>`
const ETOILE = `<path d="M0 -6 L1.6 -1.9 L6 -1.9 L2.4 0.9 L3.7 5.4 L0 2.6 L-3.7 5.4 L-2.4 0.9 L-6 -1.9 L-1.6 -1.9 Z" fill="currentColor"/>`
const MOTIFS_TEST = {
  none: "",
  "coeurs-roses": `<g transform="translate(11 12) scale(0.95)">${COEUR}</g><g transform="translate(86 86) scale(0.62)">${FLEUR}</g><g transform="translate(89 13) scale(0.42)" opacity="0.85">${FLEUR}</g><g transform="translate(11 87) scale(0.6)" opacity="0.85">${COEUR}</g>`,
  bougies: `<g transform="translate(13 84) scale(0.95)">${BOUGIE}</g><g transform="translate(87 84) scale(0.95)">${BOUGIE}</g><g transform="translate(50 17) scale(0.55)" opacity="0.8"><path d="M0 0 C3 -4 3 -8 0 -12 C-3 -8 -3 -4 0 0 Z" fill="currentColor"/></g>`,
  "fleurs-douces": `<g transform="translate(12 13) scale(0.72)">${FLEUR}</g><g transform="translate(88 13) scale(0.6)" opacity="0.85">${FLEUR}</g><g transform="translate(12 87) scale(0.6)" opacity="0.85">${FLEUR}</g><g transform="translate(88 87) scale(0.72)">${FLEUR}</g>`,
  "etoiles-tendres": `<g transform="translate(12 13) scale(1.05)">${ETOILE}</g><g transform="translate(87 86) scale(0.85)">${ETOILE}</g><g transform="translate(88 13) scale(0.55)" opacity="0.85">${COEUR}</g><g transform="translate(12 87) scale(0.55)" opacity="0.85">${COEUR}</g>`,
}

// Palettes copiées du catalogue (le catalogue est en TS, on évite la compilation).
const STYLES_TEST = {
  2: { theme: "nature", themeLabel: "Nature & Organique", label: "Feuillage", mode: "clair",
    palette: { bg: "#F2F0E6", surface: "#D8E4D6", accent: "#2F7A57", encre: "#1E3B2E" },
    fontDisplay: "'Cormorant Garamond', serif", fontScript: "none", motif: "none" },
  4: { theme: "nature", themeLabel: "Nature & Organique", label: "Océan Profond", mode: "sombre",
    palette: { bg: "#0F2A3D", surface: "#173A52", accent: "#3FB8AF", encre: "#F2F7F5" },
    fontDisplay: "'Playfair Display', serif", fontScript: "none", motif: "none" },
  5: { theme: "elegance", themeLabel: "Élégance & Premium", label: "Noir & Or", mode: "sombre",
    palette: { bg: "#161310", surface: "#262019", accent: "#C9A35C", encre: "#F0E6D2" },
    fontDisplay: "'Cinzel', serif", fontScript: "none", motif: "none" },
  6: { theme: "elegance", themeLabel: "Élégance & Premium", label: "Ivoire Doux", mode: "clair",
    palette: { bg: "#F8F2E7", surface: "#EADFC8", accent: "#BFA478", encre: "#4A3F2E" },
    fontDisplay: "'Cormorant Garamond', serif", fontScript: "'Pinyon Script', cursive", motif: "none" },
  13: { theme: "moderne", themeLabel: "Moderne & Minimaliste", label: "Épuré", mode: "clair",
    palette: { bg: "#FCFCFB", surface: "#EFEFED", accent: "#1C1C1C", encre: "#2A2A2A" },
    fontDisplay: "'Montserrat', sans-serif", fontScript: "none", motif: "none" },
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
