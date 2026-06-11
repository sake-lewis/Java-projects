"use client"

import React from "react"
import { StyleDef, Theme } from "@/lib/styles/catalog"

/**
 * Aperçu d'un style : mini-couverture d'album pilotée par la palette.
 * Un seul composant pour les 20 styles — le motif varie par thème,
 * les couleurs et l'esprit viennent de la palette du catalogue.
 */
export default function StylePreview({ style }: { style: StyleDef }) {
  const { bg, surface, accent, encre } = style.palette

  return (
    <div
      className="relative aspect-[3/4] w-full overflow-hidden"
      style={{ background: bg }}
      aria-hidden="true"
    >
      {/* Voile de surface en pied de page */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/3"
        style={{
          background: `linear-gradient(180deg, transparent, ${surface})`,
        }}
      />

      {/* Double cadre fin */}
      <div
        className="absolute inset-[7px] border"
        style={{ borderColor: accent, opacity: 0.55 }}
      />
      <div
        className="absolute inset-[11px] border"
        style={{ borderColor: accent, opacity: 0.3 }}
      />

      {/* Motif du thème */}
      <div className="absolute inset-x-0 top-[16%] flex justify-center">
        <MotifTheme theme={style.theme} accent={accent} />
      </div>

      {/* Titre — la typographie du style */}
      <div className="absolute inset-x-0 top-[44%] px-4 text-center">
        <div
          className="text-[15px] leading-tight"
          style={{ color: encre, fontFamily: style.fontDisplay }}
        >
          {style.label}
        </div>
        <div
          className="mx-auto mt-2 h-px w-10"
          style={{
            background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
          }}
        />
      </div>

      {/* Pastilles de palette */}
      <div className="absolute inset-x-0 bottom-[10%] flex justify-center gap-1.5">
        {[surface, accent, encre].map((c, i) => (
          <span
            key={i}
            className="h-2 w-2 rounded-full"
            style={{ background: c, boxShadow: `0 0 0 1px ${bg}` }}
          />
        ))}
      </div>
    </div>
  )
}

/** Glyphe signature par thème, en trait fin couleur accent. */
function MotifTheme({ theme, accent }: { theme: Theme; accent: string }) {
  const common = {
    width: 64,
    height: 28,
    viewBox: "0 0 64 28",
    fill: "none",
    stroke: accent,
    strokeWidth: 1.1,
    strokeLinecap: "round" as const,
  }

  switch (theme) {
    case "nature":
      // Branche feuillée
      return (
        <svg {...common}>
          <path d="M6 22 Q 32 6 58 22" />
          <path d="M20 16 q -3 -6 2 -9 q 4 4 -2 9" fill={accent} opacity="0.7" stroke="none" />
          <path d="M32 13 q -3 -6 2 -9 q 4 4 -2 9" fill={accent} opacity="0.85" stroke="none" />
          <path d="M44 16 q -3 -6 2 -9 q 4 4 -2 9" fill={accent} opacity="0.7" stroke="none" />
        </svg>
      )
    case "elegance":
      // Filet Art déco + diamant
      return (
        <svg {...common}>
          <line x1="4" y1="14" x2="24" y2="14" />
          <line x1="40" y1="14" x2="60" y2="14" />
          <path d="M32 6 L 40 14 L 32 22 L 24 14 Z" />
          <path d="M32 10 L 36 14 L 32 18 L 28 14 Z" opacity="0.6" />
        </svg>
      )
    case "vif":
      // Confettis
      return (
        <svg {...common}>
          <circle cx="12" cy="14" r="2.4" fill={accent} stroke="none" />
          <circle cx="24" cy="8" r="1.6" fill={accent} opacity="0.7" stroke="none" />
          <circle cx="32" cy="18" r="3" fill={accent} stroke="none" />
          <circle cx="42" cy="7" r="1.8" fill={accent} opacity="0.7" stroke="none" />
          <circle cx="52" cy="14" r="2.4" fill={accent} stroke="none" />
        </svg>
      )
    case "moderne":
      // Ligne + cercle minimal
      return (
        <svg {...common}>
          <line x1="8" y1="14" x2="56" y2="14" />
          <circle cx="32" cy="14" r="6" />
        </svg>
      )
    case "heritage":
      // Frise de losanges tissés
      return (
        <svg {...common}>
          <path d="M12 14 L 18 8 L 24 14 L 18 20 Z" />
          <path d="M26 14 L 32 8 L 38 14 L 32 20 Z" />
          <path d="M40 14 L 46 8 L 52 14 L 46 20 Z" />
        </svg>
      )
  }
}
