import Link from "next/link";
import { desc, ilike, sql } from "drizzle-orm";
import { db, clients, catalogues, transactions } from "@/lib/db";
import { FORFAITS, SECTEURS, creditsExpires } from "@/lib/config";
import { formatFCFA, formatDateFR } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const recherche = (q || "").trim();

  const listeClients = await db()
    .select()
    .from(clients)
    .where(recherche ? ilike(clients.nomEntreprise, `%${recherche}%`) : undefined)
    .orderBy(desc(clients.createdAt))
    .limit(100);

  const [stats] = await db()
    .select({
      nbClients: sql<number>`(select count(*) from ${clients})::int`,
      nbCatalogues: sql<number>`(select count(*) from ${catalogues})::int`,
      ca: sql<number>`coalesce((select sum(${transactions.montant}) from ${transactions}), 0)::int`,
    })
    .from(sql`(select 1) as _un`);

  return (
    <div className="animate-fade-up space-y-6">
      {/* Statistiques */}
      <section className="grid grid-cols-3 gap-3">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold">{stats.nbClients}</div>
          <div className="text-xs opacity-60 mt-1">Clients</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold">{stats.nbCatalogues}</div>
          <div className="text-xs opacity-60 mt-1">Catalogues</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold">{Math.round(stats.ca / 1000)}k</div>
          <div className="text-xs opacity-60 mt-1">FCFA encaissés</div>
        </div>
      </section>

      {/* Recherche */}
      <form className="flex gap-2" action="/">
        <input
          type="search"
          name="q"
          defaultValue={recherche}
          placeholder="Rechercher une entreprise…"
          className="field flex-1"
        />
        <button className="btn-secondary !px-5">OK</button>
      </form>

      {/* Liste clients */}
      <section className="space-y-3">
        {listeClients.length === 0 && (
          <div className="card p-8 text-center">
            <p className="opacity-60">
              {recherche
                ? "Aucun client ne correspond à cette recherche."
                : "Aucun client pour l'instant."}
            </p>
            <Link href="/clients/nouveau" className="btn-primary mt-4">
              Créer mon premier client
            </Link>
          </div>
        )}
        {listeClients.map((c) => {
          const expire = creditsExpires(c.dateExpirationCredits);
          return (
            <Link
              key={c.id}
              href={`/clients/${c.id}`}
              className="card p-4 flex items-center justify-between gap-3 hover:border-[var(--color-or)] transition-colors block"
            >
              <div className="min-w-0">
                <div className="font-semibold truncate">{c.nomEntreprise}</div>
                <div className="text-xs opacity-60 mt-0.5">
                  {SECTEURS[c.secteur].label} · créé le {formatDateFR(c.createdAt)}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="badge badge-or">{FORFAITS[c.forfait].label}</span>
                {expire ? (
                  <span className="badge badge-rouge">Crédits expirés</span>
                ) : (
                  <span className="badge badge-vert">
                    {c.creditsRestants} crédit{c.creditsRestants > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </section>

      <div className="text-center text-xs opacity-40 pt-4">
        {formatFCFA(stats.ca)} encaissés au total
      </div>
    </div>
  );
}
