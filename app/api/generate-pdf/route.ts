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

export async function POST(req: NextRequest) {
  let currentToken: string | null = null;

  try {
    const { token, nom_catalogue, description, style_choisi, photos } = await req.json();
    currentToken = token;

    const session = await verifierToken(token);
    if (!session) {
      return NextResponse.json({ error: "Session invalide ou expirée" }, { status: 404 });
    }

    if (session.statut !== "paid" && session.statut !== "generating") {
      return NextResponse.json({ error: "Action non autorisée" }, { status: 403 });
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
      await updateSession(currentToken, { statut: "paid" });
    }
    return NextResponse.json({ error: "Génération échouée, veuillez réessayer" }, { status: 500 });
  }
}