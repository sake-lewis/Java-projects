export type Forfait = "standard" | "pro" | "premium"

export type StatutSession =
  | "paid"        // Lien généré par l'admin, pas encore ouvert par le client
  | "claimed"     // Anciennement utilisé par /merci ; conservé pour compat données
  | "generating"
  | "ready"
  | "downloaded"
  | "expired"

// Les 10 styles disponibles. Convention :
//   impair = variation Classique, pair = variation Contemporaine
//   ordre canonique : Mariage, Enfance, Deuil, Anniversaire, Solennel
export type StyleId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

export interface Photo {
  url: string
  description?: string
}

export interface Session {
  token: string
  forfait: Forfait
  email?: string | null
  phone?: string | null
  chariow_ref?: string | null
  statut: StatutSession
  claimed_at?: number | null
  nom_catalogue: string
  description: string
  style_choisi: StyleId
  photos: Photo[]
  pdf_url: string | null
  pdf_hash: string | null
  created_at: number
  downloaded_at: number | null
  pdf_expires_at: number | null
  session_expires_at: number | null
}

export const FORFAIT_CONFIG: Record<
  Forfait,
  {
    prix: number
    pages_max: number
    label: string
    styles_disponibles: StyleId[]
  }
> = {
  standard: {
    prix: 3000,
    pages_max: 40,
    label: "Standard",
    // 3 styles classiques : Mariage romantique, Enfance tendre, Anniversaire festif.
    styles_disponibles: [1, 3, 7],
  },
  pro: {
    prix: 5000,
    pages_max: 80,
    label: "Pro",
    // 5 classiques + 2 contemporains au choix (Mariage moderne, Anniversaire élégant).
    styles_disponibles: [1, 2, 3, 5, 7, 8, 9],
  },
  premium: {
    prix: 10000,
    pages_max: 130,
    label: "Premium",
    // Tous les styles.
    styles_disponibles: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  },
}
