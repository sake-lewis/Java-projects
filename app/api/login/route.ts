import { NextRequest, NextResponse } from "next/server"
import { motDePasseValide, poserCookieOperateur } from "@/lib/admin/auth"

// --- Limitation de débit anti force brute -------------------------------
// 8 tentatives par fenêtre de 15 minutes et par adresse IP. Stockage en
// mémoire : suffisant pour un opérateur unique (chaque instance serverless
// applique sa propre fenêtre, et le délai de 800 ms s'ajoute par-dessus).
const FENETRE_MS = 15 * 60 * 1000
const MAX_TENTATIVES = 8
const tentatives = new Map<string, { n: number; reset: number }>()

function ipDe(req: NextRequest): string {
  return (req.headers.get("x-forwarded-for") || "inconnue").split(",")[0].trim()
}

function tropDeTentatives(ip: string): boolean {
  const maintenant = Date.now()
  const t = tentatives.get(ip)
  if (!t || maintenant > t.reset) {
    tentatives.set(ip, { n: 1, reset: maintenant + FENETRE_MS })
    return false
  }
  t.n += 1
  if (tentatives.size > 5000) tentatives.clear() // garde-fou mémoire
  return t.n > MAX_TENTATIVES
}

export async function POST(req: NextRequest) {
  const ip = ipDe(req)
  if (tropDeTentatives(ip)) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessaie dans 15 minutes." },
      { status: 429 }
    )
  }

  const texte = await req.text().catch(() => "")
  if (texte.length > 4096) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 })
  }
  let password: unknown
  try {
    password = JSON.parse(texte).password
  } catch {
    password = undefined
  }

  if (typeof password !== "string" || password.length > 256 || !motDePasseValide(password)) {
    // Délai constant pour freiner la force brute et lisser le timing
    await new Promise((r) => setTimeout(r, 800))
    return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 401 })
  }

  tentatives.delete(ip)
  await poserCookieOperateur()
  return NextResponse.json({ ok: true })
}
