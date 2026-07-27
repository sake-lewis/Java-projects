// ============================================================
// EVERBLOOM Catalogues — types métier
// ============================================================

export type Forfait = "basic" | "standard" | "premium"

export type Secteur =
  | "mode"
  | "beaute"
  | "alimentation"
  | "immobilier"
  | "electronique"
  | "artisanat"
  | "services"
  | "agro"
  | "automobile"
  | "evenementiel"

export type TypeTransaction = "achat_forfait" | "pack_recharge" | "renouvellement"

export interface ProduitInput {
  nom: string
  prix: number
  description?: string
  photoUrl?: string | null
  photoPublicId?: string | null
}
