import { NextRequest, NextResponse } from 'next/server';
import { verifierToken, updateSession, marquerPdfPret } from '@/lib/session/manager';
import { supprimerPhotosSession, uploadPdf } from '@/lib/cloudinary/upload';
import { launchBrowser } from '@/lib/pdf/browser';
import Handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export const runtime = 'nodejs';
// Generation PDF Puppeteer : 120s de timeout (max Vercel Pro), 1024 Mo de RAM
export const maxDuration = 120;

Handlebars.registerHelper('add', function(value, addition) {
  return value + addition;
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

export async function POST(req: NextRequest) {
  let currentToken: string | null = null;

  try {
    const { token, nom_catalogue, description, style_choisi, photos } = await req.json();
    currentToken = token;

    const session = await verifierToken(token);
    if (!session) {
      return NextResponse.json({ error: "Session invalide ou expirée" }, { status: 404 });
    }

    // Une session peut être "claimed" (réclamée sur /merci mais pas encore PDF)
    // ou "paid" (ancien flux test) ou "generating" (réessai après échec).
    if (!["paid", "claimed", "generating"].includes(session.statut)) {
      return NextResponse.json({ error: "Action non autorisée" }, { status: 403 });
    }

    // Garde anti-SSRF : refuser tout PDF qui contiendrait des URLs externes.
    // Le client uploade ses photos via /api/upload-photo (qui les place sur
    // Cloudinary), elles doivent donc TOUTES en provenir.
    if (!photosValides(photos)) {
      return NextResponse.json({ error: "Photos invalides" }, { status: 400 });
    }

    await updateSession(token, {
      statut: "generating",
      nom_catalogue,
      description,
      style_choisi,
      photos
    });

    const templatePath = path.join(
      process.cwd(),
      'lib/pdf/templates',
      session.forfait,
      `style-${style_choisi}.html`
    );
    const templateContent = await fs.readFile(templatePath, 'utf-8');
    const template = Handlebars.compile(templateContent);

    const templateData: any = {
      nom_catalogue,
      description,
      photos,
      total_photos: photos.length,
      boutique_url: process.env.NEXT_PUBLIC_CHARIOW_BOUTIQUE_URL
    };

    if (session.forfait === 'premium' && style_choisi === 4) {
      // Bokeh festif doré/corail pour le thème Anniversaire (premium).
      const particules = Array.from({ length: 46 }, () => ({
        x: Math.round(Math.random() * 794),
        y: Math.round(Math.random() * 1123),
        r: Math.round(Math.random() * 16 + 6),
        opacity: (Math.random() * 0.32 + 0.12).toFixed(2),
        color: Math.random() > 0.5 ? "#E7C98F" : "#D9795E"
      }));
      templateData.particules = particules;
    }

    const html = template(templateData);

    const browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    await page.emulateMediaType('screen');
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: 0, bottom: 0, left: 0, right: 0 }
    });
    await browser.close();

    const hash = crypto
      .createHash('sha256')
      .update(pdfBuffer)
      .digest('hex');

    // Stockage du PDF sur Cloudinary (resource_type "raw").
    // Le nom du catalogue saisi par le client devient le nom du fichier téléchargé.
    const pdfUrl = await uploadPdf(Buffer.from(pdfBuffer), token, nom_catalogue);

    await marquerPdfPret(token, pdfUrl, hash);
    await supprimerPhotosSession(token);

    return NextResponse.json({ pdf_url: pdfUrl }, { status: 200 });

  } catch (error) {
    console.error("Erreur génération PDF:", error);
    if (currentToken) {
      // Revenir à "claimed" et non "paid" : la session a déjà été réclamée par
      // ce client sur /merci, on ne doit pas la rendre disponible à un autre.
      await updateSession(currentToken, { statut: "claimed" });
    }
    return NextResponse.json({ error: "Génération échouée, veuillez réessayer" }, { status: 500 });
  }
}