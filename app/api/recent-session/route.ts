import { NextRequest, NextResponse } from "next/server"
import { trouverSessionRecente } from "@/lib/session/manager"
import { Forfait } from "@/types"

export const runtime = "nodejs"
export const maxDuration = 10

/**
 * Permet à la page /merci de retrouver le token créé par le webhook Chariow,
 * à partir de l'email du client et du forfait acheté. Sondé toutes les 2s
 * pendant ~60s après le paiement.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get("email")?.toLowerCase().trim()
  const forfait = searchParams.get("forfait") as Forfait | null

  if (!email || !forfait) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 })
  }
  if (!["standard", "pro", "premium"].includes(forfait)) {
    return NextResponse.json({ error: "Forfait invalide" }, { status: 400 })
  }

  const session = await trouverSessionRecente(email, forfait)
  if (!session) {
    return NextResponse.json({ found: false }, { status: 200 })
  }

  return NextResponse.json({ found: true, token: session.token, forfait: session.forfait })
}
