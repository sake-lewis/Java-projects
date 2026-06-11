import crypto from "crypto"
import { cookies } from "next/headers"

const COOKIE_NAME = "everbloom_admin"
// Fenêtre glissante d'inactivité de 15 minutes : le cookie expire 15 min après
// la dernière action admin (sliding session). Combiné au détecteur côté client,
// le proprio est protégé si son téléphone reste déverrouillé sur l'admin.
export const DUREE_MS = 15 * 60 * 1000

function getSecret(): string {
  const s = process.env.ADMIN_SESSION_SECRET
  if (!s || s.length < 16) {
    throw new Error("ADMIN_SESSION_SECRET manquant ou trop court")
  }
  return s
}

function signer(payload: string): string {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("hex")
}

function comparerConstant(a: string, b: string): boolean {
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ba.length !== bb.length) return false
  return crypto.timingSafeEqual(ba, bb)
}

export function motDePasseValide(fourni: string): boolean {
  const attendu = process.env.ADMIN_PASSWORD
  if (!attendu) return false
  return comparerConstant(fourni, attendu)
}

export function fabriquerJeton(): string {
  const expire_at = Date.now() + DUREE_MS
  const payload = String(expire_at)
  return `${payload}.${signer(payload)}`
}

export function jetonValide(jeton: string | undefined): boolean {
  if (!jeton) return false
  const [payload, signature] = jeton.split(".")
  if (!payload || !signature) return false
  const attendue = signer(payload)
  if (!comparerConstant(signature, attendue)) return false
  const expire_at = Number(payload)
  if (!Number.isFinite(expire_at)) return false
  return Date.now() < expire_at
}

export async function poserCookieAdmin(): Promise<void> {
  const store = await cookies()
  store.set(COOKIE_NAME, fabriquerJeton(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(DUREE_MS / 1000),
  })
}

export async function effacerCookieAdmin(): Promise<void> {
  const store = await cookies()
  store.delete(COOKIE_NAME)
}

export async function estAdminConnecte(): Promise<boolean> {
  const store = await cookies()
  return jetonValide(store.get(COOKIE_NAME)?.value)
}

/**
 * Variante pour Route Handlers : vérifie le cookie ET le rafraîchit si valide,
 * réalisant le sliding session côté serveur. À appeler dans CHAQUE endpoint
 * admin protégé (pas dans les Server Components, qui ne peuvent pas muter les
 * cookies sans Server Action).
 */
export async function verifierEtRafraichirAdmin(): Promise<boolean> {
  const store = await cookies()
  const valide = jetonValide(store.get(COOKIE_NAME)?.value)
  if (valide) {
    // Reset la fenêtre glissante (nouveau jeton avec expire_at = now + 15 min)
    store.set(COOKIE_NAME, fabriquerJeton(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: Math.floor(DUREE_MS / 1000),
    })
  }
  return valide
}
