import { NextResponse } from "next/server"
import { verifierEtRafraichirAdmin } from "@/lib/admin/auth"

export const runtime = "nodejs"

/**
 * Endpoint très léger : rafraîchit le cookie admin si la session est encore
 * valide. Appelé par le détecteur d'inactivité côté client quand l'utilisateur
 * choisit de prolonger sa session, ou périodiquement quand il est actif.
 */
export async function POST() {
  const ok = await verifierEtRafraichirAdmin()
  if (!ok) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }
  return NextResponse.json({ ok: true })
}
