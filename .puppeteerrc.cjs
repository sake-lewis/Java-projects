/**
 * Configuration Puppeteer du projet.
 *
 * skipDownload : ne pas télécharger le Chromium complet (~150 Mo) à
 * l'installation des dépendances.
 *
 * Pourquoi : en production (Vercel) le PDF est généré avec `puppeteer-core` +
 * `@sparticuz/chromium` — le Chromium de `puppeteer` n'est jamais utilisé. Ce
 * téléchargement ralentit chaque construction et la fait échouer dès que le
 * réseau bronche.
 *
 * En local, lib/pdf/browser.ts détecte automatiquement le Chrome (ou Edge)
 * déjà installé sur le PC. Pour forcer un chemin précis, renseigne
 * PUPPETEER_EXECUTABLE_PATH dans .env.local.
 */
module.exports = {
  skipDownload: true,
};
