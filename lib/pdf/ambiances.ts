import type { Secteur } from "@/types"

// ============================================================
// Ambiances visuelles — 1 palette FIXE par secteur d'activité,
// inspirée des codes couleurs des marques les plus populaires
// du secteur (reconnaissance immédiate par le client final).
// Style : MAGAZINE ÉPURÉ — beaucoup de blanc, typographie
// éditoriale, filets fins. Le forfait détermine le niveau de
// mise en page (Basic nu · Standard cadre · Premium double cadre).
// ============================================================

export interface Ambiance {
  /** Fond de page (blanc ou blanc cassé — magazine) */
  bg: string
  /** Fond des cartes / encadrés */
  surface: string
  /** Couleur d'accent principale (prix, filets, bordures) */
  accent: string
  /** Accent secondaire (détails, ornements) */
  accent2: string
  /** Couleur du texte */
  encre: string
  /** Texte atténué (légendes, folios) */
  encreDouce: string
  /** Couverture : fond */
  coverBg: string
  /** Couverture : texte */
  coverEncre: string
  /** Police display (titres, masthead) */
  fontDisplay: string
  /** Police de labeur (corps) */
  fontBody: string
  /** Petit glyphe éditorial (séparateurs discrets) */
  deco: string
  /**
   * Ornement de coin du forfait PREMIUM (bordures décorées) :
   * floral (branche fleurie), volute (arabesque classique) ou
   * fleuron (géométrique minimal). Trait fin, esprit magazine.
   */
  ornement: "floral" | "volute" | "fleuron"
}

// Import unique Google Fonts partagé par tous les templates.
export const FONTS_IMPORT =
  "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Cormorant+Garamond:wght@400;500;600&family=Cinzel:wght@400;600&family=Marcellus&family=Montserrat:wght@300;400;500;600;700&family=Poppins:wght@300;400;500;600&family=Oswald:wght@300;400;500;600&display=swap"

const PLAYFAIR = "'Playfair Display', Georgia, serif"
const CORMORANT = "'Cormorant Garamond', Georgia, serif"
const CINZEL = "'Cinzel', Georgia, serif"
const MARCELLUS = "'Marcellus', Georgia, serif"
const MONTSERRAT = "'Montserrat', Arial, sans-serif"
const POPPINS = "'Poppins', Arial, sans-serif"
const OSWALD = "'Oswald', Arial, sans-serif"

export const AMBIANCES: Record<Secteur, Ambiance> = {
  // Mode : noir & blanc des grandes maisons (Chanel, Zara, H&M)
  mode: {
    bg: "#FFFFFF", surface: "#FAFAF8", accent: "#111111", accent2: "#8A8A86",
    encre: "#111111", encreDouce: "#77756F",
    coverBg: "#0E0E0E", coverEncre: "#F6F3EC",
    fontDisplay: PLAYFAIR, fontBody: MONTSERRAT, deco: "◆", ornement: "volute",
  },
  // Beauté : rose poudré / nude des marques beauté (Glossier, Fenty douceur)
  beaute: {
    bg: "#FFFDFD", surface: "#FBF4F5", accent: "#C96F85", accent2: "#E3BFC8",
    encre: "#33272B", encreDouce: "#94787F",
    coverBg: "#F4E3E7", coverEncre: "#4A323B",
    fontDisplay: CORMORANT, fontBody: MONTSERRAT, deco: "○", ornement: "floral",
  },
  // Alimentation : rouge appétit + jaune (Coca-Cola, KFC, McDonald's)
  alimentation: {
    bg: "#FFFFFF", surface: "#FFF8F0", accent: "#D62828", accent2: "#F6AA1C",
    encre: "#2B1A12", encreDouce: "#8A7565",
    coverBg: "#B71F1F", coverEncre: "#FFF6E8",
    fontDisplay: MARCELLUS, fontBody: POPPINS, deco: "●", ornement: "volute",
  },
  // Immobilier : bleu marine + or du prestige (Sotheby's, Century 21)
  immobilier: {
    bg: "#FBFBF9", surface: "#F4F3EE", accent: "#14324F", accent2: "#B9975B",
    encre: "#14324F", encreDouce: "#5F6C7B",
    coverBg: "#0E2438", coverEncre: "#EFE9DD",
    fontDisplay: CINZEL, fontBody: MONTSERRAT, deco: "▪", ornement: "volute",
  },
  // Électronique : bleu tech (Samsung, Intel, HP)
  electronique: {
    bg: "#FFFFFF", surface: "#F5F8FC", accent: "#1B4FD8", accent2: "#3AA6DC",
    encre: "#101828", encreDouce: "#5B6B7C",
    coverBg: "#0B1B3A", coverEncre: "#EAF1FA",
    fontDisplay: MONTSERRAT, fontBody: MONTSERRAT, deco: "▸", ornement: "fleuron",
  },
  // Artisanat : terracotta chaleureux (Etsy adouci, matières naturelles)
  artisanat: {
    bg: "#FFFCF7", surface: "#F8F1E7", accent: "#C46A34", accent2: "#7A5C3E",
    encre: "#3F2E1E", encreDouce: "#8C7255",
    coverBg: "#3F2E1E", coverEncre: "#F6EBDA",
    fontDisplay: CORMORANT, fontBody: POPPINS, deco: "✦", ornement: "floral",
  },
  // Services : bleu corporate de confiance (LinkedIn, banques)
  services: {
    bg: "#FFFFFF", surface: "#F5F8FB", accent: "#0A66C2", accent2: "#5A94C8",
    encre: "#1D2B38", encreDouce: "#66727E",
    coverBg: "#0B2E4F", coverEncre: "#EDF2F6",
    fontDisplay: MONTSERRAT, fontBody: MONTSERRAT, deco: "▪", ornement: "fleuron",
  },
  // Agro : verts nature (Whole Foods, marchés bio)
  agro: {
    bg: "#FCFEFA", surface: "#F2F7EC", accent: "#2E7D46", accent2: "#7FB069",
    encre: "#1F3D28", encreDouce: "#67805E",
    coverBg: "#1F4D2E", coverEncre: "#EDF4E4",
    fontDisplay: MARCELLUS, fontBody: POPPINS, deco: "❋", ornement: "floral",
  },
  // Automobile : noir & rouge performance (Toyota, Ferrari, Total)
  automobile: {
    bg: "#FFFFFF", surface: "#F4F4F4", accent: "#CC1F26", accent2: "#1A1B1E",
    encre: "#17181C", encreDouce: "#63666E",
    coverBg: "#141519", coverEncre: "#F0F0F0",
    fontDisplay: OSWALD, fontBody: MONTSERRAT, deco: "▮", ornement: "fleuron",
  },
  // Événementiel : violet festif premium
  evenementiel: {
    bg: "#FFFEFF", surface: "#F8F3FA", accent: "#7B2D8B", accent2: "#C9A35C",
    encre: "#332440", encreDouce: "#7E6F91",
    coverBg: "#33124A", coverEncre: "#F4EBFA",
    fontDisplay: PLAYFAIR, fontBody: POPPINS, deco: "✧", ornement: "floral",
  },
}
