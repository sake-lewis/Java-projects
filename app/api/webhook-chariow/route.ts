import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { creerSession } from '@/lib/session/manager';
import { Forfait } from '@/types';

export const runtime = 'nodejs';

/**
 * Compare deux chaînes en temps constant pour éviter les attaques temporelles.
 */
function secretValide(fourni: string | null, attendu: string): boolean {
  if (!fourni) return false;
  const a = Buffer.from(fourni);
  const b = Buffer.from(attendu);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  try {
    // Authentification du webhook : seul Chariow (qui connaît le secret) peut
    // créer des sessions. Sans cela, n'importe qui pourrait générer des
    // catalogues gratuitement en appelant cet endpoint.
    const webhookSecret = process.env.CHARIOW_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("CHARIOW_WEBHOOK_SECRET non configuré : webhook refusé.");
      return NextResponse.json({ error: "Configuration manquante" }, { status: 500 });
    }

    const fourni =
      req.headers.get('x-chariow-signature') ??
      req.headers.get('x-webhook-secret') ??
      new URL(req.url).searchParams.get('secret');

    if (!secretValide(fourni, webhookSecret)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();

    if (body.event !== "successful.sale") {
      return NextResponse.json({ message: "Event ignored" }, { status: 200 });
    }

    const { customer, metadata } = body;
    const forfait = metadata?.forfait as Forfait;

    if (!forfait || !['standard', 'pro', 'premium'].includes(forfait)) {
      return NextResponse.json({ error: "Forfait non reconnu ou manquant dans les métadonnées" }, { status: 400 });
    }

    const token = uuidv4();
    await creerSession(forfait, token, customer.email);

    return NextResponse.json({ token }, { status: 200 });
  } catch (error) {
    console.error("Erreur Webhook Chariow:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
