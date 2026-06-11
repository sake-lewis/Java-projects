import { NextResponse } from "next/server"
import { getAdminDb } from "@/lib/firebase/admin"
import { verifierEtRafraichirAdmin } from "@/lib/admin/auth"
import { Session } from "@/types"

export const runtime = "nodejs"

export async function GET() {
  if (!(await verifierEtRafraichirAdmin())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const snap = await getAdminDb()
    .collection("sessions")
    .orderBy("created_at", "desc")
    .limit(30)
    .get()

  const sessions = snap.docs.map(d => {
    const s = d.data() as Session
    return {
      token: s.token,
      forfait: s.forfait,
      statut: s.statut,
      nom_catalogue: s.nom_catalogue,
      created_at: s.created_at,
      pdf_expires_at: s.pdf_expires_at,
    }
  })

  return NextResponse.json({ sessions })
}
