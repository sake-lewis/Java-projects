"use client"

import React from "react"
import { StyleDef } from "@/lib/styles/catalog"
import { motifInner } from "@/lib/styles/motifs"

/**
 * Aperçu d'un style : mini-couverture d'album pilotée par la palette.
 * Un seul composant pour les 20 styles — le motif varie par thème,
 * les couleurs et l'esprit viennent de la palette du catalogue.
 */
export default function StylePreview({ style }: { style: StyleDef }) {
  const { bg, surface, accent, encre } = style.palette
  const motifSvg = motifInner(style.motif)

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

      {/* Motif réel du style, posé en filigrane comme sur les cadres photo */}
      {motifSvg && (
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
          className="pointer-events-none absolute inset-[7px] opacity-70"
          style={{ color: accent }}
          dangerouslySetInnerHTML={{ __html: motifSvg }}
        />
      )}

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
