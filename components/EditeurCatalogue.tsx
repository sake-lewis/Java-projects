"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ApercuCatalogue from "@/components/ApercuCatalogue";
import CouleursCouverture, { type CouleursCatalogue } from "@/components/CouleursCouverture";

// ============================================================
// Éditeur de catalogue — poste de travail principal de l'opérateur.
// Produits, photos, crédits, génération du PDF.
// ============================================================

interface ProduitVue {
  id: number;
  nom: string;
  prix: number;
  description: string;
  photoUrl: string | null;
  photoPublicId: string | null;
  ordre: number;
}

interface Props {
  catalogue: {
    id: number;
    titre: string;
    dejaGenere: boolean;
    photosExpirees: boolean;
    couleurs: CouleursCatalogue;
  };
  client: {
    id: number;
    nomEntreprise: string;
    secteurLabel: string;
    forfait: "basic" | "standard" | "premium";
    forfaitLabel: string;
    produitsMax: number;
    creditsRestants: number;
    creditsExpires: boolean;
  };
  produits: ProduitVue[];
}

// Univers visuel de l'espace de travail selon le forfait (mode sombre) :
// Basic = vert Everbloom · Standard = bronze · Premium = noir & or
const THEMES_FORFAIT = {
  basic: { accent: "#4E8F6F", bande: "#1E4D3A", texteBande: "#E8E0D5" },
  standard: { accent: "#C4956A", bande: "#C4956A", texteBande: "#1A130B" },
  premium: { accent: "#C9A35C", bande: "#2C2315", texteBande: "#E9C77F" },
} as const;

interface LigneRafale {
  apercu: string;
  photoUrl: string;
  photoPublicId: string;
  nom: string;
  prix: string;
  /** Description facultative — peut rester vide. */
  description: string;
}

interface FormulaireProduit {
  id?: number;
  nom: string;
  prix: string;
  description: string;
  photoUrl: string | null;
  photoPublicId: string | null;
  apercu: string | null;
}

const FORM_VIDE: FormulaireProduit = {
  nom: "",
  prix: "",
  description: "",
  photoUrl: null,
  photoPublicId: null,
  apercu: null,
};

