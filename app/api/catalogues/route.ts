import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { verifierEtRafraichir } from "@/lib/admin/auth"
import { db, catalogues, clients } from "@/lib/db"

/** Création d'un catalogue supplémentaire pour un client existant. */
export async function POST(req: NextRequest) {
  if (!(await verifierEtRafraichir())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const clientId = Number(body?.clientId)
  if (!Number.isInteger(clientId)) {
    return NextResponse.json({ error: "Client invalide" }, { status: 400 })
  }

  const [client] = await db().select().from(clients).where(eq(clients.id, clientId))
  if (!client) return NextResponse.json({ error: "Client introuvable" }, { status: 404 })

  const titre = String(body?.titre || "").trim() || client.nomEntreprise

  const [catalogue] = await db()
    .insert(catalogues)
    .values({ clientId, titre })
    .returning()

  return NextResponse.json({ catalogue })
}
