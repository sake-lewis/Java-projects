import { Forfait, StyleId, FORFAIT_CONFIG } from "@/types"
import { MotifId } from "@/lib/styles/motifs"

// 5 thèmes × 4 styles = 20 styles.
// Déblocage par position dans le thème : 1 & 2 → Standard, 3 → Pro, 4 → Premium.
export type Theme = "nature" | "elegance" | "vif" | "moderne" | "heritage"

export const THEMES: Theme[] = ["nature", "elegance", "vif", "moderne", "heritage"]

export const THEME_LABELS: Record<Theme, string> = {
  nature: "Nature & Organique",
  elegance: "Élégance & Premium",
  vif: "Vif & Coloré",
  moderne: "Moderne & Minimaliste",
  heritage: "Héritage & Événementiel",
}

export interface StyleDef {
  id: StyleId
  theme: Theme
  themeLabel: string
  position: 1 | 2 | 3 | 4       // position dans le thème (règle de déblocage)
  label: string                  // nom du style ("Terre & Racines"…)
  description: string            // une phrase évocatrice
  palette: {
    bg: string                   // fond principal
    surface: string              // surface secondaire
    accent: string               // touche d'accent
    encre: string                // texte
  }
  mode: "clair" | "sombre"       // pilote les contrastes du template
  // Familles typographiques injectées dans le template PDF (CSS font-family).
  fontDisplay: string
  fontScript: string             // ornement calligraphique ("none" si aucun)
  // Petit motif posé sur les cadres photo (cœurs/roses, bougies…). "none" = aucun.
  motif: MotifId
}

function def(
  id: number,
  theme: Theme,
  position: 1 | 2 | 3 | 4,
  label: string,
  description: string,
  palette: StyleDef["palette"],
  mode: "clair" | "sombre",
  fontDisplay: string,
  fontScript = "none",
  motif: MotifId = "none"
): StyleDef {
  return {
    id: id as StyleId,
    theme,
    themeLabel: THEME_LABELS[theme],
    position,
    label,
    description,
    palette,
    mode,
    fontDisplay,
    fontScript,
    motif,
  }
}

const CORMORANT = "'Cormorant Garamond', serif"
const CINZEL = "'Cinzel', serif"
const PLAYFAIR = "'Playfair Display', serif"
const MONTSERRAT = "'Montserrat', sans-serif"
const PINYON = "'Pinyon Script', cursive"
const CAVEAT = "'Caveat', cursive"

