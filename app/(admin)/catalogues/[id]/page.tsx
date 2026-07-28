import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db, catalogues, clients, produits } from "@/lib/db";
import { FORFAITS, SECTEURS, creditsExpires } from "@/lib/config";
import EditeurCatalogue from "@/components/EditeurCatalogue";

export const dynamic = "force-dynamic";

export default async function CataloguePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const catalogueId = Number(id);
  if (!Number.isInteger(catalogueId)) notFound();

  const [catalogue] = await db()
    .select()
    .from(catalogues)
    .where(eq(catalogues.id, catalogueId));
  if (!catalogue) notFound();

  const [client] = await db()
    .select()
    .from(clients)
    .where(eq(clients.id, catalogue.clientId));
  if (!client) notFound();

  const listeProduits = await db()
    .select()
    .from(produits)
    .where(eq(produits.catalogueId, catalogueId))
    .orderBy(asc(produits.ordre), asc(produits.id));

  const config = FORFAITS[client.forfait];

  return (
    <EditeurCatalogue
      catalogue={{
        id: catalogue.id,
        titre: catalogue.titre,
        dejaGenere: catalogue.derniereGenerationAt !== null,
        photosExpirees: catalogue.photosExpirees,
        couleurs: {
          couvFond: catalogue.couvFond,
          couvEncre: catalogue.couvEncre,
          finFond: catalogue.finFond,
          finEncre: catalogue.finEncre,
        },
      }}
      client={{
        id: client.id,
        nomEntreprise: client.nomEntreprise,
        secteurLabel: SECTEURS[client.secteur].label,
        forfait: client.forfait,
        forfaitLabel: config.label,
        produitsMax: config.produits_max,
        creditsRestants: client.creditsRestants,
        creditsExpires: creditsExpires(client.dateExpirationCredits),
      }}
      produits={listeProduits.map((p) => ({
        id: p.id,
        nom: p.nom,
        prix: p.prix,
        description: p.description || "",
        photoUrl: p.photoUrl,
        photoPublicId: p.photoPublicId,
        ordre: p.ordre,
      }))}
    />
  );
}
