import { NextRequest, NextResponse } from "next/server"
import { verifierEtRafraichir } from "@/lib/admin/auth"
import { db, clients, catalogues, transactions } from "@/lib/db"
import { FORFAITS, SECTEURS, calculerExpirationCredits } from "@/lib/config"
import { normaliserWhatsapp } from "@/lib/utils"
import type { Forfait, Secteur } from "@/types"

/**
 * Création d'un client : enregistre l'achat du forfait (transaction),
 * crédite les modifications incluses, fixe l'expiration à +6 mois,
 * et crée immédiatement son premier catalogue.
 */
export async function POST(req: NextRequest) {
  if (!(await verifierEtRafraichir())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Corps invalide" }, { status: 400 })

  const nomEntreprise = String(body.nomEntreprise || "").trim()
  const secteur = String(body.secteur || "") as Secteur
  const forfait = String(body.forfait || "") as Forfait
  const whatsapp = normaliserWhatsapp(String(body.whatsapp || ""))
  const notes = String(body.notes || "").trim() || null

  if (nomEntreprise.length < 2 || nomEntreprise.length > 60) {
    return NextResponse.json(
      { error: "Nom d'entreprise requis (2 à 60 caractères)" },
      { status: 400 }
    )
  }
  if (!SECTEURS[secteur]) {
    return NextResponse.json({ error: "Secteur d'activité invalide" }, { status: 400 })
  }
  if (!FORFAITS[forfait]) {
    return NextResponse.json({ error: "Forfait invalide" }, { status: 400 })
  }
  if (whatsapp.length < 8 || whatsapp.length > 15) {
    return NextResponse.json({ error: "Numéro WhatsApp invalide" }, { status: 400 })
  }

  const config = FORFAITS[forfait]
  const maintenant = new Date()

  const [client] = await db()
    .insert(clients)
    .values({
      nomEntreprise,
      secteur,
      whatsapp,
      forfait,
      creditsRestants: config.credits_inclus,
      dateAchat: maintenant,
      dateExpirationCredits: calculerExpirationCredits(maintenant),
      notes,
    })
    .returning()

  await db().insert(transactions).values({
    clientId: client.id,
    type: "achat_forfait",
    montant: config.prix,
    creditsAjoutes: config.credits_inclus,
    note: `Forfait ${config.label}`,
  })

  const [catalogue] = await db()
    .insert(catalogues)
    .values({ clientId: client.id, titre: nomEntreprise })
    .returning()

  return NextResponse.json({ client, catalogue })
}
