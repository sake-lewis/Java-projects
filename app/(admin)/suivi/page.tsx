import Link from "next/link";
import { and, asc, eq, gt, inArray, isNotNull, lt, lte } from "drizzle-orm";
import { db, catalogues, clients } from "@/lib/db";
import { RETENTION_PHOTOS_JOURS, SECTEURS } from "@/lib/config";
import { formatDateFR } from "@/lib/utils";

export const dynamic = "force-dynamic";

// ============================================================
// Page « Suivi » — le cockpit de production : tout ce qui
// demande une action, classé par urgence.
// ============================================================

const JOUR_MS = 24 * 60 * 60 * 1000;

export default async function SuiviPage() {
  const maintenant = new Date();

  // 1. Photos qui seront purgées dans les 2 prochains jours
  const seuilPurgeProche = new Date(
    maintenant.getTime() - (RETENTION_PHOTOS_JOURS - 2) * JOUR_MS
  );
  const photosBientot = await db()
    .select()
    .from(catalogues)
    .where(
      and(
        eq(catalogues.photosExpirees, false),
        isNotNull(catalogues.derniereGenerationAt),
        lt(catalogues.derniereGenerationAt, seuilPurgeProche)
      )
    )
    .orderBy(asc(catalogues.derniereGenerationAt))
    .limit(30);

  // 2. Crédits qui expirent dans les 30 prochains jours (relance renouvellement)
  const dans30j = new Date(maintenant.getTime() + 30 * JOUR_MS);
  const creditsBientotExpires = await db()
    .select()
    .from(clients)
    .where(
      and(
        isNotNull(clients.dateExpirationCredits),
        gt(clients.dateExpirationCredits, maintenant),
        lte(clients.dateExpirationCredits, dans30j)
      )
    )
    .orderBy(asc(clients.dateExpirationCredits))
    .limit(30);

  // 3. Crédits épuisés mais encore valides (proposer un pack de recharge)
  const creditsEpuises = await db()
    .select()
    .from(clients)
    .where(and(eq(clients.creditsRestants, 0), gt(clients.dateExpirationCredits, maintenant)))
    .limit(30);

  // 4. Crédits déjà expirés (proposer un renouvellement)
  const creditsExpiresListe = await db()
    .select()
    .from(clients)
    .where(lt(clients.dateExpirationCredits, maintenant))
    .limit(30);

  // Noms d'entreprise pour les catalogues listés
  const idsClients = [...new Set(photosBientot.map((c) => c.clientId))];
  const proprietaires = idsClients.length
    ? await db().select().from(clients).where(inArray(clients.id, idsClients))
    : [];
  const nomDe = new Map(proprietaires.map((c) => [c.id, c.nomEntreprise]));

  const rienASignaler =
    photosBientot.length === 0 &&
    creditsBientotExpires.length === 0 &&
    creditsEpuises.length === 0 &&
    creditsExpiresListe.length === 0;

  return (
    <div className="animate-fade-up space-y-6">
      <div>
        <div className="eyebrow">Production</div>
        <h1 className="display text-3xl mt-1">Suivi</h1>
        <p className="text-sm opacity-60 mt-1">
          Tout ce qui demande une action, classé par urgence.
        </p>
      </div>

      {rienASignaler && (
        <div className="card p-8 text-center opacity-70">
          Rien à signaler — tout est en ordre. ☘
        </div>
      )}

      {photosBientot.length > 0 && (
        <section>
          <h2 className="font-semibold mb-2 text-[var(--color-erreur)]">
            ⏳ Photos supprimées sous 48 h ({photosBientot.length})
          </h2>
          <p className="text-xs opacity-60 mb-3">
            Dernière chance de faire des modifications sans redemander les photos au client.
          </p>
          <div className="space-y-2">
            {photosBientot.map((c) => {
              const purgeLe = new Date(
                (c.derniereGenerationAt as Date).getTime() + RETENTION_PHOTOS_JOURS * JOUR_MS
              );
              return (
                <Link key={c.id} href={`/catalogues/${c.id}`}
                  className="card p-3.5 flex items-center justify-between gap-3 block hover:border-[var(--color-or)]">
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate">
                      {nomDe.get(c.clientId) || c.titre}
                    </div>
                    <div className="text-xs opacity-60">
                      Purge des photos le {formatDateFR(purgeLe)}
                    </div>
                  </div>
                  <span className="text-xs opacity-40 shrink-0">Ouvrir →</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {creditsEpuises.length > 0 && (
        <section>
          <h2 className="font-semibold mb-2">💳 Crédits épuisés — proposer un pack ({creditsEpuises.length})</h2>
          <div className="space-y-2">
            {creditsEpuises.map((c) => (
              <Link key={c.id} href={`/clients/${c.id}`}
                className="card p-3.5 flex items-center justify-between gap-3 block hover:border-[var(--color-or)]">
                <div className="min-w-0">
                  <div className="font-semibold text-sm truncate">{c.nomEntreprise}</div>
                  <div className="text-xs opacity-60">{SECTEURS[c.secteur].label}</div>
                </div>
                <span className="badge badge-or shrink-0">Pack 350 F</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {creditsBientotExpires.length > 0 && (
        <section>
          <h2 className="font-semibold mb-2">📅 Renouvellements à préparer sous 30 jours ({creditsBientotExpires.length})</h2>
          <div className="space-y-2">
            {creditsBientotExpires.map((c) => (
              <Link key={c.id} href={`/clients/${c.id}`}
                className="card p-3.5 flex items-center justify-between gap-3 block hover:border-[var(--color-or)]">
                <div className="min-w-0">
                  <div className="font-semibold text-sm truncate">{c.nomEntreprise}</div>
                  <div className="text-xs opacity-60">
                    Crédits valides jusqu&apos;au {formatDateFR(c.dateExpirationCredits)}
                  </div>
                </div>
                <span className="badge badge-vert shrink-0">
                  {c.creditsRestants} crédit{c.creditsRestants > 1 ? "s" : ""}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {creditsExpiresListe.length > 0 && (
        <section>
          <h2 className="font-semibold mb-2">🔄 Crédits expirés — relancer pour renouvellement ({creditsExpiresListe.length})</h2>
          <div className="space-y-2">
            {creditsExpiresListe.map((c) => (
              <Link key={c.id} href={`/clients/${c.id}`}
                className="card p-3.5 flex items-center justify-between gap-3 block hover:border-[var(--color-or)]">
                <div className="min-w-0">
                  <div className="font-semibold text-sm truncate">{c.nomEntreprise}</div>
                  <div className="text-xs opacity-60">
                    Expirés le {formatDateFR(c.dateExpirationCredits)}
                  </div>
                </div>
                <span className="badge badge-rouge shrink-0">Expirés</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
