"use client";

import { useCallback, useEffect, useState } from "react";

// ============================================================
// Aperçu du catalogue dans l'espace de travail.
// Charge le HTML de /api/catalogues/[id]/preview (même moteur de
// rendu que le PDF) et l'affiche dans une iframe, avec un mode
// plein écran. Se rafraîchit à chaque modification (prop version).
// ============================================================

interface Props {
  catalogueId: number;
  /** Incrémenté par l'éditeur après chaque modification → rechargement. */
  version: number;
  /** Couleur d'accent du forfait (habillage des boutons). */
  accent: string;
}

export default function ApercuCatalogue({ catalogueId, version, accent }: Props) {
  const [html, setHtml] = useState<string | null>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [pleinEcran, setPleinEcran] = useState(false);

  const charger = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      const res = await fetch(`/api/catalogues/${catalogueId}/preview`, {
        cache: "no-store",
      });
      if (!res.ok) {
        setErreur("Impossible de charger l'aperçu.");
        return;
      }
      setHtml(await res.text());
    } catch {
      setErreur("Connexion impossible pendant le chargement de l'aperçu.");
    } finally {
      setChargement(false);
    }
  }, [catalogueId]);

  useEffect(() => {
    charger();
  }, [charger, version]);

  // Fermer le plein écran avec Échap
  useEffect(() => {
    if (!pleinEcran) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPleinEcran(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pleinEcran]);

  return (
    <section className="card overflow-hidden">
      {/* Barre d'outils de l'aperçu */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-[rgba(231,225,211,0.1)]">
        <div className="text-sm font-semibold">
          Aperçu du catalogue
          {chargement && <span className="opacity-50 font-normal"> — chargement…</span>}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={charger}
            disabled={chargement}
            className="px-2.5 h-8 rounded-lg border border-[rgba(231,225,211,0.15)] text-xs disabled:opacity-40"
            title="Rafraîchir l'aperçu"
          >
            ⟳ Rafraîchir
          </button>
          <button
            onClick={() => setPleinEcran(true)}
            disabled={!html}
            className="px-2.5 h-8 rounded-lg text-xs font-semibold disabled:opacity-40"
            style={{ background: accent, color: "#FFFFFF" }}
            title="Aperçu plein écran"
          >
            ⛶ Plein écran
          </button>
        </div>
      </div>

      {/* Panneau intégré (format A4 vertical) */}
      <div className="relative bg-[#2A2620]">
        {erreur ? (
          <div className="p-6 text-sm text-[var(--color-erreur)]">{erreur}</div>
        ) : html ? (
          <iframe
            key={version}
            title="Aperçu du catalogue"
            srcDoc={html}
            sandbox="allow-scripts"
            className="w-full border-0 bg-white"
            style={{ height: "min(72vh, 640px)" }}
          />
        ) : (
          <div
            className="w-full flex items-center justify-center text-sm opacity-50"
            style={{ height: "min(72vh, 640px)" }}
          >
            Préparation de l&apos;aperçu…
          </div>
        )}
        {chargement && html && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center text-xs text-white">
            Mise à jour…
          </div>
        )}
      </div>

      {/* Mode plein écran */}
      {pleinEcran && html && (
        <div className="fixed inset-0 z-[60] bg-black/85 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm font-semibold text-white/90">
              Aperçu du catalogue — plein écran
            </span>
            <button
              onClick={() => setPleinEcran(false)}
              className="px-3 h-9 rounded-lg text-sm font-semibold text-white border border-white/25 hover:bg-white/10"
            >
              ✕ Fermer (Échap)
            </button>
          </div>
          <div className="flex-1 px-2 pb-2 sm:px-8 sm:pb-6">
            <iframe
              title="Aperçu du catalogue (plein écran)"
              srcDoc={html}
              sandbox="allow-scripts"
              className="w-full h-full border-0 rounded-xl bg-white sm:max-w-3xl sm:mx-auto sm:block"
            />
          </div>
        </div>
      )}
    </section>
  );
}
