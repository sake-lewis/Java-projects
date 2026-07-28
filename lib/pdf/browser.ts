import { existsSync } from "fs"
import type { Browser } from "puppeteer-core"

/**
 * Emplacements habituels de Chrome / Edge sur un PC Windows (et macOS/Linux).
 * Utilisés en local quand aucun PUPPETEER_EXECUTABLE_PATH n'est défini : on
 * réutilise le navigateur déjà installé plutôt que de télécharger un Chromium
 * de 150 Mo à chaque installation.
 */
const NAVIGATEURS_LOCAUX = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
]

function trouverNavigateurLocal(): string | null {
  for (const chemin of NAVIGATEURS_LOCAUX) {
    try {
      if (existsSync(chemin)) return chemin
    } catch {
      // chemin inaccessible : on essaie le suivant
    }
  }
  return null
}

/**
 * Lance Chromium pour la génération PDF.
 *
 * - Sur Vercel : binaire serverless léger (`puppeteer-core` + `@sparticuz/chromium`).
 * - En local avec PUPPETEER_EXECUTABLE_PATH : utilise ce binaire.
 * - En local sinon : le Chrome (ou Edge) déjà installé sur le PC ; en dernier
 *   recours seulement, le Chromium de la devDependency `puppeteer`.
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

  // --- Local : Chrome / Edge déjà installé sur le poste, sans téléchargement ---
  const navigateur = trouverNavigateurLocal()
  if (navigateur) {
    const puppeteer = (await import("puppeteer-core")).default
    return puppeteer.launch({
      executablePath: navigateur,
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    })
  }

  // --- Dernier recours : le Chromium téléchargé par `puppeteer` ---
  try {
    const puppeteer = (await import("puppeteer")).default
    return puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    }) as unknown as Browser
  } catch {
    throw new Error(
      "Aucun navigateur trouvé pour générer le PDF. Installe Google Chrome, " +
        "ou renseigne PUPPETEER_EXECUTABLE_PATH dans .env.local avec le chemin " +
        "complet de chrome.exe."
    )
  }
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
