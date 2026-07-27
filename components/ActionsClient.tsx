"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Suppression d'un client (avec double confirmation). */
export default function ActionsClient({
  clientId,
  nomEntreprise,
}: {
  clientId: number;
  nomEntreprise: string;
}) {
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);

  async function supprimer() {
    if (
      !window.confirm(
        `Supprimer définitivement « ${nomEntreprise} » ? Catalogues, produits, photos et historique seront effacés.`
      )
    )
      return;
    if (!window.confirm("Cette action est irréversible. Confirmer ?")) return;

    setEnCours(true);
    try {
      const res = await fetch(`/api/clients/${clientId}`, { method: "DELETE" });
      if (res.ok) {
        router.replace("/");
        router.refresh();
      }
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="pt-2 text-center">
      <button
        onClick={supprimer}
        disabled={enCours}
        className="text-xs text-[var(--color-erreur)] opacity-60 hover:opacity-100 underline underline-offset-4"
      >
        {enCours ? "Suppression…" : "Supprimer ce client"}
      </button>
    </div>
  );
}
