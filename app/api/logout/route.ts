import { NextResponse } from "next/server"
import { effacerCookieOperateur } from "@/lib/admin/auth"

export async function POST() {
  await effacerCookieOperateur()
  return NextResponse.json({ ok: true })
}
