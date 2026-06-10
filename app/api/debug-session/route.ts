import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { creerSession } from '@/lib/session/manager';
import { Forfait } from '@/types';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  // Endpoint de test : crée une session "payée" sans paiement réel.
  // Strictement interdit en production pour éviter la création gratuite de catalogues.
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const forfait = searchParams.get('forfait') as Forfait;

    if (!forfait || !['standard', 'pro', 'premium'].includes(forfait)) {
      return NextResponse.json({ error: "Forfait invalide" }, { status: 400 });
    }

    const token = uuidv4();
    await creerSession(forfait, token, "test@everbloom.fr");

    // Rediriger vers la page de création avec le nouveau token
    return NextResponse.redirect(new URL(`/create/${forfait}?token=${token}`, req.url));
  } catch (error) {
    console.error("Erreur Debug Session:", error);
    return NextResponse.json({ error: "Erreur lors de la création de la session" }, { status: 500 });
  }
}
