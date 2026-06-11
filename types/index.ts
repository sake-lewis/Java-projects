export type Forfait = "standard" | "pro" | "premium"

export type StatutSession =
  | "paid"        // Lien généré par l'admin, pas encore ouvert par le client
  | "claimed"     // Anciennement utilisé par /merci ; conservé pour compat données
  | "generating"
  | "ready"
  | "downloaded"
  | "expired"

export interface Photo {
  url: string
  description?: string
}

export interface Session {
  token: string
  forfait: Forfait
  // Identifiants client : tous optionnels. Plus jamais renseignés par le
  // nouveau flux (lien admin), conservés pour compatibilité des anciennes données.
  email?: string | null
  phone?: string | null
  chariow_ref?: string | null
  statut: StatutSession
  claimed_at?: number | null
  nom_catalogue: string
  description: string
  style_choisi: 1 | 2 | 3 | 4 | 5
  photos: Photo[]
  pdf_url: string | null
  pdf_hash: string | null
  created_at: number
  downloaded_at: number | null
  pdf_expires_at: number | null       // ← Date.now() + 7 jours après génération
  session_expires_at: number | null   // ← identique à pdf_expires_at
}

export const FORFAIT_CONFIG = {
  standard: {
    prix: 3000,
    pages_max: 50,
    photos_max: 50,
    label: "Standard",
  },
  pro: {
    prix: 5000,
    pages_max: 100,
    photos_max: 100,
    label: "Pro",
  },
  premium: {
    prix: 10000,
    pages_max: 150,
    photos_max: 150,
    label: "Premium",
  },
}
