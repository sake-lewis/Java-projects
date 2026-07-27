import { NextRequest, NextResponse } from "next/server"

// Limite de taille du corps pour l'upload photo (10 Mo binaire → ~13,3 Mo en
// base64 + marge JSON).
const MAX_UPLOAD_BODY = 15 * 1024 * 1024

// Routes accessibles sans cookie de session (la vérification HMAC complète est
// faite côté Node dans les layouts / route handlers — le middleware Edge ne
// fait qu'un pré-tri UX : pas de cookie du tout → login direct).
const PUBLIC_PATHS = ["/login", "/api/login", "/api/cron/cleanup"]

const METHODES_MUTANTES = ["POST", "PUT", "PATCH", "DELETE"]

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // --- Anti-CSRF (défense en profondeur, en plus de SameSite=Lax) :
  // toute requête mutante portant un Origin étranger est rejetée.
  if (METHODES_MUTANTES.includes(req.method)) {
    const origin = req.headers.get("origin")
    if (origin) {
      const host = req.headers.get("host")
      let ok = false
      try {
        ok = new URL(origin).host === host
      } catch {
        ok = false
      }
      if (!ok) {
        return NextResponse.json({ error: "Origine non autorisée" }, { status: 403 })
      }
    }
  }

  if (req.method === "POST" && pathname === "/api/upload-photo") {
    const cl = Number(req.headers.get("content-length") || 0)
    if (cl > MAX_UPLOAD_BODY) {
      return NextResponse.json({ error: "Image trop volumineuse (max 10 Mo)" }, { status: 413 })
    }
  }

  const estPublique = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))
  const aCookie = !!req.cookies.get("everbloom_operateur")?.value

  if (!estPublique && !aCookie) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }
    const url = req.nextUrl.clone()
    url.pathname = "/login"
    url.search = ""
    return NextResponse.redirect(url)
  }

  const isDev = process.env.NODE_ENV !== "production"
  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `img-src 'self' data: blob: https://res.cloudinary.com`,
    `font-src 'self' https://fonts.gstatic.com`,
    `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `object-src 'none'`,
  ].join("; ")

  const res = NextResponse.next()
  res.headers.set("Content-Security-Policy", csp)
  return res
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
