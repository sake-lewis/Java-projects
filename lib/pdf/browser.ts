import type { Browser } from "puppeteer-core"

/**
 * Lance Chromium pour la génération PDF.
 *
 * - Sur Vercel : binaire serverless léger (`puppeteer-core` + `@sparticuz/chromium`).
 * - En local avec PUPPETEER_EXECUTABLE_PATH : utilise ce binaire (Chrome installé).
 * - En local sinon : Chromium complet fourni par `puppeteer` (devDependency).
 */
export async function launchBrowser(): Promise<Browser> {
  const cheminLocal = process.env.PUPPETEER_EXECUTABLE_PATH

  if (cheminLocal) {
    const puppeteer = (await import("puppeteer-core")).default
    return puppeteer.launch({
      executablePath: cheminLocal,
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    })
  }

  const isServerless = !!process.env.VERCEL || process.env.NODE_ENV === "production"

  if (isServerless) {
    const chromium = (await import("@sparticuz/chromium")).default
    const puppeteer = (await import("puppeteer-core")).default
    return puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    })
  }

  const puppeteer = (await import("puppeteer")).default
  return puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  }) as unknown as Browser
}

/** Rend un HTML en PDF A4 (fonds imprimés, sans marges). */
export async function htmlVersPdf(html: string): Promise<Buffer> {
  const browser = await launchBrowser()
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: "load", timeout: 60_000 })
    // Attend la fin des chargements (photos Cloudinary, polices) sans jamais
    // bloquer la génération si une ressource externe traîne.
    await page.waitForNetworkIdle({ idleTime: 500, timeout: 30_000 }).catch(() => {})
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    })
    return Buffer.from(pdf)
  } finally {
    await browser.close()
  }
}
