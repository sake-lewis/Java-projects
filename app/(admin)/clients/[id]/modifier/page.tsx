import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, clients } from "@/lib/db";
import ClientForm from "@/components/ClientForm";

export const dynamic = "force-dynamic";

export default async function ModifierClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const clientId = Number(id);
  if (!Number.isInteger(clientId)) notFound();

  const [client] = await db().select().from(clients).where(eq(clients.id, clientId));
  if (!client) notFound();

  return (
    <div className="animate-fade-up max-w-lg mx-auto">
      <div className="eyebrow">Client</div>
      <h1 className="display text-3xl mt-1 mb-6">Modifier {client.nomEntreprise}</h1>
      <div className="card p-5">
        <ClientForm
          initial={{
            id: client.id,
            nomEntreprise: client.nomEntreprise,
            secteur: client.secteur,
            whatsapp: client.whatsapp,
            forfait: client.forfait,
            notes: client.notes || "",
          }}
        />
      </div>
    </div>
  );
}
