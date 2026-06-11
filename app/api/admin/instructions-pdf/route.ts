import { NextRequest, NextResponse } from "next/server"
import Handlebars from "handlebars"
import fs from "fs/promises"
import path from "path"
import { estAdminConnecte } from "@/lib/admin/auth"
import { launchBrowser } from "@/lib/pdf/browser"
import { Forfait, FORFAIT_CONFIG } from "@/types"

export const runtime = "nodejs"
export const maxDuration = 60

const FORFAITS_VALIDES: Forfait[] = ["standard", "pro", "premium"]
const NUMERO_WHATSAPP = "237675947160"

// Nombre de styles débloqués par forfait (modèle économique 3/7/10 — voir [[everbloom-modele-economique]]).
const STYLES_DISPO: Record<Forfait, number> = {
  standard: 3,
  pro: 7,
  premium: 10,
}

function lienWhatsApp(forfaitLabel: string): string {
  const message = `Bonjour, j'ai payé mon forfait ${forfaitLabel}. Voici ma preuve de paiement.`
  return `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(message)}`
}

export async function GET(req: NextRequest) {
  if (!(await estAdminConnecte())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const forfait = req.nextUrl.searchParams.get("forfait") as Forfait | null
  if (!forfait || !FORFAITS_VALIDES.includes(forfait)) {
    return NextResponse.json({ error: "Forfait inconnu" }, { status: 400 })
  }

  const config = FORFAIT_CONFIG[forfait]
  const forfaitLabel = config.label

  const templatePath = path.join(
    process.cwd(),
    "lib/pdf/templates/instructions/instructions.html"
  )
  const templateContent = await fs.readFile(templatePath, "utf-8")
  const template = Handlebars.compile(templateContent)

  const html = template({
    forfait_label: forfaitLabel,
    photos_max: config.photos_max,
    styles_dispo: STYLES_DISPO[forfait],
    whatsapp_url: lienWhatsApp(forfaitLabel),
  })

  const browser = await launchBrowser()
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: "load" })
    await page.emulateMediaType("screen")
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: 0, bottom: 0, left: 0, right: 0 },
    })

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="everbloom-instructions-${forfait}.pdf"`,
        "Cache-Control": "no-store",
      },
    })
  } finally {
    await browser.close()
  }
}
