import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { nettoyerSessionsExpirees } from '@/lib/session/manager';

export const runtime = 'nodejs';

// Comparaison à temps constant : ne révèle pas la longueur ni le préfixe du secret.
function secretValide(authHeader: string | null, secret: string): boolean {
  const attendu = Buffer.from(`Bearer ${secret}`);
  const fourni = Buffer.from(authHeader ?? '');
  return fourni.length === attendu.length && crypto.timingSafeEqual(fourni, attendu);
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || !secretValide(authHeader, cronSecret)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const count = await nettoyerSessionsExpirees();

    return NextResponse.json({ 
      success: true, 
      sessions_nettoyees: count 
    }, { status: 200 });
  } catch (error) {
    console.error("Erreur lors du nettoyage des sessions:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
