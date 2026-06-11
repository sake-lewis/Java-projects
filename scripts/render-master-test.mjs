// Rendu de test du template maître — usage dev local uniquement.
// node scripts/render-master-test.mjs <styleId>
import Handlebars from "handlebars"
import fs from "fs/promises"

Handlebars.registerHelper("add", (a, b) => a + b)
Handlebars.registerHelper("ifEgal", function (v, a, options) {
  return v === a ? options.fn(this) : options.inverse(this)
})

// Palettes copiées du catalogue (le catalogue est en TS, on évite la compilation).
const STYLES_TEST = {
  4: { theme: "nature", themeLabel: "Nature & Organique", label: "Océan Profond", mode: "sombre",
    palette: { bg: "#0F2A3D", surface: "#173A52", accent: "#3FB8AF", encre: "#F2F7F5" },
    fontDisplay: "'Playfair Display', serif", fontScript: "none" },
  5: { theme: "elegance", themeLabel: "Élégance & Premium", label: "Noir & Or", mode: "sombre",
    palette: { bg: "#161310", surface: "#262019", accent: "#C9A35C", encre: "#F0E6D2" },
    fontDisplay: "'Cinzel', serif", fontScript: "none" },
  6: { theme: "elegance", themeLabel: "Élégance & Premium", label: "Ivoire Doux", mode: "clair",
    palette: { bg: "#F8F2E7", surface: "#EADFC8", accent: "#BFA478", encre: "#4A3F2E" },
    fontDisplay: "'Cormorant Garamond', serif", fontScript: "'Pinyon Script', cursive" },
  13: { theme: "moderne", themeLabel: "Moderne & Minimaliste", label: "Épuré", mode: "clair",
    palette: { bg: "#FCFCFB", surface: "#EFEFED", accent: "#1C1C1C", encre: "#2A2A2A" },
    fontDisplay: "'Montserrat', sans-serif", fontScript: "none" },
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
  dedicace: "À nos parents, qui ont rendu ce jour possible.",
  dedicace_presente: true,
  photo_couverture: null,
  edition_unique: "EB-2026-A3F2",
  date_composition: "11 juin 2026",
})

await fs.mkdir("public", { recursive: true })
await fs.writeFile(`public/dev-master-${id}.html`, html)
console.log(`OK -> public/dev-master-${id}.html`)
