"use client"

import React, { useState } from "react"
import { Forfait, StyleId } from "@/types"
import {
  THEMES,
  THEME_LABELS,
  StyleDef,
  stylesDuTheme,
  styleAccessible,
  styleVerrouillePour,
} from "@/lib/styles/catalog"
import StylePreview from "./StylePreview"

interface StyleSelectorProps {
  forfait: Forfait
  selectedStyle: StyleId
  onSelect: (style: StyleId) => void
}

/**
 * 5 thèmes × 4 styles. Tous les styles sont montrés, les non-débloqués sont
 * grisés avec badge Pro/Premium : le client voit ce qu'il n'a pas (envie
 * d'upgrade visible).
 */
export default function StyleSelector({ forfait, selectedStyle, onSelect }: StyleSelectorProps) {
  const [styleVerrouilleClique, setStyleVerrouilleClique] = useState<StyleId | null>(null)

  function handleClick(id: StyleId) {
    if (styleAccessible(id, forfait)) {
      onSelect(id)
      setStyleVerrouilleClique(null)
    } else {
      setStyleVerrouilleClique(prev => (prev === id ? null : id))
    }
  }

  return (
    <div className="space-y-8">
      {THEMES.map(theme => (
        <div key={theme} className="space-y-2.5">
          <div className="flex items-baseline gap-2">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-vert/60">
              {THEME_LABELS[theme]}
            </h3>
            <div className="hairline-or flex-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {stylesDuTheme(theme).map(style => (
              <StyleCard
                key={style.id}
                style={style}
                forfait={forfait}
                isSelected={selectedStyle === style.id}
                revealUpgrade={styleVerrouilleClique === style.id}
                onClick={() => handleClick(style.id)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function StyleCard({
  style,
  forfait,
  isSelected,
  revealUpgrade,
  onClick,
}: {
  style: StyleDef
  forfait: Forfait
  isSelected: boolean
  revealUpgrade: boolean
  onClick: () => void
}) {
  const accessible = styleAccessible(style.id, forfait)
  const forfaitRequis = styleVerrouillePour(style.id)

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isSelected}
      aria-disabled={!accessible}
      className={`group focus-ring relative overflow-hidden rounded-xl text-left transition-all duration-200 ${
        isSelected
          ? "ring-2 ring-vert ring-offset-2 ring-offset-ivoire shadow-[0_4px_12px_rgba(30,77,58,0.15)]"
          : accessible
          ? "ring-1 ring-vert/12 hover:ring-vert/35 hover:shadow-[0_2px_6px_rgba(30,77,58,0.08)]"
          : "ring-1 ring-vert/8 cursor-pointer"
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
        <span className="absolute right-2 top-2 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-vert text-ivoire shadow-md">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
      )}

      {/* Badge verrou (non débloqué) */}
      {!accessible && (
        <span className="absolute left-2 top-2 z-20 flex items-center gap-1 rounded-full bg-vert/85 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-ivoire backdrop-blur-sm">
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          {forfaitRequis === "pro" ? "Pro" : "Premium"}
        </span>
      )}

      {/* Mention upgrade révélée au clic d'un style verrouillé */}
      {!accessible && revealUpgrade && (
        <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-vert via-vert/95 to-vert/0 px-3 pb-2 pt-6 text-center">
          <p className="text-[10px] font-medium leading-tight text-ivoire">
            Disponible en forfait{" "}
            <strong className="font-semibold text-or">
              {forfaitRequis === "pro" ? "Pro" : "Premium"}
            </strong>
          </p>
        </div>
      )}

      {/* Mini-légende sous l'aperçu */}
      <div className="border-t border-vert/8 bg-white px-3 py-2">
        <div className="text-[12px] font-semibold leading-tight text-vert">
          {style.label}
        </div>
        <div className="mt-0.5 truncate text-[10px] text-vert/45">
          {style.description}
        </div>
      </div>
    </button>
  )
}
