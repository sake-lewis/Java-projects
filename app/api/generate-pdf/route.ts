import { NextRequest, NextResponse } from 'next/server';
import { verifierToken, updateSession, marquerPdfPret } from '@/lib/session/manager';
import { supprimerPhotosSession, uploadPdf } from '@/lib/cloudinary/upload';
import { launchBrowser } from '@/lib/pdf/browser';
import { STYLES, styleAccessible } from '@/lib/styles/catalog';
import { StyleId, FORFAIT_CONFIG, EffetPhoto } from '@/types';
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
function photosValides(photos: unknown): photos is { url: string; description?: string; effet?: EffetPhoto }[] {
  if (!Array.isArray(photos)) return false;
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloudName) return false;
  const prefixeAttendu = `https://res.cloudinary.com/${cloudName}/`;
  return photos.every(
    p => p && typeof p.url === 'string' && p.url.startsWith(prefixeAttendu)
  );
}

/**
 * Applique une transformation Cloudinary (effet) en intercalant le segment
 * juste après `/upload/`. Cloudinary chaîne les transformations par `,` et
 * `/` ; on intercale proprement sans toucher au reste.
 */
function appliquerEffet(url: string, effet: EffetPhoto | undefined): string {
  if (!effet || effet === 'couleur') return url;
  const transformation = effet === 'nb' ? 'e_grayscale' : 'e_sepia';
  return url.replace('/image/upload/', `/image/upload/${transformation}/`);
}

const STYLES_VALIDES: StyleId[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/**
 * Numéro d'édition unique pour les forfaits Premium.
 * Forme : `EB-YYYY-XXXX` — YYYY année de création, XXXX 4 hex dérivés du token.
 * Stable (même token → même numéro), pas besoin de compteur global.
 */
function numeroEditionUnique(token: string, dateCreation: number): string {
  const annee = new Date(dateCreation).getFullYear();
  const hash = crypto.createHash('sha256').update(token).digest('hex').slice(0, 4).toUpperCase();
  return `EB-${annee}-${hash}`;
}

export async function POST(req: NextRequest) {
  let currentToken: string | null = null;

  try {
    const body = await req.json();
    const { token, nom_catalogue, description, style_choisi, photos, dedicace, photo_couverture_index } = body;
    currentToken = token;

    const session = await verifierToken(token);
    if (!session) {
      return NextResponse.json({ error: "Session invalide ou expirée" }, { status: 404 });
    }

    if (!["paid", "claimed", "generating"].includes(session.statut)) {
      return NextResponse.json({ error: "Action non autorisée" }, { status: 403 });
    }

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

    if (!photosValides(photos)) {
      return NextResponse.json({ error: "Photos invalides" }, { status: 400 });
    }

    // Validation des champs texte (filets de sécurité au cas où le front est contourné).
    // Les mêmes limites s'appliquent côté UI ; ici on coupe sans rejeter pour la
    // robustesse (génération sans bloquer le client si la copie locale dépasse d'un caractère).
    const nomNorm = typeof nom_catalogue === "string" ? nom_catalogue.slice(0, 60).trim() : "";
    const descNorm = typeof description === "string" ? description.slice(0, 200) : "";
    if (nomNorm.length < 3) {
      return NextResponse.json({ error: "Nom du catalogue trop court" }, { status: 400 });
    }
    // Plafonne aussi la description par photo (80 car. côté UI).
    const photosAvecDesc = photos.map(p => ({
      ...p,
      description: typeof p.description === "string" ? p.description.slice(0, 80) : "",
    }));

    const config = FORFAIT_CONFIG[session.forfait];

    // Dédicace : tronquée silencieusement à la limite du forfait, vidée si forfait sans dédicace.
    const dedicaceNormalisee =
      typeof dedicace === 'string' && config.dedicace_max > 0
        ? dedicace.trim().slice(0, config.dedicace_max)
        : '';
    const dedicacePresente = dedicaceNormalisee.length > 0;

    // Couverture photo : doit pointer vers une photo valide ET être autorisée par le forfait.
    let couvertureIndexValide: number | null = null;
    if (
      config.photo_couverture &&
      typeof photo_couverture_index === 'number' &&
      photo_couverture_index >= 0 &&
      photo_couverture_index < photos.length
    ) {
      couvertureIndexValide = photo_couverture_index;
    }

    // Plafond : la valeur du forfait se joue sur le nombre de photos.
    if (photosAvecDesc.length > config.photos_max) {
      return NextResponse.json(
        { error: `Trop de photos : ${config.photos_max} photos max pour ce forfait` },
        { status: 400 }
      );
    }

    await updateSession(token, {
      statut: "generating",
      nom_catalogue: nomNorm,
      description: descNorm,
      style_choisi: styleId,
      photos: photosAvecDesc,
      dedicace: dedicaceNormalisee,
      photo_couverture_index: couvertureIndexValide,
    });

    const style = STYLES[styleId];

    // Transforme les URLs des photos pour appliquer l'effet choisi par photo.
    const photosRendues = photosAvecDesc.map((p, i) => ({
      url: appliquerEffet(p.url, p.effet),
      url_brute: p.url,                  // pour la couverture si elle ne doit PAS prendre l'effet
      description: p.description ?? '',
      effet: p.effet ?? 'couleur',
      index: i,
    }));

    // Pour la couverture photo, on garde l'image originale (sans effet) :
    // c'est le visuel d'accueil, on veut sa couleur.
    const photoCouverture =
      couvertureIndexValide !== null
        ? photosRendues[couvertureIndexValide]
        : null;

    const templatePath = path.join(
      process.cwd(),
      'lib/pdf/templates/v2',
      `${style.occasion}.html`
    );
    const templateContent = await fs.readFile(templatePath, 'utf-8');
    const template = Handlebars.compile(templateContent);

    const templateData = {
      nom_catalogue: nomNorm,
      description: descNorm,
      photos: photosRendues,
      total_photos: photosRendues.length,
      boutique_url: process.env.NEXT_PUBLIC_CHARIOW_BOUTIQUE_URL,
      variation: style.variation,
      occasion: style.occasion,
      style_label: style.label,
      occasion_label: style.occasionLabel,
      palette: style.palette,
      // Phase 3
      dedicace: dedicaceNormalisee,
      dedicace_presente: dedicacePresente,
      photo_couverture: photoCouverture ? { url: photoCouverture.url_brute } : null,
      edition_unique: config.edition_unique
        ? numeroEditionUnique(token, session.created_at)
        : null,
      date_composition: new Date(session.created_at).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
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
    const pdfUrl = await uploadPdf(pdfBuffer, token, nomNorm);

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
