import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db, clients, catalogues, transactions } from "@/lib/db";
import { FORFAITS, SECTEURS, creditsExpires } from "@/lib/config";
import { formatFCFA, formatDateFR } from "@/lib/utils";
import ActionsCredits from "@/components/ActionsCredits";
import ActionsClient from "@/components/ActionsClient";

export const dynamic = "force-dynamic";

const LIBELLES_TRANSACTION = {
  achat_forfait: "Achat forfait",
  pack_recharge: "Pack recharge",
  renouvellement: "Renouvellement",
} as const;

export default async function FicheClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const clientId = Number(id);
  if (!Number.isInteger(clientId)) notFound();

  const [client] = await db().select().from(clients).where(eq(clients.id, clientId));
  if (!client) notFound();

  const listeCatalogues = await db()
    .select()
    .from(catalogues)
    .where(eq(catalogues.clientId, clientId))
    .orderBy(desc(catalogues.createdAt));

  const listeTransactions = await db()
    .select()
    .from(transactions)
    .where(eq(transactions.clientId, clientId))
    .orderBy(desc(transactions.createdAt))
    .limit(20);

  const config = FORFAITS[client.forfait];
  const expire = creditsExpires(client.dateExpirationCredits);

  return (
    <div className="animate-fade-up space-y-6">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="eyebrow">{SECTEURS[client.secteur].label}</div>
          <h1 className="display text-3xl mt-1">{client.nomEntreprise}</h1>
          <div className="text-sm opacity-60 mt-1">
            WhatsApp +{client.whatsapp} · client depuis le {formatDateFR(client.dateAchat)}
          </div>
        </div>
        <Link href={`/clients/${client.id}/modifier`} className="btn-secondary !px-4 !py-2 text-sm shrink-0">
          Modifier
        </Link>
      </div>

      {/* Forfait & crédits */}
      <section className="card p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs opacity-60">Forfait</div>
            <div className="font-bold text-lg">{config.label}</div>
            <div className="text-xs opacity-60">{config.niveau}</div>
          </div>
          <div className="text-right">
            <div className="text-xs opacity-60">Crédits de modification</div>
            <div className={`font-bold text-3xl ${expire ? "text-[var(--color-erreur)]" : ""}`}>
              {expire ? 0 : client.creditsRestants}
            </div>
            <div className="text-xs opacity-60">
              {expire
                ? `expirés le ${formatDateFR(client.dateExpirationCredits)}`
                : `valables jusqu'au ${formatDateFR(client.dateExpirationCredits)}`}
            </div>
          </div>
        </div>

        {expire && (
          <div className="mt-4 p-3 rounded-xl bg-[rgba(224,101,79,0.08)] text-sm text-[var(--color-erreur)]">
            Les crédits de ce client ont expiré (validité 6 mois). Son dernier PDF
            reste sa propriété, mais toute nouvelle modification nécessite un
            renouvellement.
          </div>
        )}
        {!expire && client.creditsRestants === 0 && (
          <div className="mt-4 p-3 rounded-xl bg-[rgba(196,149,106,0.15)] text-sm">
            Plus de crédits : propose au client un pack de recharge (5 modifications).
          </div>
        )}

        <div className="hairline-or my-4" />
        <ActionsCredits clientId={client.id} expire={expire} />
      </section>

      {/* Catalogues */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Catalogues</h2>
        </div>
        <div className="space-y-3">
          {listeCatalogues.map((cat) => (
            <Link
              key={cat.id}
              href={`/catalogues/${cat.id}`}
              className="card p-4 flex items-center justify-between gap-3 hover:border-[var(--color-or)] transition-colors block"
            >
              <div className="min-w-0">
                <div className="font-semibold truncate">{cat.titre}</div>
                <div className="text-xs opacity-60 mt-0.5">
                  {cat.derniereGenerationAt
                    ? `Dernier PDF : ${formatDateFR(cat.derniereGenerationAt)}`
                    : "En création — jamais généré"}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                {cat.photosExpirees && (
                  <span className="badge badge-rouge">Photos expirées</span>
                )}
                <span className="text-xs opacity-40">Ouvrir →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Historique des paiements */}
      <section>
        <h2 className="font-semibold mb-3">Paiements</h2>
        <div className="card divide-y divide-[rgba(231,225,211,0.08)]">
          {listeTransactions.length === 0 && (
            <div className="p-4 text-sm opacity-60">Aucune transaction.</div>
          )}
          {listeTransactions.map((t) => (
            <div key={t.id} className="p-3.5 flex items-center justify-between text-sm">
              <div>
                <div className="font-medium">{LIBELLES_TRANSACTION[t.type]}</div>
                <div className="text-xs opacity-60">
                  {formatDateFR(t.createdAt)}
                  {t.creditsAjoutes > 0 && ` · +${t.creditsAjoutes} crédits`}
                </div>
              </div>
              <div className="font-semibold">{formatFCFA(t.montant)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Zone dangereuse */}
      <ActionsClient clientId={client.id} nomEntreprise={client.nomEntreprise} />
    </div>
  );
}
