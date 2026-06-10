import type { Browser } from "puppeteer-core"

/**
 * Lance Chromium pour la génération PDF.
 *
 * - En production / sur Vercel : binaire serverless léger
 *   (`puppeteer-core` + `@sparticuz/chromium`), compatible avec les limites
 *   des fonctions serverless.
 * - En local : Chromium complet fourni par `puppeteer` (devDependency).
 *
 * Les imports sont dynamiques pour qu'aucun des deux moteurs ne soit chargé
 * inutilement selon l'environnement.
 */
export async function launchBrowser(): Promise<Browser> {
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
