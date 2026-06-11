import { NextResponse } from "next/server"
import { verifierEtRafraichirAdmin } from "@/lib/admin/auth"
import { compterSessionsExpirees } from "@/lib/session/manager"

export const runtime = "nodejs"

/**
 * Retourne le nombre de sessions dont le PDF est ≥ 7 jours et qui n'ont pas
 * encore été nettoyées. Sert au dashboard admin pour activer le bouton
 * « Forcer le nettoyage » uniquement quand il y a quelque chose à faire.
 */
export async function GET() {
  if (!(await verifierEtRafraichirAdmin())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }
  try {
    const a_nettoyer = await compterSessionsExpirees()
    return NextResponse.json({ a_nettoyer })
  } catch (e: any) {
    console.error("Erreur status nettoyage:", e)
    return NextResponse.json(
      { error: e?.message ?? "Erreur" },
      { status: 500 }
    )
  }
}
