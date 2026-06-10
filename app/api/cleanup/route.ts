import { NextRequest, NextResponse } from 'next/server';
import { nettoyerSessionsExpirees } from '@/lib/session/manager';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
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
