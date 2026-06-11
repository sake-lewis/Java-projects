"use client"

import React, { useState } from "react"
import { Forfait, StyleId, FORFAIT_CONFIG } from "@/types"
import { STYLES, Occasion, styleAccessible, styleVerrouillePour } from "@/lib/styles/catalog"
import StylePreview from "./StylePreview"

interface StyleSelectorProps {
  forfait: Forfait
  selectedStyle: StyleId
  onSelect: (style: StyleId) => void
}

// Regroupement par occasion : on présente 5 lignes (une par occasion),
// chacune avec ses 2 variations côte à côte. Le client comprend immédiatement
// la grille de choix et voit ce qui lui manque s'il prend un forfait moins riche.
const OCCASIONS: Occasion[] = ["mariage", "enfance", "deuil", "anniversaire", "solennel"]

const OCCASION_LIBELLE: Record<Occasion, string> = {
  mariage: "Mariage",
  enfance: "Enfance",
  deuil: "Deuil",
  anniversaire: "Anniversaire",
  solennel: "Solennel",
}

export default function StyleSelector({ forfait, selectedStyle, onSelect }: StyleSelectorProps) {
  const [styleVerrouilleClique, setStyleVerrouilleClique] = useState<StyleId | null>(null)

  // Pour chaque occasion, on retrouve les 2 styles (classique + contemporain).
  const styleParOccasion: Record<Occasion, { classique: StyleId; contemporain: StyleId }> = {
    mariage: { classique: 1, contemporain: 2 },
    enfance: { classique: 3, contemporain: 4 },
    deuil: { classique: 5, contemporain: 6 },
    anniversaire: { classique: 7, contemporain: 8 },
    solennel: { classique: 9, contemporain: 10 },
  }

  function handleClick(id: StyleId) {
    if (styleAccessible(id, forfait)) {
      onSelect(id)
      setStyleVerrouilleClique(null)
    } else {
      // Toggle de la révélation de la mention upgrade au clic.
      setStyleVerrouilleClique(prev => (prev === id ? null : id))
    }
  }

  return (
    <div className="space-y-6">
      {OCCASIONS.map(occ => {
        const { classique, contemporain } = styleParOccasion[occ]
        return (
          <div key={occ} className="space-y-2.5">
            <div className="flex items-baseline gap-2">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#1E4D3A]/60">
                {OCCASION_LIBELLE[occ]}
              </h3>
              <div className="h-px flex-1 bg-[#1E4D3A]/10" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <StyleCard
                styleId={classique}
                forfait={forfait}
                isSelected={selectedStyle === classique}
                revealUpgrade={styleVerrouilleClique === classique}
                onClick={() => handleClick(classique)}
              />
              <StyleCard
                styleId={contemporain}
                forfait={forfait}
                isSelected={selectedStyle === contemporain}
                revealUpgrade={styleVerrouilleClique === contemporain}
                onClick={() => handleClick(contemporain)}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function StyleCard({
  styleId,
  forfait,
  isSelected,
  revealUpgrade,
  onClick,
}: {
  styleId: StyleId
  forfait: Forfait
  isSelected: boolean
  revealUpgrade: boolean
  onClick: () => void
}) {
  const style = STYLES[styleId]
  const accessible = styleAccessible(styleId, forfait)
  const forfaitRequis = styleVerrouillePour(styleId)

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isSelected}
      aria-disabled={!accessible}
      className={`group relative overflow-hidden rounded-xl text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E4D3A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#E8E0D5] ${
        isSelected
          ? "ring-2 ring-[#1E4D3A] ring-offset-2 ring-offset-[#E8E0D5] shadow-[0_4px_12px_rgba(30,77,58,0.15)]"
          : accessible
          ? "ring-1 ring-[#1E4D3A]/12 hover:ring-[#1E4D3A]/35 hover:shadow-[0_2px_6px_rgba(30,77,58,0.08)]"
          : "ring-1 ring-[#1E4D3A]/8 cursor-pointer"
      }`}
    >
      {/* Aperçu visuel — désaturé/grisé si non débloqué */}
      <div
        className={`transition-all ${
          accessible ? "" : "grayscale-[0.7] brightness-[0.92] opacity-65"
        }`}
      >
        <StylePreview style={style} />
      </div>

      {/* Pastille de sélection */}
      {isSelected && (
        <span className="absolute right-2 top-2 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-[#1E4D3A] text-[#E8E0D5] shadow-md">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
      )}

      {/* Badge verrou (non débloqué) */}
      {!accessible && (
        <span className="absolute left-2 top-2 z-20 flex items-center gap-1 rounded-full bg-[#1E4D3A]/85 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-[#E8E0D5] backdrop-blur-sm">
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          {forfaitRequis === "pro" ? "Pro" : "Premium"}
        </span>
      )}

      {/* Mention upgrade révélée au clic d'un style verrouillé */}
      {!accessible && revealUpgrade && (
        <div className="absolute inset-x-0 bottom-0 z-20 animate-in fade-in slide-in-from-bottom-1 bg-gradient-to-t from-[#1E4D3A] via-[#1E4D3A]/95 to-[#1E4D3A]/0 px-3 pt-6 pb-2 text-center">
          <p className="text-[10px] font-medium leading-tight text-[#E8E0D5]">
            Disponible en forfait{" "}
            <strong className="font-semibold text-[#C4956A]">
              {forfaitRequis === "pro" ? "Pro" : "Premium"}
            </strong>
          </p>
        </div>
      )}

      {/* Mini-légende sous l'aperçu */}
      <div className="border-t border-[#1E4D3A]/8 bg-white px-3 py-2">
        <div className="flex items-baseline justify-between gap-2">
          <div className="text-[12px] font-semibold leading-tight text-[#1E4D3A]">
            {style.label}
          </div>
          <div className="text-[9px] font-medium uppercase tracking-[0.14em] text-[#1E4D3A]/45">
            {style.variation === "classique" ? "Classique" : "Contemp."}
          </div>
        </div>
      </div>
    </button>
  )
}
