import { NextResponse } from "next/server"
import { effacerCookieAdmin } from "@/lib/admin/auth"

export const runtime = "nodejs"

export async function POST() {
  await effacerCookieAdmin()
  return NextResponse.json({ ok: true })
}
