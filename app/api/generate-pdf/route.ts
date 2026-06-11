import { NextRequest, NextResponse } from 'next/server';
import { verifierToken, updateSession, marquerPdfPret } from '@/lib/session/manager';
import { supprimerPhotosSession, uploadPdf } from '@/lib/cloudinary/upload';
import { launchBrowser } from '@/lib/pdf/browser';
import { STYLES, styleAccessible } from '@/lib/styles/catalog';
import { StyleId, FORFAIT_CONFIG } from '@/types';
import Handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export const runtime = 'nodejs';
// Generation PDF Puppeteer : 120s de timeout (max Vercel Pro), 1024 Mo de RAM
export const maxDuration = 120;

Handlebars.registerHelper('add', function (value: number, addition: number) {
  return value + addition;
});

// Aide template : sélection de classe selon la variation classique/contemporain.
Handlebars.registerHelper('ifVariation', function (
  this: any,
  variation: string,
  attendue: string,
  options: any
) {
  return variation === attendue ? options.fn(this) : options.inverse(this);
});

/**
 * Vérifie que toutes les photos pointent vers le compte Cloudinary configuré.
 *
 * Sans cette validation, un client (avec un token valide) pourrait envoyer
 * n'importe quelle URL — Puppeteer la chargerait au moment du rendu, ce qui
 * ouvrirait un SSRF vers le réseau interne Vercel, les metadata AWS, ou des
 * fichiers locaux via file://. On bloque tout ce qui ne sort pas de Cloudinary.
 */
function photosValides(photos: unknown): photos is { url: string; description?: string }[] {
  if (!Array.isArray(photos)) return false;
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloudName) return false;
  const prefixeAttendu = `https://res.cloudinary.com/${cloudName}/`;
  return photos.every(
    p => p && typeof p.url === 'string' && p.url.startsWith(prefixeAttendu)
  );
}

const STYLES_VALIDES: StyleId[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export async function POST(req: NextRequest) {
  let currentToken: string | null = null;

  try {
    const { token, nom_catalogue, description, style_choisi, photos } = await req.json();
    currentToken = token;

    const session = await verifierToken(token);
    if (!session) {
      return NextResponse.json({ error: "Session invalide ou expirée" }, { status: 404 });
    }

    // Une session peut être "paid" (lien admin fraîchement ouvert), "claimed"
    // (donnée historique) ou "generating" (réessai après échec).
    if (!["paid", "claimed", "generating"].includes(session.statut)) {
      return NextResponse.json({ error: "Action non autorisée" }, { status: 403 });
    }

    // Validation du style : doit être un StyleId valide ET accessible au forfait.
    const styleId = style_choisi as StyleId;
    if (!STYLES_VALIDES.includes(styleId)) {
      return NextResponse.json({ error: "Style inconnu" }, { status: 400 });
    }
    if (!styleAccessible(styleId, session.forfait)) {
      return NextResponse.json(
        { error: "Ce style n'est pas inclus dans votre forfait" },
        { status: 403 }
      );
    }

    // Garde anti-SSRF : refuser tout PDF qui contiendrait des URLs externes.
    if (!photosValides(photos)) {
      return NextResponse.json({ error: "Photos invalides" }, { status: 400 });
    }

    // Validation pages_max : couverture + intro + N photos + clôture = N + 3.
    const pagesMax = FORFAIT_CONFIG[session.forfait].pages_max;
    if (photos.length + 3 > pagesMax) {
      return NextResponse.json(
        { error: `Trop de photos : ${pagesMax} pages max pour ce forfait` },
        { status: 400 }
      );
    }

    await updateSession(token, {
      statut: "generating",
      nom_catalogue,
      description,
      style_choisi: styleId,
      photos,
    });

    const style = STYLES[styleId];

    // Templates v2 : 1 fichier par occasion, paramétré par variation.
    const templatePath = path.join(
      process.cwd(),
      'lib/pdf/templates/v2',
      `${style.occasion}.html`
    );
    const templateContent = await fs.readFile(templatePath, 'utf-8');
    const template = Handlebars.compile(templateContent);

    const templateData = {
      nom_catalogue,
      description,
      photos,
      total_photos: photos.length,
      boutique_url: process.env.NEXT_PUBLIC_CHARIOW_BOUTIQUE_URL,
      // Métadonnées de style passées au template
      variation: style.variation,
      occasion: style.occasion,
      style_label: style.label,
      occasion_label: style.occasionLabel,
      palette: style.palette,
    };

    const html = template(templateData);

    const browser = await launchBrowser();
    let pdfBuffer: Buffer;
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'load' });
      await page.emulateMediaType('screen');
      const arr = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: 0, bottom: 0, left: 0, right: 0 },
      });
      pdfBuffer = Buffer.from(arr);
    } finally {
      await browser.close();
    }

    const hash = crypto.createHash('sha256').update(pdfBuffer).digest('hex');

    // Stockage du PDF sur Cloudinary (resource_type "raw").
    // Le nom du catalogue saisi par le client devient le nom du fichier téléchargé.
    const pdfUrl = await uploadPdf(pdfBuffer, token, nom_catalogue);

    await marquerPdfPret(token, pdfUrl, hash);
    await supprimerPhotosSession(token);

    return NextResponse.json({ pdf_url: pdfUrl }, { status: 200 });

  } catch (error) {
    console.error("Erreur génération PDF:", error);
    if (currentToken) {
      // Revenir à "paid" pour permettre un nouvel essai depuis le même lien.
      await updateSession(currentToken, { statut: "paid" });
    }
    return NextResponse.json({ error: "Génération échouée, veuillez réessayer" }, { status: 500 });
  }
}
