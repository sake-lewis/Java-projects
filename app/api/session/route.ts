import { NextRequest, NextResponse } from "next/server"
import { verifierToken } from "@/lib/session/manager"

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: "Token manquant" }, { status: 400 })
  }

  const session = await verifierToken(token)

  if (!session) {
    return NextResponse.json({ error: "Session non trouvée ou expirée" }, { status: 404 })
  }

  // Ne pas exposer les données sensibles
  const { pdf_hash, ...publicSession } = session as any

  return NextResponse.json(publicSession)
}