export const STYLES: Record<StyleId, StyleDef> = {
  // ——— Nature & Organique ———
  1: def(1, "nature", 1, "Terre & Racines", "Terre cuite, brun chaud, chaleur du sol natal",
    { bg: "#F4EADC", surface: "#E4CDB2", accent: "#B5683C", encre: "#4A3320" }, "clair", CORMORANT, "none", "feuilles"),
  2: def(2, "nature", 2, "Feuillage", "Vert profond, émeraude, fraîcheur de canopée",
    { bg: "#F2F0E6", surface: "#D8E4D6", accent: "#2F7A57", encre: "#1E3B2E" }, "clair", CORMORANT, "none", "feuilles"),
  3: def(3, "nature", 3, "Soleil & Sable", "Jaune doré, sable, éclat de corail",
    { bg: "#FBF3DF", surface: "#F2E0B8", accent: "#D29A3A", encre: "#6B4A23" }, "clair", PLAYFAIR, "none", "soleil"),
  4: def(4, "nature", 4, "Océan Profond", "Bleu abyssal, turquoise, nacre",
    { bg: "#0F2A3D", surface: "#173A52", accent: "#3FB8AF", encre: "#F2F7F5" }, "sombre", PLAYFAIR, "none", "vagues"),

  // ——— Élégance & Premium ———
  5: def(5, "elegance", 1, "Noir & Or", "Noir profond, or mat, blanc cassé",
    { bg: "#161310", surface: "#262019", accent: "#C9A35C", encre: "#F0E6D2" }, "sombre", CINZEL, "none", "etincelles"),
  6: def(6, "elegance", 2, "Ivoire Doux", "Blanc cassé, beige, reflets champagne",
    { bg: "#F8F2E7", surface: "#EADFC8", accent: "#BFA478", encre: "#4A3F2E" }, "clair", CORMORANT, PINYON, "fleurs-douces"),
  7: def(7, "elegance", 3, "Nuit Étoilée", "Bleu nuit, argent, pointe de bordeaux",
    { bg: "#14213D", surface: "#1E2E52", accent: "#B9C0CC", encre: "#F0EDE4" }, "sombre", CINZEL, "none", "etoiles"),
  8: def(8, "elegance", 4, "Cristal", "Blanc pur, reflets irisés, gris glacé",
    { bg: "#FBFBFA", surface: "#ECEFF1", accent: "#9FAAB2", encre: "#3A4248" }, "clair", PLAYFAIR, "none", "flocons"),

  // ——— Vif & Coloré ———
  9: def(9, "vif", 1, "Éclat", "Couleurs franches, énergie maîtrisée",
    { bg: "#FDF6EC", surface: "#FAE4CB", accent: "#E2563B", encre: "#33241C" }, "clair", PLAYFAIR, CAVEAT, "confettis"),
  10: def(10, "vif", 2, "Fête", "Rouge, jaune, violet — la joie en grand",
    { bg: "#FFF6E8", surface: "#F8DFC0", accent: "#BE3A2B", encre: "#3A1F1B" }, "clair", PLAYFAIR, "none", "confettis"),
  11: def(11, "vif", 3, "Tropical", "Turquoise, fuchsia, vert lime",
    { bg: "#F0FAF7", surface: "#C9EEDF", accent: "#0FA3A3", encre: "#14443C" }, "clair", PLAYFAIR, CAVEAT, "feuilles"),
  12: def(12, "vif", 4, "Carnival", "Orange vif, or, rouge profond",
    { bg: "#FFF3E2", surface: "#FFDFB4", accent: "#D96C22", encre: "#5A2E10" }, "clair", CINZEL, "none", "etoiles"),

  // ——— Moderne & Minimaliste ———
  13: def(13, "moderne", 1, "Épuré", "Blanc, gris clair, accent noir précis",
    { bg: "#FCFCFB", surface: "#EFEFED", accent: "#1C1C1C", encre: "#2A2A2A" }, "clair", MONTSERRAT, "none", "points"),
  14: def(14, "moderne", 2, "Urbain", "Anthracite, blanc, accent cuivré",
    { bg: "#2E3236", surface: "#3C4147", accent: "#E8734A", encre: "#F2F1EE" }, "sombre", MONTSERRAT, "none", "points"),
  15: def(15, "moderne", 3, "Néon", "Nuit urbaine, lueur menthe électrique",
    { bg: "#101014", surface: "#1B1B22", accent: "#00E5A0", encre: "#F2F2F5" }, "sombre", MONTSERRAT, "none", "etincelles"),
  16: def(16, "moderne", 4, "Glace", "Blanc glacé, bleu pâle, argent",
    { bg: "#F6FAFC", surface: "#DDEAF2", accent: "#7FA8C0", encre: "#33444E" }, "clair", MONTSERRAT, "none", "flocons"),

  // ——— Héritage & Événementiel ———
  17: def(17, "heritage", 1, "Tissage", "Ocre, terracotta, fil d'or — l'étoffe des grands jours",
    { bg: "#F7EBDA", surface: "#EAD2AC", accent: "#C25E2E", encre: "#4F2F16" }, "clair", CORMORANT, "none", "fleurs-douces"),
  18: def(18, "heritage", 2, "Amour & Union", "Blanc, or, rouge rosé — la promesse",
    { bg: "#FDF8F2", surface: "#F4E3DA", accent: "#C04A4A", encre: "#44282A" }, "clair", CORMORANT, PINYON, "coeurs-roses"),
  19: def(19, "heritage", 3, "Innocence", "Rose poudré, bleu ciel, douceur d'enfance",
    { bg: "#FBF3F4", surface: "#F2DEE3", accent: "#8FB3D6", encre: "#5A4A50" }, "clair", CORMORANT, CAVEAT, "etoiles-tendres"),
  20: def(20, "heritage", 4, "Mémoire", "Gris perle, blanc, violet profond — le souvenir",
    { bg: "#F3F2F4", surface: "#E0DEE4", accent: "#5B3A77", encre: "#3B3540" }, "clair", CINZEL, "none", "bougies"),
}

/** Styles d'un thème, dans l'ordre des positions. */
export function stylesDuTheme(theme: Theme): StyleDef[] {
  return Object.values(STYLES)
    .filter(s => s.theme === theme)
    .sort((a, b) => a.position - b.position)
}

export function styleAccessible(style: StyleId, forfait: Forfait): boolean {
  return FORFAIT_CONFIG[forfait].styles_disponibles.includes(style)
}

export function styleVerrouillePour(style: StyleId): Forfait | null {
  if (FORFAIT_CONFIG.standard.styles_disponibles.includes(style)) return null
  if (FORFAIT_CONFIG.pro.styles_disponibles.includes(style)) return "pro"
  return "premium"
}
