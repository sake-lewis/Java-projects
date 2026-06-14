import { StyleId } from "@/types"

// Motifs « image » : un PNG aquarelle par style, déposé dans
// public/motifs/<id>.png (ex. public/motifs/18.png pour Amour & Union).
//
// Le pipeline est progressif : si le fichier d'un style existe, il remplace le
// motif vectoriel ; sinon le motif SVG du catalogue reste utilisé. On peut donc
// ajouter les images une par une, sans rien casser.
//
// Côté client (éditeur, sélecteur) : on tente de charger l'image et on retombe
// sur le SVG via onError si elle est absente.
// Côté serveur (génération PDF) : on lit le fichier et on l'embarque en base64.

/** Chemin public du PNG de motif d'un style. */
export function motifImagePath(id: StyleId): string {
  return `/motifs/${id}.png`
}
