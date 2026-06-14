import { NextRequest, NextResponse } from "next/server"

// Limite de taille du corps pour l'upload (image 10 Mo → base64 ~13,3 Mo + marge).
const MAX_UPLOAD_BODY = 15 * 1024 * 1024

export function middleware(req: NextRequest) {
  // Garde-fou taille : on rejette tôt un corps trop gros sur l'upload, avant
  // que la route Node ne charge tout en mémoire.
  if (req.method === "POST" && req.nextUrl.pathname === "/api/upload-photo") {
    const cl = Number(req.headers.get("content-length") || 0)
    if (cl > MAX_UPLOAD_BODY) {
      return NextResponse.json({ error: "Image trop volumineuse" }, { status: 413 })
    }
  }

  const isDev = process.env.NODE_ENV !== "production"

  // CSP compatible avec le rendu Next (statique + dynamique) : on ne peut pas
  // utiliser un nonce ici car Next 16 ne l'appose pas sur ses scripts ; une CSP
  // à nonce stricte casserait l'hydratation. Cette politique bloque néanmoins
  // le chargement de scripts externes, verrouille les images/polices/connexions,
  // interdit les iframes tierces, les <base> et les soumissions de formulaire
  // hors origine. 'unsafe-inline' reste nécessaire pour les scripts internes de
  // Next ; le risque XSS résiduel est faible (sorties React échappées, aucun
  // contenu HTML d'origine client). En dev : 'unsafe-eval' + websocket HMR.
  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob: https://res.cloudinary.com https://storage.googleapis.com`,
    `font-src 'self'`,
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
  // S'applique aux pages et aux API, mais pas aux assets statiques.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
