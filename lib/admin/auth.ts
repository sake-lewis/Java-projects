import crypto from "crypto"
import { cookies } from "next/headers"

const COOKIE_NAME = "everbloom_operateur"
// Fenêtre glissante d'inactivité de 30 minutes : le cookie expire 30 min après
// la dernière action (sliding session) — confortable pour une session de
// production de catalogues, y compris sur téléphone.
export const DUREE_MS = 30 * 60 * 1000

function getSecret(): string {
  const s = process.env.ADMIN_SESSION_SECRET
  if (!s || s.length < 16) {
    throw new Error("ADMIN_SESSION_SECRET manquant ou trop court (16 caractères minimum)")
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
  const expireAt = Date.now() + DUREE_MS
  const payload = String(expireAt)
  return `${payload}.${signer(payload)}`
}

export function jetonValide(jeton: string | undefined): boolean {
  if (!jeton) return false
  const [payload, signature] = jeton.split(".")
  if (!payload || !signature) return false
  if (!comparerConstant(signature, signer(payload))) return false
  const expireAt = Number(payload)
  if (!Number.isFinite(expireAt)) return false
  return Date.now() < expireAt
}

function optionsCookie() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: Math.floor(DUREE_MS / 1000),
  }
}

export async function poserCookieOperateur(): Promise<void> {
  const store = await cookies()
  store.set(COOKIE_NAME, fabriquerJeton(), optionsCookie())
}

export async function effacerCookieOperateur(): Promise<void> {
  const store = await cookies()
  store.delete(COOKIE_NAME)
}

/** Pour les Server Components (lecture seule, pas de rafraîchissement). */
export async function estConnecte(): Promise<boolean> {
  const store = await cookies()
  return jetonValide(store.get(COOKIE_NAME)?.value)
}

/**
 * Pour les Route Handlers : vérifie le cookie ET le rafraîchit (sliding
 * session). À appeler au début de CHAQUE endpoint protégé.
 */
export async function verifierEtRafraichir(): Promise<boolean> {
  const store = await cookies()
  const valide = jetonValide(store.get(COOKIE_NAME)?.value)
  if (valide) {
    store.set(COOKIE_NAME, fabriquerJeton(), optionsCookie())
  }
  return valide
}
