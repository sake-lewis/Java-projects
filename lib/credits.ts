import { eq, sql } from "drizzle-orm"
import { db, clients, type Catalogue, type Client } from "@/lib/db"
import { creditsExpires } from "@/lib/config"

// ============================================================
// Règles de crédits de modification
//
// - Tant que le catalogue n'a JAMAIS été généré (création initiale),
//   toutes les opérations sont gratuites.
// - Après la première génération, chaque modification de produit
//   (ajout / édition / suppression) coûte 1 crédit.
// - Crédits expirés (> 6 mois) → aucune modification possible,
//   le client doit renouveler.
// ============================================================

export type ResultatDebit =
  | { ok: true; gratuit: boolean; creditsRestants: number }
  | { ok: false; raison: "credits_epuises" | "credits_expires"; message: string }

export function modificationEstPayante(catalogue: Catalogue): boolean {
  return catalogue.derniereGenerationAt !== null
}

/**
 * Vérifie que la modification est autorisée et débite 1 crédit si le
 * catalogue a déjà été livré. À appeler AVANT d'appliquer la modification.
 */
export async function verifierEtDebiterCredit(
  client: Client,
  catalogue: Catalogue
): Promise<ResultatDebit> {
  // Création initiale : gratuit
  if (!modificationEstPayante(catalogue)) {
    return { ok: true, gratuit: true, creditsRestants: client.creditsRestants }
  }

  if (creditsExpires(client.dateExpirationCredits)) {
    return {
      ok: false,
      raison: "credits_expires",
      message:
        "Les crédits de ce client ont expiré (validité 6 mois). Propose-lui un renouvellement avant de modifier son catalogue.",
    }
  }

  if (client.creditsRestants <= 0) {
    return {
      ok: false,
      raison: "credits_epuises",
      message:
        "Plus aucun crédit de modification. Propose au client un pack de recharge (5 modifications).",
    }
  }

  // Décrément atomique, borné à zéro
  const [maj] = await db()
    .update(clients)
    .set({ creditsRestants: sql`GREATEST(${clients.creditsRestants} - 1, 0)` })
    .where(eq(clients.id, client.id))
    .returning({ creditsRestants: clients.creditsRestants })

  return { ok: true, gratuit: false, creditsRestants: maj?.creditsRestants ?? 0 }
}
