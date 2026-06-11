export type Forfait = "standard" | "pro" | "premium"

export type StatutSession =
  | "paid"        // Lien généré par l'admin, pas encore ouvert par le client
  | "claimed"     // Anciennement utilisé par /merci ; conservé pour compat données
  | "generating"
  | "ready"
  | "downloaded"
  | "expired"

// Les 20 styles : 5 thèmes × 4 styles. Convention de numérotation :
//   id = (index du thème × 4) + position dans le thème (1..4)
//   Thèmes : Nature (1-4), Élégance (5-8), Vif (9-12), Moderne (13-16), Héritage (17-20)
//   Déblocage par position : 1 & 2 → Standard, 3 → Pro, 4 → Premium
export type StyleId =
  | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
  | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20

export type EffetPhoto = "couleur" | "nb" | "sepia"

export interface Photo {
  url: string
  description?: string
  effet?: EffetPhoto
  // Rapport largeur/hauteur naturel de l'image — pilote le recadrage
  // intelligent (choix de la mise en page selon l'orientation).
  ratio?: number
}

// Une page de l'album : 1 à 4 photos. La mise en page est déduite
// automatiquement du nombre de photos et de leurs orientations.
export interface PageAlbum {
  photos: Photo[]
}

export const PHOTOS_PAR_PAGE_MAX = 4

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
  // Index (dans la liste aplatie des photos de toutes les pages) de la photo
  // choisie comme couverture (Premium uniquement).
  photo_couverture_index?: number | null
  pages: PageAlbum[]
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
    // Positions 1 & 2 de chaque thème (10/20).
    styles_disponibles: [1, 2, 5, 6, 9, 10, 13, 14, 17, 18],
    dedicace_max: 0,
    effets_photo: false,
    photo_couverture: false,
    edition_unique: false,
  },
  pro: {
    prix: 5000,
    photos_max: 100,
    label: "Pro",
    // + position 3 de chaque thème (15/20).
    styles_disponibles: [1, 2, 3, 5, 6, 7, 9, 10, 11, 13, 14, 15, 17, 18, 19],
    dedicace_max: 200,
    effets_photo: true,
    photo_couverture: false,
    edition_unique: false,
  },
  premium: {
    prix: 10000,
    photos_max: 200,
    label: "Premium",
    // Tous les styles (20/20).
    styles_disponibles: [
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
      11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
    ],
    dedicace_max: 500,
    effets_photo: true,
    photo_couverture: true,
    edition_unique: true,
  },
}
