import { NextRequest, NextResponse } from "next/server"
import { motDePasseValide, poserCookieAdmin } from "@/lib/admin/auth"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  try {
    const { mot_de_passe } = await req.json()
    if (typeof mot_de_passe !== "string" || !motDePasseValide(mot_de_passe)) {
      return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 401 })
    }
    await poserCookieAdmin()
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 })
  }
}
