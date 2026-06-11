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

export type EffetPhoto = "couleur" | "nb" | "sepia"

export interface Photo {
  url: string
  description?: string
  effet?: EffetPhoto
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
  // Dédicace personnalisée (Pro 200 car. / Premium 500 car.). Vide ou absente sinon.
  dedicace?: string
  // Index dans `photos` de la photo choisie comme couverture (Premium uniquement).
  photo_couverture_index?: number | null
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
    // La valeur commerciale du forfait se joue sur le nombre de photos.
    photos_max: number
    label: string
    styles_disponibles: StyleId[]
    // Longueur max de la dédicace en caractères ; 0 = dédicace désactivée.
    dedicace_max: number
    effets_photo: boolean
    photo_couverture: boolean
    edition_unique: boolean
  }
> = {
  standard: {
    prix: 3000,
    photos_max: 60,
    label: "Standard",
    // 3 styles classiques : Mariage romantique, Enfance tendre, Anniversaire festif.
    styles_disponibles: [1, 3, 7],
    dedicace_max: 0,
    effets_photo: false,
    photo_couverture: false,
    edition_unique: false,
  },
  pro: {
    prix: 5000,
    photos_max: 100,
    label: "Pro",
    // 5 classiques + 2 contemporains au choix (Mariage moderne, Anniversaire élégant).
    styles_disponibles: [1, 2, 3, 5, 7, 8, 9],
    dedicace_max: 200,
    effets_photo: true,
    photo_couverture: false,
    edition_unique: false,
  },
  premium: {
    prix: 10000,
    photos_max: 200,
    label: "Premium",
    // Tous les styles.
    styles_disponibles: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    dedicace_max: 500,
    effets_photo: true,
    photo_couverture: true,
    edition_unique: true,
  },
}
