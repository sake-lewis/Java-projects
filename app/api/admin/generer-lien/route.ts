import { NextRequest, NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import { creerSession } from "@/lib/session/manager"
import { estAdminConnecte } from "@/lib/admin/auth"
import { Forfait } from "@/types"

export const runtime = "nodejs"

const FORFAITS_VALIDES: Forfait[] = ["standard", "pro", "premium"]

export async function POST(req: NextRequest) {
  if (!(await estAdminConnecte())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  try {
    const { forfait } = await req.json()
    if (!FORFAITS_VALIDES.includes(forfait)) {
      return NextResponse.json({ error: "Forfait inconnu" }, { status: 400 })
    }

    const token = uuidv4()
    await creerSession({ forfait, token, chariow_ref: null })

    const origin = req.nextUrl.origin
    const url = `${origin}/create/${forfait}?token=${token}`
    return NextResponse.json({ token, url, forfait })
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 })
  }
}
