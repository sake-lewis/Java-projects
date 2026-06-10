import { NextRequest, NextResponse } from 'next/server';
import { verifierToken, updateSession, marquerPdfPret } from '@/lib/session/manager';
import { supprimerPhotosSession } from '@/lib/cloudinary/upload';
import { getAdminStorage } from '@/lib/firebase/admin';
import { launchBrowser } from '@/lib/pdf/browser';
import Handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export const runtime = 'nodejs';

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
      const particules = Array.from({ length: 40 }, () => ({
        x: Math.random() * 794,
        y: Math.random() * 1123,
        r: Math.random() * 1 + 1,
        opacity: Math.random() * 0.5 + 0.2,
        color: Math.random() > 0.5 ? "#E91E8C" : "#C4956A"
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

    const bucket = getAdminStorage().bucket();
    const fileRef = bucket.file(`catalogues/${token}/catalogue.pdf`);
    await fileRef.save(pdfBuffer, {
      contentType: 'application/pdf',
      metadata: {
        cacheControl: 'public, max-age=31536000',
      }
    });

    const [signedUrl] = await fileRef.getSignedUrl({
      action: 'read',
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000
    });

    await marquerPdfPret(token, signedUrl, hash);
    await supprimerPhotosSession(token);

    return NextResponse.json({ pdf_url: signedUrl }, { status: 200 });

  } catch (error) {
    console.error("Erreur génération PDF:", error);
    if (currentToken) {
      await updateSession(currentToken, { statut: "paid" });
    }
    return NextResponse.json({ error: "Génération échouée, veuillez réessayer" }, { status: 500 });
  }
}