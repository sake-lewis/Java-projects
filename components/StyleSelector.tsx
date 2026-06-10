"use client"

import React from 'react'

interface StyleSelectorProps {
  forfait: "standard" | "pro" | "premium"
  selectedStyle: 1 | 2 | 3 | 4 | 5
  onSelect: (style: 1 | 2 | 3 | 4 | 5) => void
}

const themes: Record<number, { label: string; emoji: string; description: string }> = {
  1: { label: "Enfance", emoji: "🌱", description: "Naissance & croissance" },
  2: { label: "Mariage", emoji: "💍", description: "Union & cérémonie" },
  3: { label: "Deuil", emoji: "🕊️", description: "Hommage & souvenir" },
  4: { label: "Anniversaire", emoji: "✨", description: "Célébration & joie" },
  5: { label: "Solennel", emoji: "🎓", description: "Remise de diplôme & fêtes" }
}

const forfaitLabels = {
  standard: "Sobre & élégant",
  pro: "Impressionnant",
  premium: "Luxueux"
}

export default function StyleSelector({ forfait, selectedStyle, onSelect }: StyleSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
      {(Object.entries(themes) as unknown as [string, typeof themes[1]][]).map(([id, theme]) => {
        const styleId = parseInt(id) as 1 | 2 | 3 | 4 | 5
        const isSelected = selectedStyle === styleId
        
        return (
          <button
            key={styleId}
            onClick={() => onSelect(styleId)}
            className={`flex flex-col items-center gap-3 rounded-lg p-5 text-center transition-all duration-300 ${
              isSelected 
                ? 'bg-[#E8E0D5] border-2 border-[#1E4D3A] shadow-[0_4px_16px_rgba(30,77,58,0.15)] scale-[1.02]' 
                : 'bg-[#F5F0EA] border border-[#C4956A]/30 hover:border-[#1E4D3A] hover:scale-[1.02]'
            } ${styleId === 5 ? 'col-span-2 md:col-span-1 md:col-start-2' : ''}`}
          >
            <span className="text-4xl">{theme.emoji}</span>
            <div>
              <h3 
                className="text-lg font-semibold text-[#1E4D3A]"
                style={{ fontFamily: 'var(--font-cormorant), serif' }}
              >
                {theme.label}
              </h3>
              <p 
                className="mt-1 text-[13px] font-light text-[#1E4D3A]/70"
                style={{ fontFamily: 'var(--font-lato), sans-serif' }}
              >
                {theme.description}
              </p>
            </div>
            <div 
              className="mt-2 rounded-full bg-[#1E4D3A]/5 px-3 py-1 text-[10px] font-light uppercase tracking-widest text-[#1E4D3A]/60"
              style={{ fontFamily: 'var(--font-lato), sans-serif' }}
            >
              {forfaitLabels[forfait]}
            </div>
          </button>
        )
      })}
    </div>
  )
}
