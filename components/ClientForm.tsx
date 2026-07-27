"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Forfait, Secteur } from "@/types";

// Doit rester aligné avec lib/config.ts (les Client Components ne peuvent pas
// importer de code serveur, on duplique les libellés ici).
const SECTEURS: { id: Secteur; label: string }[] = [
  { id: "mode", label: "Mode & Vêtements" },
  { id: "beaute", label: "Beauté & Cosmétique" },
  { id: "alimentation", label: "Alimentation & Restauration" },
  { id: "immobilier", label: "Immobilier" },
  { id: "electronique", label: "Électronique & Téléphonie" },
  { id: "artisanat", label: "Artisanat & Décoration" },
  { id: "services", label: "Services professionnels" },
  { id: "agro", label: "Agroalimentaire & Agriculture" },
  { id: "automobile", label: "Automobile & Transport" },
  { id: "evenementiel", label: "Événementiel & Loisirs" },
];

const FORFAITS: { id: Forfait; label: string; detail: string }[] = [
  { id: "basic", label: "Basic — 500 F", detail: "25 produits · 3 modifications" },
  { id: "standard", label: "Standard — 750 F", detail: "35 produits · 6 modifications" },
  { id: "premium", label: "Premium — 1 000 F", detail: "50 produits · 10 modifications" },
];

export interface ClientFormValeurs {
  id?: number;
  nomEntreprise: string;
  secteur: Secteur;
  whatsapp: string;
  forfait: Forfait;
  notes: string;
}

export default function ClientForm({
  initial,
  forfaitInitial,
}: {
  initial?: ClientFormValeurs;
  forfaitInitial?: Forfait;
}) {
  const router = useRouter();
  const modeEdition = !!initial?.id;

  const [valeurs, setValeurs] = useState<ClientFormValeurs>(
    initial || {
      nomEntreprise: "",
      secteur: "mode",
      whatsapp: "",
      forfait: forfaitInitial || "basic",
      notes: "",
    }
  );
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  function set<K extends keyof ClientFormValeurs>(k: K, v: ClientFormValeurs[K]) {
    setValeurs((prev) => ({ ...prev, [k]: v }));
  }

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      const res = await fetch(
        modeEdition ? `/api/clients/${initial!.id}` : "/api/clients",
        {
          method: modeEdition ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(valeurs),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErreur(data.error || "Enregistrement impossible");
        return;
      }
      if (modeEdition) {
        router.push(`/clients/${initial!.id}`);
      } else {
        // Après création : direction l'éditeur du premier catalogue
        router.push(`/catalogues/${data.catalogue.id}`);
      }
      router.refresh();
    } catch {
      setErreur("Connexion impossible. Vérifie ta connexion Internet.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <form onSubmit={enregistrer} className="space-y-5">
      <label className="block">
        <span className="text-sm font-medium">Nom de l&apos;entreprise *</span>
        <input
          className="field mt-2"
          value={valeurs.nomEntreprise}
          onChange={(e) => set("nomEntreprise", e.target.value)}
          placeholder="Ex : Boutique Mariama"
          maxLength={60}
          required
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Secteur d&apos;activité *</span>
        <select
          className="field mt-2"
          value={valeurs.secteur}
          onChange={(e) => set("secteur", e.target.value as Secteur)}
        >
          {SECTEURS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        <span className="text-xs opacity-50 mt-1 block">
          Le secteur détermine l&apos;ambiance visuelle du catalogue (palette, typographie).
        </span>
      </label>

      <label className="block">
        <span className="text-sm font-medium">Numéro WhatsApp du vendeur *</span>
        <input
          className="field mt-2"
          value={valeurs.whatsapp}
          onChange={(e) => set("whatsapp", e.target.value)}
          placeholder="Ex : 675 94 71 60 ou +237675947160"
          inputMode="tel"
          required
        />
        <span className="text-xs opacity-50 mt-1 block">
          C&apos;est vers ce numéro que pointeront les boutons « Commander » du PDF.
        </span>
      </label>

      <fieldset>
        <legend className="text-sm font-medium">Forfait *</legend>
        <div className="mt-2 space-y-2">
          {FORFAITS.map((f) => (
            <label
              key={f.id}
              className={`card p-3 flex items-center gap-3 cursor-pointer ${
                valeurs.forfait === f.id ? "!border-[var(--color-or)]" : ""
              }`}
            >
              <input
                type="radio"
                name="forfait"
                checked={valeurs.forfait === f.id}
                onChange={() => set("forfait", f.id)}
                className="accent-[var(--color-vert)]"
              />
              <div>
                <div className="font-semibold text-sm">{f.label}</div>
                <div className="text-xs opacity-60">{f.detail}</div>
              </div>
            </label>
          ))}
        </div>
        {modeEdition && (
          <p className="text-xs opacity-50 mt-2">
            Changer le forfait ne modifie pas les crédits déjà attribués.
          </p>
        )}
      </fieldset>

      <label className="block">
        <span className="text-sm font-medium">Notes (texte « À propos » du forfait Premium)</span>
        <textarea
          className="field mt-2 min-h-24"
          value={valeurs.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Présentation de l'entreprise, informations utiles…"
          maxLength={500}
        />
      </label>

      {erreur && <p className="text-sm text-[var(--color-erreur)]">{erreur}</p>}

      <button className="btn-primary w-full" disabled={enCours}>
        {enCours
          ? "Enregistrement…"
          : modeEdition
            ? "Enregistrer les modifications"
            : "Créer le client et ouvrir son catalogue"}
      </button>
    </form>
  );
}
