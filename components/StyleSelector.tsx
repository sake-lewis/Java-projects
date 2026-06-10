"use client"

import React from 'react'

interface StyleSelectorProps {
  forfait: "standard" | "pro" | "premium"
  selectedStyle: 1 | 2 | 3 | 4 | 5
  onSelect: (style: 1 | 2 | 3 | 4 | 5) => void
}

const themes: Record<number, { label: string; image: string; description: string }> = {
  1: { label: "Enfance", image: "/themes/enfance.png", description: "Naissance & croissance" },
  2: { label: "Mariage", image: "/themes/mariage.png", description: "Union & cérémonie" },
  3: { label: "Deuil", image: "/themes/deuil.png", description: "Hommage & souvenir" },
  4: { label: "Anniversaire", image: "/themes/anniversaire.png", description: "Célébration & joie" },
  5: { label: "Solennel", image: "/themes/solennel.png", description: "Diplôme & fêtes solennelles" },
}

export default function StyleSelector({ selectedStyle, onSelect }: StyleSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
      {(Object.entries(themes) as unknown as [string, typeof themes[1]][]).map(([id, theme]) => {
        const styleId = parseInt(id) as 1 | 2 | 3 | 4 | 5
        const isSelected = selectedStyle === styleId

        return (
          <button
            key={styleId}
            type="button"
            onClick={() => onSelect(styleId)}
            aria-pressed={isSelected}
            className={`group relative overflow-hidden rounded-xl text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E4D3A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#E8E0D5] ${
              isSelected
                ? 'ring-2 ring-[#1E4D3A] ring-offset-2 ring-offset-[#E8E0D5]'
                : 'ring-1 ring-[#C4956A]/25 hover:ring-[#1E4D3A]/50'
            } ${styleId === 5 ? 'col-span-2 sm:col-span-1' : ''}`}
          >
            {/* Vignette photo du thème */}
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#1E4D3A]/5">
              <img
                src={theme.image}
                alt={`Thème ${theme.label}`}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {/* Voile dégradé pour lisibilité du libellé */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

              {/* Pastille de sélection */}
              {isSelected && (
                <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#1E4D3A] text-[#E8E0D5] shadow-md">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
              )}

              {/* Libellé du thème */}
              <div className="absolute inset-x-0 bottom-0 p-3">
                <div className="text-[15px] font-semibold leading-tight text-white">
                  {theme.label}
                </div>
                <div className="text-[11px] font-light text-white/80">
                  {theme.description}
                </div>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
