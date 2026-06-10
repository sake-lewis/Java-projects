export type Forfait = "standard" | "pro" | "premium"

export type StatutSession =
  | "paid"        // Payée, non encore réclamée par un client sur /merci
  | "claimed"     // Réclamée par un client sur /merci (verrouillée pour lui)
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
  // Identifiants client : tous optionnels — selon ce que Chariow transmet
  // (Mobile Money peut n'avoir ni email ni téléphone).
  email?: string | null
  phone?: string | null
  // Référence unique de la vente côté Chariow (sale.id). Toujours présent
  // depuis la migration vers le flux Pulse Chariow.
  chariow_ref?: string | null
  statut: StatutSession
  // Marqueur d'unicité du verrouillage à l'arrivée sur /merci.
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
