import type { Forfait, Secteur } from "@/types"

// ============================================================
// Règles métier — source de vérité unique
// (cahier des charges « Outil de génération de catalogues digitaux »)
// ============================================================

export const FORFAITS: Record<
  Forfait,
  {
    label: string
    prix: number // FCFA
    produits_max: number
    credits_inclus: number
    niveau: string // description du niveau de design
  }
> = {
  basic: {
    label: "Basic",
    prix: 500,
    produits_max: 25,
    credits_inclus: 3,
    niveau: "Simple, couleurs sobres",
  },
  standard: {
    label: "Standard",
    prix: 750,
    produits_max: 35,
    credits_inclus: 6,
    niveau: "Avancé, palette du secteur",
  },
  premium: {
    label: "Premium",
    prix: 1000,
    produits_max: 50,
    credits_inclus: 10,
    niveau: "Personnalisation pro + sections bonus",
  },
}

// Pack de recharge de crédits (au-delà des crédits inclus)
export const PACK_RECHARGE = {
  credits: 5,
  prix: 350, // FCFA — dans la fourchette 300–400 F du cahier des charges
}

// Durée de validité des crédits inclus dans un forfait (mois)
export const VALIDITE_CREDITS_MOIS = 6

// Rétention des photos Cloudinary après la dernière génération de PDF (jours)
export const RETENTION_PHOTOS_JOURS = 7

// Les 10 secteurs d'activité (chacun a son ambiance visuelle fixe,
// définie dans lib/pdf/ambiances.ts)
export const SECTEURS: Record<Secteur, { label: string; tagline: string }> = {
  mode: { label: "Mode & Vêtements", tagline: "Collection" },
  beaute: { label: "Beauté & Cosmétique", tagline: "Soins & Beauté" },
  alimentation: { label: "Alimentation & Restauration", tagline: "Menu & Saveurs" },
  immobilier: { label: "Immobilier", tagline: "Biens & Opportunités" },
  electronique: { label: "Électronique & Téléphonie", tagline: "High-Tech" },
  artisanat: { label: "Artisanat & Décoration", tagline: "Fait main" },
  services: { label: "Services professionnels", tagline: "Nos prestations" },
  agro: { label: "Agroalimentaire & Agriculture", tagline: "Produits de la terre" },
  automobile: { label: "Automobile & Transport", tagline: "Véhicules & Services" },
  evenementiel: { label: "Événementiel & Loisirs", tagline: "Moments inoubliables" },
}

export const LISTE_SECTEURS = Object.entries(SECTEURS).map(([id, s]) => ({
  id: id as Secteur,
  ...s,
}))

/** Date d'expiration des crédits : maintenant + 6 mois. */
export function calculerExpirationCredits(depuis: Date = new Date()): Date {
  const d = new Date(depuis)
  d.setMonth(d.getMonth() + VALIDITE_CREDITS_MOIS)
  return d
}

export function creditsExpires(dateExpiration: Date | null): boolean {
  if (!dateExpiration) return true
  return Date.now() > dateExpiration.getTime()
}
