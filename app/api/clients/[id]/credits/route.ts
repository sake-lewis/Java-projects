import { NextRequest, NextResponse } from "next/server"
import { eq, sql } from "drizzle-orm"
import { verifierEtRafraichir } from "@/lib/admin/auth"
import { db, clients, transactions } from "@/lib/db"
import {
  FORFAITS,
  PACK_RECHARGE,
  calculerExpirationCredits,
  creditsExpires,
} from "@/lib/config"

type Params = { params: Promise<{ id: string }> }

/**
 * Opérations sur les crédits d'un client :
 * - action "recharge"      → +5 crédits (pack payant), crédits non expirés requis
 * - action "renouvellement"→ remet les crédits du forfait et repart pour 6 mois
 */
export async function POST(req: NextRequest, { params }: Params) {
  if (!(await verifierEtRafraichir())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }
  const { id } = await params
  const clientId = Number(id)
  if (!Number.isInteger(clientId)) {
    return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 })
  }

  const body = await req.json().catch(() => null)
  const action = body?.action as "recharge" | "renouvellement" | undefined

  const [client] = await db().select().from(clients).where(eq(clients.id, clientId))
  if (!client) return NextResponse.json({ error: "Client introuvable" }, { status: 404 })

  if (action === "recharge") {
    if (creditsExpires(client.dateExpirationCredits)) {
      return NextResponse.json(
        {
          error:
            "Les crédits de ce client ont expiré : un pack de recharge ne suffit pas, il faut un renouvellement.",
        },
        { status: 409 }
      )
    }
    const [maj] = await db()
      .update(clients)
      .set({
        creditsRestants: sql`${clients.creditsRestants} + ${PACK_RECHARGE.credits}`,
      })
      .where(eq(clients.id, clientId))
      .returning()
    await db().insert(transactions).values({
      clientId,
      type: "pack_recharge",
      montant: PACK_RECHARGE.prix,
      creditsAjoutes: PACK_RECHARGE.credits,
      note: `Pack ${PACK_RECHARGE.credits} modifications`,
    })
    return NextResponse.json({ client: maj })
  }

  if (action === "renouvellement") {
    const config = FORFAITS[client.forfait]
    const [maj] = await db()
      .update(clients)
      .set({
        creditsRestants: config.credits_inclus,
        dateAchat: new Date(),
        dateExpirationCredits: calculerExpirationCredits(),
      })
      .where(eq(clients.id, clientId))
      .returning()
    await db().insert(transactions).values({
      clientId,
      type: "renouvellement",
      montant: config.prix,
      creditsAjoutes: config.credits_inclus,
      note: `Renouvellement forfait ${config.label}`,
    })
    return NextResponse.json({ client: maj })
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 })
}
