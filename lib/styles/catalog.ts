import { Forfait, StyleId, FORFAIT_CONFIG } from "@/types"

export type Occasion =
  | "mariage"
  | "enfance"
  | "deuil"
  | "anniversaire"
  | "solennel"

export type Variation = "classique" | "contemporain"

export interface StyleDef {
  id: StyleId
  occasion: Occasion
  variation: Variation
  label: string                 // libellé court ("Romantique", "Moderne"…)
  occasionLabel: string         // libellé de l'occasion ("Mariage", "Enfance"…)
  description: string           // une phrase évocatrice
  palette: {
    bg: string                  // fond principal de la vignette
    surface: string             // couleur secondaire
    accent: string              // touche d'accent (or, foil, etc.)
    encre: string               // texte
  }
  // Indice de motif à dessiner dans la preview (interprété par <StylePreview/>).
  motif:
    | "guirlande"
    | "geometrique"
    | "coeurs"
    | "aquarelle"
    | "lys"
    | "sepia"
    | "bokeh"
    | "ruban"
    | "sceau"
    | "monogramme-foil"
  // Famille typographique dominante (sert dans la preview ET dans le template PDF).
  fontFamily: string
}

export const STYLES: Record<StyleId, StyleDef> = {
  1: {
    id: 1,
    occasion: "mariage",
    variation: "classique",
    label: "Romantique",
    occasionLabel: "Mariage",
    description: "Rose poudré, guirlandes florales, calligraphie",
    palette: { bg: "#F8ECE6", surface: "#F0D7CB", accent: "#C4956A", encre: "#3D2A1A" },
    motif: "guirlande",
    fontFamily: "'Pinyon Script', 'Cormorant Garamond', serif",
  },
  2: {
    id: 2,
    occasion: "mariage",
    variation: "contemporain",
    label: "Moderne",
    occasionLabel: "Mariage",
    description: "Terracotta, géométrie, lignes franches",
    palette: { bg: "#F4ECDD", surface: "#E5C9B0", accent: "#C66B4A", encre: "#2C2C2C" },
    motif: "geometrique",
    fontFamily: "'Cormorant Garamond', serif",
  },
  3: {
    id: 3,
    occasion: "enfance",
    variation: "classique",
    label: "Tendre",
    occasionLabel: "Enfance",
    description: "Pastel pêche, cœurs, cursive douce",
    palette: { bg: "#FBF1E2", surface: "#F8E5C2", accent: "#E29B7D", encre: "#6B5840" },
    motif: "coeurs",
    fontFamily: "'Caveat', 'Cormorant Garamond', cursive",
  },
  4: {
    id: 4,
    occasion: "enfance",
    variation: "contemporain",
    label: "Aquarelle",
    occasionLabel: "Enfance",
    description: "Lavis bleu poudré, éclaboussures artistiques",
    palette: { bg: "#EAF1EE", surface: "#C9DCD1", accent: "#8FB4A0", encre: "#3D4A45" },
    motif: "aquarelle",
    fontFamily: "'Cormorant Garamond', serif",
  },
  5: {
    id: 5,
    occasion: "deuil",
    variation: "classique",
    label: "Hommage",
    occasionLabel: "Deuil",
    description: "Noir profond, or, lys stylisé",
    palette: { bg: "#1A1A1A", surface: "#2A2520", accent: "#C4956A", encre: "#F0E6D8" },
    motif: "lys",
    fontFamily: "'Cinzel', 'Cormorant Garamond', serif",
  },
  6: {
    id: 6,
    occasion: "deuil",
    variation: "contemporain",
    label: "Mémoire",
    occasionLabel: "Deuil",
    description: "Sépia, crème vieilli, sobriété photographique",
    palette: { bg: "#EDE3D0", surface: "#D4C4A8", accent: "#7A5B3D", encre: "#3A2D20" },
    motif: "sepia",
    fontFamily: "'Cormorant Garamond', serif",
  },
  7: {
    id: 7,
    occasion: "anniversaire",
    variation: "classique",
    label: "Festif",
    occasionLabel: "Anniversaire",
    description: "Corail, bokeh doré, étincelant",
    palette: { bg: "#FFF4EB", surface: "#FFE0CC", accent: "#D9795E", encre: "#5C3826" },
    motif: "bokeh",
    fontFamily: "'Cormorant Garamond', serif",
  },
  8: {
    id: 8,
    occasion: "anniversaire",
    variation: "contemporain",
    label: "Élégant",
    occasionLabel: "Anniversaire",
    description: "Champagne, bordeaux, ruban foil",
    palette: { bg: "#F5EEDF", surface: "#E5D5B7", accent: "#7A2832", encre: "#2A1A1E" },
    motif: "ruban",
    fontFamily: "'Cinzel', 'Cormorant Garamond', serif",
  },
  9: {
    id: 9,
    occasion: "solennel",
    variation: "classique",
    label: "Cérémonie",
    occasionLabel: "Solennel",
    description: "Bleu nuit, or, sceau armorié",
    palette: { bg: "#1A2B4A", surface: "#243759", accent: "#C19A5B", encre: "#FAF6ED" },
    motif: "sceau",
    fontFamily: "'Cinzel', serif",
  },
  10: {
    id: 10,
    occasion: "solennel",
    variation: "contemporain",
    label: "Prestige",
    occasionLabel: "Solennel",
    description: "Noir profond, monogramme foil platine",
    palette: { bg: "#0F0F12", surface: "#1F1F24", accent: "#D4D2C2", encre: "#F0EFE6" },
    motif: "monogramme-foil",
    fontFamily: "'Cinzel', serif",
  },
}

export function styleAccessible(style: StyleId, forfait: Forfait): boolean {
  return FORFAIT_CONFIG[forfait].styles_disponibles.includes(style)
}

export function styleVerrouillePour(style: StyleId): Forfait | null {
  if (FORFAIT_CONFIG.standard.styles_disponibles.includes(style)) return null
  if (FORFAIT_CONFIG.pro.styles_disponibles.includes(style)) return "pro"
  return "premium"
}
