import crypto from "crypto"
import { cookies } from "next/headers"

const COOKIE_NAME = "everbloom_admin"
const DUREE_MS = 7 * 24 * 60 * 60 * 1000

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