/** Compression côté client avant upload (max 1600px, JPEG 85%). */
async function compresserImage(fichier: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const lecteur = new FileReader();
    lecteur.onload = () => resolve(String(lecteur.result));
    lecteur.onerror = reject;
    lecteur.readAsDataURL(fichier);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = dataUrl;
  });

  const MAX = 1600;
  let { width, height } = img;
  if (width > MAX || height > MAX) {
    const ratio = Math.min(MAX / width, MAX / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", 0.85);
}

function formatFCFA(montant: number): string {
  return `${montant.toLocaleString("fr-FR")} FCFA`;
}

export default function EditeurCatalogue({ catalogue, client, produits }: Props) {
  const router = useRouter();

  const [modalOuvert, setModalOuvert] = useState(false);
  const [form, setForm] = useState<FormulaireProduit>(FORM_VIDE);
  const [uploadEnCours, setUploadEnCours] = useState(false);
  const [sauvegardeEnCours, setSauvegardeEnCours] = useState(false);
  const [generationEnCours, setGenerationEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [erreurModal, setErreurModal] = useState<string | null>(null);

  // --- Aperçu : incrémenté après chaque modification → rechargement ---
  const [versionApercu, setVersionApercu] = useState(0);
  const rafraichirApercu = () => setVersionApercu((v) => v + 1);

  // --- Mode rafale (ajout de produits en masse) ---
  const [rafaleOuvert, setRafaleOuvert] = useState(false);
  const [rafaleLignes, setRafaleLignes] = useState<LigneRafale[]>([]);
  const [rafaleUpload, setRafaleUpload] = useState<{ fait: number; total: number } | null>(null);
  const [rafaleSauvegarde, setRafaleSauvegarde] = useState(false);
  const [erreurRafale, setErreurRafale] = useState<string | null>(null);

  const theme = THEMES_FORFAIT[client.forfait];
  const limiteAtteinte = produits.length >= client.produitsMax;
  const placesRestantes = client.produitsMax - produits.length;
  const modificationPayante = catalogue.dejaGenere;

  const produitsTries = useMemo(
    () => [...produits].sort((a, b) => a.ordre - b.ordre || a.id - b.id),
    [produits]
  );

  function ouvrirAjout() {
    setForm(FORM_VIDE);
    setErreurModal(null);
    setModalOuvert(true);
  }

  function ouvrirEdition(p: ProduitVue) {
    setForm({
      id: p.id,
      nom: p.nom,
      prix: String(p.prix),
      description: p.description,
      photoUrl: p.photoUrl,
      photoPublicId: p.photoPublicId,
      apercu: p.photoUrl,
    });
    setErreurModal(null);
    setModalOuvert(true);
  }

  async function choisirPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const fichier = e.target.files?.[0];
    e.target.value = "";
    if (!fichier) return;
    setErreurModal(null);
    setUploadEnCours(true);
    try {
      const image = await compresserImage(fichier);
      const res = await fetch("/api/upload-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, catalogueId: catalogue.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErreurModal(data.error || "Échec de l'upload de la photo");
        return;
      }
      setForm((f) => ({
        ...f,
        photoUrl: data.url,
        photoPublicId: data.publicId,
        apercu: data.apercu || data.url,
      }));
    } catch {
      setErreurModal("Impossible de traiter cette image.");
    } finally {
      setUploadEnCours(false);
    }
  }

  async function sauvegarderProduit(e: React.FormEvent) {
    e.preventDefault();
    setErreurModal(null);

    const prix = Number(form.prix.replace(/[^\d]/g, ""));
    if (!form.nom.trim()) {
      setErreurModal("Le nom du produit est requis.");
      return;
    }
    if (!Number.isFinite(prix) || prix <= 0) {
      setErreurModal("Indique un prix valide en FCFA.");
      return;
    }

    if (modificationPayante) {
      const ok = window.confirm(
        `Cette modification décomptera 1 crédit (reste ${client.creditsRestants}). Continuer ?`
      );
      if (!ok) return;
    }

    setSauvegardeEnCours(true);
    try {
      const corps = {
        catalogueId: catalogue.id,
        nom: form.nom.trim(),
        prix,
        description: form.description.trim(),
        photoUrl: form.photoUrl,
        photoPublicId: form.photoPublicId,
      };
      const res = await fetch(
        form.id ? `/api/produits/${form.id}` : "/api/produits",
        {
          method: form.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(corps),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErreurModal(data.error || "Enregistrement impossible");
        return;
      }
      setModalOuvert(false);
      rafraichirApercu();
      router.refresh();
    } catch {
      setErreurModal("Connexion impossible.");
    } finally {
      setSauvegardeEnCours(false);
    }
  }

  async function supprimerProduit(p: ProduitVue) {
    const message = modificationPayante
      ? `Supprimer « ${p.nom} » ? Cette modification décomptera 1 crédit (reste ${client.creditsRestants}).`
      : `Supprimer « ${p.nom} » ?`;
    if (!window.confirm(message)) return;

    setErreur(null);
    const res = await fetch(`/api/produits/${p.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErreur(data.error || "Suppression impossible");
      return;
    }
    rafraichirApercu();
    router.refresh();
  }

  /** Réordonnancement (gratuit) : échange les champs `ordre` de deux produits. */
  async function deplacer(index: number, direction: -1 | 1) {
    const cible = index + direction;
    if (cible < 0 || cible >= produitsTries.length) return;
    const a = produitsTries[index];
    const b = produitsTries[cible];
    await Promise.all([
      fetch(`/api/produits/${a.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ordre: b.ordre === a.ordre ? b.ordre + direction : b.ordre }),
      }),
      fetch(`/api/produits/${b.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ordre: a.ordre }),
      }),
    ]);
    rafraichirApercu();
    router.refresh();
  }

  /** Mode rafale : sélection multiple → upload en série → liste nom + prix. */
  async function choisirPhotosRafale(e: React.ChangeEvent<HTMLInputElement>) {
    const fichiers = Array.from(e.target.files || []);
    e.target.value = "";
    if (fichiers.length === 0) return;

    const retenus = fichiers.slice(0, placesRestantes);
    if (fichiers.length > placesRestantes) {
      setErreurRafale(
        `Limite du forfait : seules les ${placesRestantes} premières photos ont été retenues.`
      );
    } else {
      setErreurRafale(null);
    }

    setRafaleUpload({ fait: 0, total: retenus.length });
    const lignes: LigneRafale[] = [];
    for (let i = 0; i < retenus.length; i++) {
      try {
        const image = await compresserImage(retenus[i]);
        const res = await fetch("/api/upload-photo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image, catalogueId: catalogue.id }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          lignes.push({
            apercu: data.apercu || data.url,
            photoUrl: data.url,
            photoPublicId: data.publicId,
            nom: "",
            prix: "",
            description: "",
          });
        }
      } catch {
        // photo illisible : on passe à la suivante
      }
      setRafaleUpload({ fait: i + 1, total: retenus.length });
    }
    setRafaleLignes((prev) => [...prev, ...lignes]);
    setRafaleUpload(null);
  }

  function majLigneRafale(
    index: number,
    champ: "nom" | "prix" | "description",
    valeur: string
  ) {
    setRafaleLignes((prev) =>
      prev.map((l, i) => (i === index ? { ...l, [champ]: valeur } : l))
    );
  }

  function retirerLigneRafale(index: number) {
    setRafaleLignes((prev) => prev.filter((_, i) => i !== index));
  }

  async function enregistrerRafale() {
    setErreurRafale(null);
    const completes = rafaleLignes.filter(
      (l) => l.nom.trim() && Number(l.prix.replace(/[^\d]/g, "")) > 0
    );
    if (completes.length === 0) {
      setErreurRafale("Remplis au moins un produit (nom + prix).");
      return;
    }
    if (completes.length < rafaleLignes.length) {
      const ok = window.confirm(
        `${rafaleLignes.length - completes.length} photo(s) sans nom ou prix seront ignorées. Continuer ?`
      );
      if (!ok) return;
    }
    if (modificationPayante) {
      if (completes.length > client.creditsRestants) {
        setErreurRafale(
          `Crédits insuffisants : ${completes.length} produits = ${completes.length} crédits, il en reste ${client.creditsRestants}.`
        );
        return;
      }
      const ok = window.confirm(
        `Catalogue déjà livré : ces ${completes.length} ajouts décompteront ${completes.length} crédits. Continuer ?`
      );
      if (!ok) return;
    }

    setRafaleSauvegarde(true);
    try {
      for (const l of completes) {
        const res = await fetch("/api/produits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            catalogueId: catalogue.id,
            nom: l.nom.trim(),
            prix: Number(l.prix.replace(/[^\d]/g, "")),
            // Facultative : une chaîne vide est enregistrée comme « pas de description »
            description: l.description.trim(),
            photoUrl: l.photoUrl,
            photoPublicId: l.photoPublicId,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setErreurRafale(data.error || "Une création a échoué — vérifie la liste.");
          setRafaleSauvegarde(false);
          router.refresh();
          return;
        }
      }
      setRafaleLignes([]);
      setRafaleOuvert(false);
      rafraichirApercu();
      router.refresh();
    } finally {
      setRafaleSauvegarde(false);
    }
  }

  async function genererPdf() {
    setErreur(null);
    setGenerationEnCours(true);
    try {
      const res = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ catalogueId: catalogue.id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErreur(data.error || "La génération a échoué.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const lien = document.createElement("a");
      lien.href = url;
      lien.download = `${client.nomEntreprise.replace(/[<>:"/\\|?*]/g, "").trim() || "catalogue"}.pdf`;
      document.body.appendChild(lien);
      lien.click();
      lien.remove();
      URL.revokeObjectURL(url);
      rafraichirApercu();
      router.refresh();
    } catch {
      setErreur("Connexion impossible pendant la génération.");
    } finally {
      setGenerationEnCours(false);
    }
  }

  return (
    <div className="animate-fade-up space-y-5 pb-28">
      {/* Bandeau d'univers du forfait */}
      <div
        className="-mx-4 -mt-6 px-4 py-2 flex items-center justify-between text-xs font-bold tracking-widest uppercase"
        style={{ background: theme.bande, color: theme.texteBande }}
      >
        <span>Espace {client.forfaitLabel}</span>
        <span>{produits.length} / {client.produitsMax}</span>
      </div>

      {/* En-tête */}
      <div>
        <Link href={`/clients/${client.id}`} className="text-xs opacity-60 hover:opacity-100">
          ← {client.nomEntreprise}
        </Link>
        <div className="flex items-start justify-between gap-3 mt-1">
          <h1 className="display text-3xl">{catalogue.titre}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <span className="badge badge-or">{client.forfaitLabel}</span>
          <span className="badge badge-vert">
            {produits.length} / {client.produitsMax} produits
          </span>
          {modificationPayante && (
            <span className="badge badge-vert">
              {client.creditsRestants} crédit{client.creditsRestants > 1 ? "s" : ""} restant{client.creditsRestants > 1 ? "s" : ""}
            </span>
          )}
          {catalogue.photosExpirees && (
            <span className="badge badge-rouge">Photos expirées</span>
          )}
        </div>
      </div>

      {/* Avertissements */}
      {modificationPayante && (
        <div className="card p-4 text-sm bg-[rgba(196,149,106,0.12)]">
          Ce catalogue a déjà été livré : chaque ajout, modification ou suppression
          de produit décompte <strong>1 crédit</strong>.
          {client.creditsExpires && (
            <span className="text-[var(--color-erreur)]">
              {" "}Crédits expirés — renouvellement nécessaire avant modification.
            </span>
          )}
        </div>
      )}
      {catalogue.photosExpirees && (
        <div className="card p-4 text-sm bg-[rgba(224,101,79,0.08)] text-[var(--color-erreur)]">
          Les photos de ce catalogue ont été supprimées (rétention 7 jours après
          génération). Pour le modifier avec images, redemande les photos au client.
        </div>
      )}
      {erreur && (
        <div className="card p-4 text-sm text-[var(--color-erreur)]">{erreur}</div>
      )}

      {/* Espace de travail : édition à gauche, aperçu à droite (grand écran) */}
      <div className="space-y-5 xl:space-y-0 xl:grid xl:grid-cols-2 xl:gap-6 xl:items-start xl:-mx-52 2xl:-mx-80">
      <div className="space-y-5">

      {/* Couleurs des couvertures (1re et 4e de couverture) — tous forfaits */}
      <CouleursCouverture
        catalogueId={catalogue.id}
        initiales={catalogue.couleurs}
        accent={theme.accent}
        onEnregistre={() => {
          rafraichirApercu();
          router.refresh();
        }}
      />

      {/* Liste des produits */}
      <section className="space-y-3">
        {produitsTries.length === 0 && (
          <div className="card p-8 text-center opacity-60 text-sm">
            Aucun produit pour l&apos;instant. Ajoute le premier produit du catalogue.
          </div>
        )}
        {produitsTries.map((p, i) => (
          <div key={p.id} className="card p-3 flex items-center gap-3">
            {p.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.photoUrl}
                alt=""
                className="w-16 h-16 rounded-xl object-cover bg-[rgba(231,225,211,0.06)] shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-[rgba(231,225,211,0.06)] flex items-center justify-center text-xl opacity-40 shrink-0">
                ✦
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-sm truncate">{p.nom}</div>
              <div className="text-[var(--color-or)] font-bold text-sm">
                {formatFCFA(p.prix)}
              </div>
              {p.description && (
                <div className="text-xs opacity-60 truncate">{p.description}</div>
              )}
            </div>
            <div className="flex flex-col gap-1 shrink-0">
              <div className="flex gap-1">
                <button
                  onClick={() => deplacer(i, -1)}
                  disabled={i === 0}
                  className="w-8 h-8 rounded-lg border border-[rgba(231,225,211,0.15)] text-xs disabled:opacity-20"
                  title="Monter"
                >
                  ↑
                </button>
                <button
                  onClick={() => deplacer(i, 1)}
                  disabled={i === produitsTries.length - 1}
                  className="w-8 h-8 rounded-lg border border-[rgba(231,225,211,0.15)] text-xs disabled:opacity-20"
                  title="Descendre"
                >
                  ↓
                </button>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => ouvrirEdition(p)}
                  className="w-8 h-8 rounded-lg border border-[rgba(231,225,211,0.15)] text-xs"
                  title="Modifier"
                >
                  ✎
                </button>
                <button
                  onClick={() => supprimerProduit(p)}
                  className="w-8 h-8 rounded-lg border border-[rgba(224,101,79,0.3)] text-[var(--color-erreur)] text-xs"
                  title="Supprimer"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        ))}

        {!limiteAtteinte ? (
          <div className="flex flex-col sm:flex-row gap-2">
            <button onClick={ouvrirAjout} className="btn-secondary flex-1">
              + Ajouter un produit
            </button>
            <button
              onClick={() => setRafaleOuvert(true)}
              className="btn-primary flex-1"
              style={{ background: theme.accent }}
            >
              ⚡ Ajout rapide (plusieurs photos)
            </button>
          </div>
        ) : (
          <div className="btn-secondary w-full opacity-60 pointer-events-none">
            Limite du forfait atteinte ({client.produitsMax} produits)
          </div>
        )}
      </section>
      </div>

      {/* Aperçu du catalogue — panneau de l'espace de travail */}
      <aside className="xl:sticky xl:top-20">
        <ApercuCatalogue
          catalogueId={catalogue.id}
          version={versionApercu}
          accent={theme.accent}
        />
      </aside>
      </div>

      {/* Barre de génération */}
      <div className="fixed bottom-0 left-0 right-0 bg-[var(--color-ivoire)]/95 backdrop-blur border-t border-[rgba(231,225,211,0.1)] p-4">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={genererPdf}
            disabled={generationEnCours || produits.length === 0}
            className="btn-primary w-full"
          >
            {generationEnCours
              ? "Génération du PDF en cours… (jusqu'à 1 min)"
              : `Générer le catalogue PDF — ${client.nomEntreprise}.pdf`}
          </button>
        </div>
      </div>

      {/* Modal rafale */}
      {rafaleOuvert && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-6"
          onClick={() => !rafaleSauvegarde && !rafaleUpload && setRafaleOuvert(false)}
        >
          <div
            className="bg-[var(--color-ivoire)] w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-5 max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="display text-2xl">Ajout rapide</h2>
            <p className="text-xs opacity-60 mt-1 mb-4">
              Sélectionne toutes les photos d&apos;un coup (depuis WhatsApp/galerie),
              puis complète nom et prix pour chacune. La description est
              facultative — tu peux la laisser vide et l&apos;ajouter plus tard.
            </p>

            <label className="btn-secondary w-full cursor-pointer mb-4">
              {rafaleUpload
                ? `Envoi des photos… ${rafaleUpload.fait}/${rafaleUpload.total}`
                : rafaleLignes.length > 0
                  ? "+ Ajouter d'autres photos"
                  : `Choisir les photos (max ${placesRestantes})`}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={choisirPhotosRafale}
                disabled={!!rafaleUpload || rafaleSauvegarde}
              />
            </label>

            {rafaleLignes.length > 0 && (
              <div className="space-y-3">
                {rafaleLignes.map((l, i) => (
                  <div key={l.photoPublicId} className="card p-2.5 flex items-center gap-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={l.apercu}
                      alt=""
                      className="w-14 h-14 rounded-lg object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <input
                        className="field !py-2 !text-sm"
                        placeholder={`Nom du produit ${i + 1}`}
                        value={l.nom}
                        onChange={(e) => majLigneRafale(i, "nom", e.target.value)}
                        maxLength={80}
                      />
                      <input
                        className="field !py-2 !text-sm"
                        placeholder="Prix (FCFA)"
                        inputMode="numeric"
                        value={l.prix}
                        onChange={(e) => majLigneRafale(i, "prix", e.target.value)}
                      />
                      <textarea
                        className="field !py-2 !text-sm min-h-14"
                        placeholder="Description (facultatif)"
                        value={l.description}
                        onChange={(e) => majLigneRafale(i, "description", e.target.value)}
                        maxLength={220}
                      />
                    </div>
                    <button
                      onClick={() => retirerLigneRafale(i)}
                      className="w-8 h-8 rounded-lg border border-[rgba(224,101,79,0.3)] text-[var(--color-erreur)] text-xs shrink-0"
                      title="Retirer"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {erreurRafale && (
              <p className="text-sm text-[var(--color-erreur)] mt-3">{erreurRafale}</p>
            )}

            <div className="flex gap-2 pt-4">
              <button
                type="button"
                className="btn-secondary flex-1"
                onClick={() => setRafaleOuvert(false)}
                disabled={rafaleSauvegarde || !!rafaleUpload}
              >
                Fermer
              </button>
              <button
                type="button"
                className="btn-primary flex-1"
                style={{ background: theme.accent }}
                onClick={enregistrerRafale}
                disabled={rafaleSauvegarde || !!rafaleUpload || rafaleLignes.length === 0}
              >
                {rafaleSauvegarde
                  ? "Enregistrement…"
                  : `Enregistrer ${rafaleLignes.length} produit${rafaleLignes.length > 1 ? "s" : ""}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal produit */}
      {modalOuvert && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-6"
          onClick={() => !sauvegardeEnCours && setModalOuvert(false)}
        >
          <div
            className="bg-[var(--color-ivoire)] w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="display text-2xl mb-4">
              {form.id ? "Modifier le produit" : "Nouveau produit"}
            </h2>

            <form onSubmit={sauvegarderProduit} className="space-y-4">
              {/* Photo */}
              <div>
                <span className="text-sm font-medium">Photo du produit</span>
                <label className="mt-2 block cursor-pointer">
                  {form.apercu ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.apercu}
                      alt=""
                      className="w-full h-48 object-cover rounded-2xl bg-[rgba(231,225,211,0.06)]"
                    />
                  ) : (
                    <div className="w-full h-32 rounded-2xl border-2 border-dashed border-[rgba(231,225,211,0.2)] flex flex-col items-center justify-center text-sm opacity-60">
                      {uploadEnCours ? "Envoi en cours…" : "Toucher pour choisir une photo"}
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={choisirPhoto}
                    disabled={uploadEnCours}
                  />
                </label>
                {form.apercu && (
                  <p className="text-xs opacity-50 mt-1">
                    Toucher l&apos;image pour la remplacer. Recadrage intelligent
                    automatique dans le PDF.
                  </p>
                )}
              </div>

              <label className="block">
                <span className="text-sm font-medium">Nom du produit *</span>
                <input
                  className="field mt-2"
                  value={form.nom}
                  onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                  placeholder="Ex : Robe wax taille M"
                  maxLength={80}
                  required
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium">Prix (FCFA) *</span>
                <input
                  className="field mt-2"
                  value={form.prix}
                  onChange={(e) => setForm((f) => ({ ...f, prix: e.target.value }))}
                  placeholder="Ex : 12000"
                  inputMode="numeric"
                  required
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium">
                  Description courte{" "}
                  <span className="opacity-50 font-normal">(facultatif)</span>
                </span>
                <textarea
                  className="field mt-2 min-h-20"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Matière, tailles disponibles, points forts…"
                  maxLength={220}
                />
              </label>

              {erreurModal && (
                <p className="text-sm text-[var(--color-erreur)]">{erreurModal}</p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  className="btn-secondary flex-1"
                  onClick={() => setModalOuvert(false)}
                  disabled={sauvegardeEnCours}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={sauvegardeEnCours || uploadEnCours}
                >
                  {sauvegardeEnCours ? "…" : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
