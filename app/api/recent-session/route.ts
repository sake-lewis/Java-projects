import { NextRequest, NextResponse } from "next/server"
import { reclamerSessionRecente } from "@/lib/session/manager"
import { Forfait } from "@/types"

export const runtime = "nodejs"
export const maxDuration = 10

/**
 * Réclame (de manière atomique) la session payée la plus récente du forfait
 * demandé, dans une fenêtre de 2 minutes. Le statut passe de "paid" à
 * "claimed" et est ainsi verrouillé pour ce client.
 *
 * Sondé par /merci toutes les 2 secondes pendant ~60 s après le paiement.
 * Méthode POST car la réclamation est une mutation, non une lecture pure.
 */
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const forfait = searchParams.get("forfait") as Forfait | null

  if (!forfait || !["standard", "pro", "premium"].includes(forfait)) {
    return NextResponse.json({ error: "Forfait invalide" }, { status: 400 })
  }

  const session = await reclamerSessionRecente(forfait)
  if (!session) {
    return NextResponse.json({ found: false }, { status: 200 })
  }
  return NextResponse.json({ found: true, token: session.token, forfait: session.forfait })
}
