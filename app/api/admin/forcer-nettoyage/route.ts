import { NextResponse } from "next/server"
import { verifierEtRafraichirAdmin } from "@/lib/admin/auth"
import { nettoyerSessionsExpirees } from "@/lib/session/manager"

export const runtime = "nodejs"
// Suppression Cloudinary séquentielle : on garde la même marge que le cron.
export const maxDuration = 60

/**
 * Force l'exécution du nettoyage des PDFs expirés (≥ 7 jours), sans attendre
 * le cron quotidien. Réutilise exactement la même logique que le cron — c'est
 * l'admin qui déclenche au lieu du planificateur Vercel.
 */
export async function POST() {
  if (!(await verifierEtRafraichirAdmin())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }
  try {
    const nettoyees = await nettoyerSessionsExpirees()
    return NextResponse.json({ nettoyees })
  } catch (e: any) {
    console.error("Erreur forcer nettoyage:", e)
    return NextResponse.json(
      { error: e?.message ?? "Erreur" },
      { status: 500 }
    )
  }
}
