"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Boutons « Pack recharge » et « Renouvellement » de la fiche client.
 * Enregistre la transaction et met à jour les crédits côté serveur.
 */
export default function ActionsCredits({
  clientId,
  expire,
}: {
  clientId: number;
  expire: boolean;
}) {
  const router = useRouter();
  const [enCours, setEnCours] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  async function agir(action: "recharge" | "renouvellement") {
    const confirmation =
      action === "recharge"
        ? "Confirmer : le client a payé un pack de 5 modifications (350 F) ?"
        : "Confirmer : le client a payé le renouvellement de son forfait ? Ses crédits repartent pour 6 mois.";
    if (!window.confirm(confirmation)) return;

    setErreur(null);
    setEnCours(action);
    try {
      const res = await fetch(`/api/clients/${clientId}/credits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErreur(data.error || "Opération impossible");
        return;
      }
      router.refresh();
    } catch {
      setErreur("Connexion impossible.");
    } finally {
      setEnCours(null);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          className="btn-secondary flex-1 !py-3 text-sm"
          onClick={() => agir("recharge")}
          disabled={!!enCours || expire}
          title={expire ? "Crédits expirés : passe par un renouvellement" : ""}
        >
          {enCours === "recharge" ? "…" : "+ Pack recharge (5 modifs · 350 F)"}
        </button>
        <button
          className="btn-secondary flex-1 !py-3 text-sm"
          onClick={() => agir("renouvellement")}
          disabled={!!enCours}
        >
          {enCours === "renouvellement" ? "…" : "Renouvellement (6 mois)"}
        </button>
      </div>
      {erreur && <p className="text-sm text-[var(--color-erreur)]">{erreur}</p>}
    </div>
  );
}
