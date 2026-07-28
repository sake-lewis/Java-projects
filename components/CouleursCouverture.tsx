"use client";

import { useState } from "react";

// ============================================================
// Choix des couleurs des couvertures (1re et 4e de couverture).
// Disponible pour TOUS les forfaits.
// - Nuanciers prédéfinis (paires fond + texte harmonieuses)
// - Couleur libre (sélecteur), avec texte auto-contrasté modifiable
// - « Ambiance du secteur » = retour aux couleurs par défaut
// Les changements de couleurs sont gratuits (aucun crédit décompté).
// ============================================================

export interface CouleursCatalogue {
  couvFond: string | null;
  couvEncre: string | null;
  finFond: string | null;
  finEncre: string | null;
}

interface Props {
  catalogueId: number;
  initiales: CouleursCatalogue;
  /** Couleur d'accent du forfait (habillage du bouton Enregistrer). */
  accent: string;
  /** Appelé après enregistrement réussi (rafraîchit l'aperçu). */
  onEnregistre: () => void;
}

/** Nuanciers prédéfinis : paires fond / texte toujours lisibles. */
const NUANCIERS: { nom: string; fond: string; encre: string }[] = [
  { nom: "Noir édition", fond: "#101010", encre: "#F5F1E8" },
  { nom: "Ivoire", fond: "#F5EFE3", encre: "#26211A" },
  { nom: "Bordeaux", fond: "#5C1F2B", encre: "#F5E7DC" },
  { nom: "Bleu nuit", fond: "#10263D", encre: "#EDE7DA" },
  { nom: "Émeraude", fond: "#1C4A32", encre: "#EAF2E2" },
  { nom: "Terracotta", fond: "#9C4F26", encre: "#F8EDDF" },
  { nom: "Rose poudré", fond: "#F3E0E4", encre: "#4A3038" },
  { nom: "Sable doré", fond: "#E4D3AF", encre: "#3A2E17" },
  { nom: "Violet royal", fond: "#371A4D", encre: "#F2E9F7" },
  { nom: "Océan", fond: "#0F3A5C", encre: "#E8F0F6" },
];

/** Texte auto-contrasté : encre claire sur fond sombre, et inversement. */
function encreAuto(fondHex: string): string {
  const r = parseInt(fondHex.slice(1, 3), 16) / 255;
  const g = parseInt(fondHex.slice(3, 5), 16) / 255;
  const b = parseInt(fondHex.slice(5, 7), 16) / 255;
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.55 ? "#26211A" : "#F5F1E8";
}

type Choix = { fond: string; encre: string } | null; // null = ambiance du secteur

function SelecteurCouverture({
  titre,
  sousTitre,
  choix,
  onChoix,
}: {
  titre: string;
  sousTitre: string;
  choix: Choix;
  onChoix: (c: Choix) => void;
}) {
  return (
    <div>
      <div className="text-sm font-semibold">{titre}</div>
      <div className="text-xs opacity-55 mb-2">{sousTitre}</div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Défaut : ambiance du secteur */}
        <button
          type="button"
          onClick={() => onChoix(null)}
          className="h-9 px-3 rounded-lg border text-xs font-medium transition-transform active:scale-95"
          style={{
            borderColor: choix === null ? "var(--color-or)" : "rgba(231,225,211,0.2)",
            borderWidth: choix === null ? 2 : 1,
          }}
          title="Couleurs par défaut du secteur d'activité"
        >
          ✦ Ambiance du secteur
        </button>

        {/* Nuanciers prédéfinis */}
        {NUANCIERS.map((n) => {
          const actif = choix?.fond === n.fond && choix?.encre === n.encre;
          return (
            <button
              key={n.nom}
              type="button"
              onClick={() => onChoix({ fond: n.fond, encre: n.encre })}
              className="w-9 h-9 rounded-lg overflow-hidden border transition-transform active:scale-95"
              style={{
                borderColor: actif ? "var(--color-or)" : "rgba(231,225,211,0.2)",
                borderWidth: actif ? 2 : 1,
                background: n.fond,
              }}
              title={n.nom}
            >
              <span
                className="block w-full h-full text-[13px] leading-9 text-center font-serif"
                style={{ color: n.encre }}
              >
                Aa
              </span>
            </button>
          );
        })}

        {/* Couleur libre */}
        <label
          className="h-9 px-2.5 rounded-lg border flex items-center gap-1.5 text-xs cursor-pointer"
          style={{ borderColor: "rgba(231,225,211,0.2)" }}
          title="Choisir une couleur de fond personnalisée"
        >
          <input
            type="color"
            className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 p-0"
            value={choix?.fond ?? "#10263D"}
            onChange={(e) =>
              onChoix({ fond: e.target.value, encre: encreAuto(e.target.value) })
            }
          />
          Perso
        </label>

        {/* Encre (texte) modifiable quand une couleur perso/nuancier est active */}
        {choix && (
          <label
            className="h-9 px-2.5 rounded-lg border flex items-center gap-1.5 text-xs cursor-pointer"
            style={{ borderColor: "rgba(231,225,211,0.2)" }}
            title="Couleur du texte sur cette couverture"
          >
            <input
              type="color"
              className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 p-0"
              value={choix.encre}
              onChange={(e) => onChoix({ ...choix, encre: e.target.value })}
            />
            Texte
          </label>
        )}
      </div>

      {/* Mini prévisualisation de la paire choisie */}
      {choix && (
        <div
          className="mt-2 rounded-lg px-3 py-2 text-xs flex items-center justify-between"
          style={{ background: choix.fond, color: choix.encre }}
        >
          <span className="font-serif text-sm">Nom de l&apos;entreprise</span>
          <span className="opacity-70">
            {choix.fond.toUpperCase()} · {choix.encre.toUpperCase()}
          </span>
        </div>
      )}
    </div>
  );
}

