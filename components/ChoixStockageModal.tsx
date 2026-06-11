"use client"

import React, { useState } from "react"

interface ChoixStockageModalProps {
  isOpen: boolean
  pdfUrl: string
  nomCatalogue: string
  onClose: () => void
}

/**
 * Avant le téléchargement : l'utilisateur désigne l'emplacement de son
 * catalogue, et le fichier y est réellement enregistré — quel que soit
 * l'appareil. Cascade selon les capacités :
 *
 * 1. Desktop (Chrome/Edge) : sélecteur d'emplacement natif
 *    (showSaveFilePicker) → écriture directe dans le dossier choisi.
 * 2. iOS / Android : feuille de partage système avec le FICHIER PDF
 *    (navigator.share + files) → « Enregistrer dans Fichiers », Google
 *    Drive, etc. avec choix du dossier de destination.
 * 3. Sinon : téléchargement classique dans le dossier Téléchargements.
 */
export default function ChoixStockageModal({ isOpen, pdfUrl, nomCatalogue, onClose }: ChoixStockageModalProps) {
  const [enCours, setEnCours] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  if (!isOpen) return null

  const nomFichier = `${(nomCatalogue || "catalogue").replace(/[\\/:*?"<>|]/g, "")}.pdf`

  async function recupererFichier(): Promise<File> {
    const res = await fetch(pdfUrl)
    if (!res.ok) throw new Error("téléchargement")
    const blob = await res.blob()
    return new File([blob], nomFichier, { type: "application/pdf" })
  }

  function telechargerDirect() {
    const a = document.createElement("a")
    a.href = pdfUrl
    a.download = nomFichier
    a.rel = "noopener noreferrer"
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  async function enregistrerALEmplacement() {
    setEnCours(true)
    setMessage(null)
    try {
      // 1. Desktop : vrai sélecteur de dossier, écriture sur place.
      if ("showSaveFilePicker" in window) {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: nomFichier,
          types: [{ description: "Document PDF", accept: { "application/pdf": [".pdf"] } }],
        })
        const fichier = await recupererFichier()
        const writable = await handle.createWritable()
        await writable.write(fichier)
        await writable.close()
        setMessage("Catalogue enregistré à l'emplacement choisi ✓")
        return
      }

      // 2. iOS / Android : on partage le FICHIER lui-même — le système
      //    propose « Enregistrer dans Fichiers », Drive, etc. avec choix
      //    du dossier de destination.
      const fichier = await recupererFichier()
      if (typeof navigator.canShare === "function" && navigator.canShare({ files: [fichier] })) {
        await navigator.share({ files: [fichier], title: nomFichier })
        setMessage("Catalogue remis à l'application choisie ✓")
        return
      }

      // 3. Dernier recours : Téléchargements de l'appareil.
      telechargerDirect()
      setMessage("Cet appareil ne permet pas de choisir le dossier : catalogue enregistré dans Téléchargements.")
    } catch (e: any) {
      // L'utilisateur a refermé le sélecteur ou la feuille de partage : pas une erreur.
      if (e?.name !== "AbortError") {
        setMessage("Enregistrement impossible — utilisez le téléchargement direct ci-dessous.")
      }
    } finally {
      setEnCours(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-vert/40 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="animate-fade-up w-full max-w-sm rounded-t-2xl bg-ivoire p-6 shadow-2xl sm:rounded-2xl"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-label="Où conserver votre catalogue"
      >
        <h3 className="display text-center text-[22px] text-vert">
          Où conserver votre catalogue ?
        </h3>
        <p className="mt-1 text-center text-[12px] text-vert/50">
          « {nomFichier} » — aussi disponible 7 jours en ligne.
        </p>

        <div className="mt-6 space-y-3">
          <button
            onClick={enregistrerALEmplacement}
            disabled={enCours}
            className="btn-primary focus-ring w-full text-[15px]"
          >
            {enCours ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-ivoire/40 border-t-ivoire" />
                Préparation…
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
                Choisir l&apos;emplacement
              </>
            )}
          </button>

          <button
            onClick={() => {
              telechargerDirect()
              setMessage("Catalogue envoyé dans Téléchargements ✓")
            }}
            disabled={enCours}
            className="card focus-ring flex w-full items-center justify-center gap-2 !rounded-xl px-4 py-3 text-[14px] font-semibold text-vert transition-all hover:border-vert hover:shadow-md disabled:opacity-50"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Téléchargements de l&apos;appareil
          </button>
        </div>

        {message && (
          <p className="mt-4 text-center text-[13px] font-medium text-vert">{message}</p>
        )}

        <button onClick={onClose} className="btn-secondary mt-5 w-full !py-3 text-[14px]">
          Fermer
        </button>
      </div>
    </div>
  )
}
