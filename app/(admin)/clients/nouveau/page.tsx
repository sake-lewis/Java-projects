import ClientForm from "@/components/ClientForm";
import type { Forfait } from "@/types";

export const dynamic = "force-dynamic";

const LABELS: Record<Forfait, string> = {
  basic: "Basic",
  standard: "Standard",
  premium: "Premium",
};

export default async function NouveauClientPage({
  searchParams,
}: {
  searchParams: Promise<{ forfait?: string }>;
}) {
  const { forfait } = await searchParams;
  const forfaitInitial: Forfait =
    forfait === "standard" || forfait === "premium" ? forfait : "basic";

  return (
    <div className="animate-fade-up max-w-lg mx-auto">
      <div className="eyebrow">Nouvelle création · {LABELS[forfaitInitial]}</div>
      <h1 className="display text-3xl mt-1 mb-6">Fiche du client</h1>
      <div className="card p-5">
        <ClientForm forfaitInitial={forfaitInitial} />
      </div>
    </div>
  );
}
