import { NextRequest, NextResponse } from "next/server"
import { motDePasseValide, poserCookieAdmin } from "@/lib/admin/auth"

export const runtime = "nodejs"

// Anti-force-brute : 5 essais par IP puis blocage 15 minutes.
// Compteur en mémoire d'instance : sur Vercel chaque instance a le sien,
// ce qui ralentit déjà fortement une attaque ; une protection durable
// passerait par un stockage partagé (voir audit).
const MAX_ESSAIS = 5
const FENETRE_MS = 15 * 60 * 1000
const essaisParIp = new Map<string, { count: number; depuis: number }>()

function ipBloquee(ip: string): boolean {
  const e = essaisParIp.get(ip)
  if (!e) return false
  if (Date.now() - e.depuis > FENETRE_MS) {
    essaisParIp.delete(ip)
    return false
  }
  return e.count >= MAX_ESSAIS
}

function compterEchec(ip: string): void {
  const e = essaisParIp.get(ip)
  if (!e || Date.now() - e.depuis > FENETRE_MS) {
    essaisParIp.set(ip, { count: 1, depuis: Date.now() })
  } else {
    e.count++
  }
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "inconnue"

  if (ipBloquee(ip)) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez dans 15 minutes." },
      { status: 429 }
    )
  }

  try {
    const { mot_de_passe } = await req.json()
    if (typeof mot_de_passe !== "string" || !motDePasseValide(mot_de_passe)) {
      compterEchec(ip)
      return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 401 })
    }
    essaisParIp.delete(ip)
    await poserCookieAdmin()
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 })
  }
}
