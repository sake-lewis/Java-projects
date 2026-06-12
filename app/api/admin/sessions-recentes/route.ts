import { NextResponse } from "next/server"
import { getAdminDb } from "@/lib/firebase/admin"
import { expirerSession } from "@/lib/session/manager"
import { verifierEtRafraichirAdmin } from "@/lib/admin/auth"
import { Session } from "@/types"

export const runtime = "nodejs"

// Catégories du tableau de bord :
//   a_utiliser — lien généré, jamais ouvert : prêt à être envoyé au client.
//   en_cours   — le client travaille ou son PDF est encore disponible.
// Les sessions expirées sont purgées au passage (PDF + document supprimés)
// et n'apparaissent jamais dans la réponse.
export type CategorieSession = "a_utiliser" | "en_cours"

export async function GET() {
  if (!(await verifierEtRafraichirAdmin())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const snap = await getAdminDb()
    .collection("sessions")
    .orderBy("created_at", "desc")
    .limit(50)
    .get()

  const maintenant = Date.now()
  const sessions: object[] = []

  for (const d of snap.docs) {
    const s = d.data() as Session

    const expiree =
      s.statut === "expired" ||
      (s.pdf_expires_at !== null && s.pdf_expires_at !== undefined && s.pdf_expires_at <= maintenant)

    if (expiree) {
      // Disparition complète : PDF Cloudinary + document Firestore.
      try {
        await expirerSession(s.token)
      } catch (e) {
        console.error("Purge session expirée échouée:", s.token, e)
      }
      continue
    }

    sessions.push({
      token: s.token,
      forfait: s.forfait,
      statut: s.statut,
      categorie: s.statut === "paid" ? "a_utiliser" : "en_cours",
      nom_catalogue: s.nom_catalogue,
      created_at: s.created_at,
      pdf_expires_at: s.pdf_expires_at,
    })
  }

  return NextResponse.json({ sessions })
}
