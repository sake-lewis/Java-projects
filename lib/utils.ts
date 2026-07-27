// ============================================================
// Utilitaires partagés
// ============================================================

/** 15000 → "15 000 FCFA" */
export function formatFCFA(montant: number): string {
  return `${montant.toLocaleString("fr-FR").replace(/ /g, " ")} FCFA`
}

/**
 * Normalise un numéro WhatsApp en format international sans « + » :
 * "+237 6 75 94 71 60" → "237675947160". Un numéro local à 9 chiffres
 * commençant par 6 (Cameroun) reçoit l'indicatif 237 par défaut.
 */
export function normaliserWhatsapp(brut: string): string {
  let n = brut.replace(/[^\d]/g, "")
  if (n.startsWith("00")) n = n.slice(2)
  if (n.length === 9 && n.startsWith("6")) n = "237" + n
  return n
}

/** Lien wa.me pré-rempli pour une fiche produit. */
export function lienWhatsappProduit(
  numero: string,
  nomProduit: string,
  prixFormate: string
): string {
  const texte = `Bonjour, je suis intéressé(e) par « ${nomProduit} » à ${prixFormate}, vu dans votre catalogue.`
  return `https://wa.me/${numero}?text=${encodeURIComponent(texte)}`
}

/**
 * Assainit un nom d'entreprise pour servir de nom de fichier PDF sur tous
 * les OS (Windows/Android/macOS). Ex: « Chez Mariama & Fils » → "Chez-Mariama-Fils".
 */
export function assainirNomFichier(nom: string): string {
  const sansAccents = nom.normalize("NFD").replace(/[̀-ͯ]/g, "")
  const propre = sansAccents
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 80)
  return propre || "catalogue"
}

/** "12 mars 2026" */
export function formatDateFR(d: Date | null | undefined): string {
  if (!d) return "—"
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}