export default function CouleursCouverture({
  catalogueId,
  initiales,
  accent,
  onEnregistre,
}: Props) {
  const depuis = (fond: string | null, encre: string | null): Choix =>
    fond || encre ? { fond: fond ?? "#101010", encre: encre ?? encreAuto(fond ?? "#101010") } : null;

  const [ouvert, setOuvert] = useState(false);
  const [couv, setCouv] = useState<Choix>(depuis(initiales.couvFond, initiales.couvEncre));
  const [fin, setFin] = useState<Choix>(depuis(initiales.finFond, initiales.finEncre));
  const [enregistrement, setEnregistrement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [modifie, setModifie] = useState(false);

  function majCouv(c: Choix) {
    setCouv(c);
    setModifie(true);
  }
  function majFin(c: Choix) {
    setFin(c);
    setModifie(true);
  }

  /** Applique la 1re de couverture à la 4e en un geste. */
  function copierCouvVersFin() {
    setFin(couv ? { ...couv } : null);
    setModifie(true);
  }

  async function enregistrer() {
    setErreur(null);
    setEnregistrement(true);
    try {
      const res = await fetch(`/api/catalogues/${catalogueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          couleurs: {
            couvFond: couv?.fond ?? null,
            couvEncre: couv?.encre ?? null,
            finFond: fin?.fond ?? null,
            finEncre: fin?.encre ?? null,
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErreur(data.error || "Enregistrement impossible.");
        return;
      }
      setModifie(false);
      onEnregistre();
    } catch {
      setErreur("Connexion impossible.");
    } finally {
      setEnregistrement(false);
    }
  }

  return (
    <section className="card">
      {/* En-tête repliable */}
      <button
        type="button"
        onClick={() => setOuvert((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div>
          <div className="text-sm font-semibold">🎨 Couleurs des couvertures</div>
          <div className="text-xs opacity-55">
            1re et 4e de couverture — gratuit, tous forfaits
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Pastilles d'état */}
          <span
            className="w-5 h-5 rounded-full border border-[rgba(231,225,211,0.25)]"
            style={{ background: couv?.fond ?? "transparent" }}
            title="1re de couverture"
          />
          <span
            className="w-5 h-5 rounded-full border border-[rgba(231,225,211,0.25)]"
            style={{ background: fin?.fond ?? "transparent" }}
            title="4e de couverture"
          />
          <span className="text-xs opacity-60">{ouvert ? "▲" : "▼"}</span>
        </div>
      </button>

      {ouvert && (
        <div className="px-4 pb-4 space-y-5 border-t border-[rgba(231,225,211,0.1)] pt-4">
          <SelecteurCouverture
            titre="Première de couverture"
            sousTitre="La page d'ouverture du catalogue"
            choix={couv}
            onChoix={majCouv}
          />

          <SelecteurCouverture
            titre="Fin de couverture (dernière page)"
            sousTitre="La page de contact qui clôt le catalogue"
            choix={fin}
            onChoix={majFin}
          />

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={copierCouvVersFin}
              className="btn-secondary !py-2 !px-3 text-xs"
            >
              Assortir la fin à la couverture
            </button>
            <button
              type="button"
              onClick={enregistrer}
              disabled={enregistrement || !modifie}
              className="btn-primary !py-2 !px-4 text-xs ml-auto"
              style={{ background: accent }}
            >
              {enregistrement ? "Enregistrement…" : modifie ? "Enregistrer les couleurs" : "Enregistré ✓"}
            </button>
          </div>

          {erreur && <p className="text-sm text-[var(--color-erreur)]">{erreur}</p>}
        </div>
      )}
    </section>
  );
}
