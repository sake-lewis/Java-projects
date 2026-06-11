"use client"

import React from "react"
import { StyleDef } from "@/lib/styles/catalog"

interface Props {
  style: StyleDef
  className?: string
}

/**
 * Mini-aperçu visuel d'un style — palette + motif + typo dominante.
 *
 * Rendu en CSS/SVG inline, sans image bitmap : l'aperçu est représentatif du
 * style appliqué au PDF (pas une photo générique de l'occasion). C'est un
 * "moodboard" qui aide le client à reconnaître l'ambiance de son catalogue
 * avant génération.
 */
export default function StylePreview({ style, className = "" }: Props) {
  const { palette, motif, fontFamily, label, occasionLabel } = style
  const isFonce = motif === "lys" || motif === "sceau" || motif === "monogramme-foil"

  return (
    <div
      className={`relative aspect-[3/4] w-full overflow-hidden ${className}`}
      style={{
        background: `linear-gradient(160deg, ${palette.bg} 0%, ${palette.surface} 100%)`,
        color: palette.encre,
      }}
    >
      <MotifLayer motif={motif} palette={palette} />

      {/* Contenu textuel centré — calligraphie de l'occasion + mini-libellé */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-3 text-center">
        <div
          className="text-[9px] font-semibold uppercase tracking-[0.3em]"
          style={{ color: palette.accent, opacity: 0.95 }}
        >
          {occasionLabel}
        </div>

        <div
          className="mt-2 leading-none"
          style={{
            fontFamily,
            fontSize: motif === "monogramme-foil" || motif === "sceau" ? 28 : 32,
            background: `linear-gradient(135deg, ${palette.accent}, ${palette.encre})`,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            color: "transparent",
            fontWeight: 600,
          }}
        >
          {label}
        </div>

        <div
          className="mt-3 h-px w-8"
          style={{ background: palette.accent, opacity: 0.6 }}
        />

        <div
          className="mt-2 text-[8px] font-medium uppercase tracking-[0.18em]"
          style={{ color: isFonce ? palette.encre : palette.encre, opacity: 0.55 }}
        >
          Catalogue
        </div>
      </div>
    </div>
  )
}

/**
 * Couches décoratives par motif. Toutes dessinées en SVG inline pour rester
 * légères et théméables. Aucune ne contient de texte (déjà géré par le parent).
 */
function MotifLayer({
  motif,
  palette,
}: {
  motif: StyleDef["motif"]
  palette: StyleDef["palette"]
}) {
  switch (motif) {
    case "guirlande":
      return (
        <svg
          aria-hidden
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 120 160"
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Cadre or fin */}
          <rect x="6" y="6" width="108" height="148" fill="none" stroke={palette.accent} strokeWidth="0.5" opacity="0.6" />
          {/* Guirlande haute */}
          <path d="M 30 22 Q 60 14 90 22" fill="none" stroke={palette.accent} strokeWidth="0.6" opacity="0.7" />
          {[35, 45, 55, 65, 75, 85].map(x => (
            <circle key={`th-${x}`} cx={x} cy={18 + Math.sin(x * 0.5) * 1.5} r="1.4" fill={palette.accent} opacity="0.85" />
          ))}
          {/* Guirlande basse */}
          <path d="M 30 138 Q 60 146 90 138" fill="none" stroke={palette.accent} strokeWidth="0.6" opacity="0.7" />
          {[35, 45, 55, 65, 75, 85].map(x => (
            <circle key={`tb-${x}`} cx={x} cy={142 + Math.sin(x * 0.5) * 1.5} r="1.4" fill={palette.accent} opacity="0.85" />
          ))}
        </svg>
      )
    case "geometrique":
      return (
        <svg
          aria-hidden
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 120 160"
          preserveAspectRatio="xMidYMid slice"
        >
          <rect x="10" y="10" width="100" height="140" fill="none" stroke={palette.accent} strokeWidth="0.8" />
          <line x1="60" y1="10" x2="60" y2="40" stroke={palette.accent} strokeWidth="0.4" opacity="0.5" />
          <line x1="60" y1="120" x2="60" y2="150" stroke={palette.accent} strokeWidth="0.4" opacity="0.5" />
          <circle cx="60" cy="80" r="40" fill="none" stroke={palette.accent} strokeWidth="0.4" opacity="0.25" />
        </svg>
      )
    case "coeurs":
      return (
        <svg
          aria-hidden
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 120 160"
          preserveAspectRatio="xMidYMid slice"
        >
          {[
            [20, 30], [100, 32], [15, 130], [105, 128],
            [40, 18], [80, 18], [40, 142], [80, 142],
          ].map(([x, y], i) => (
            <path
              key={i}
              d={`M ${x} ${y} c -2 -2.5 -5 -1.5 -5 1 c 0 2 2 4 5 6 c 3 -2 5 -4 5 -6 c 0 -2.5 -3 -3.5 -5 -1`}
              fill={palette.accent}
              opacity={0.55}
            />
          ))}
        </svg>
      )
    case "aquarelle":
      return (
        <svg
          aria-hidden
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 120 160"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <radialGradient id="aq1">
              <stop offset="0%" stopColor={palette.accent} stopOpacity="0.6" />
              <stop offset="100%" stopColor={palette.accent} stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="25" cy="30" r="22" fill="url(#aq1)" />
          <circle cx="95" cy="40" r="18" fill="url(#aq1)" opacity="0.7" />
          <circle cx="30" cy="130" r="20" fill="url(#aq1)" opacity="0.5" />
          <circle cx="100" cy="125" r="24" fill="url(#aq1)" opacity="0.6" />
        </svg>
      )
    case "lys":
      return (
        <svg
          aria-hidden
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 120 160"
          preserveAspectRatio="xMidYMid slice"
        >
          <rect x="8" y="8" width="104" height="144" fill="none" stroke={palette.accent} strokeWidth="0.5" opacity="0.4" />
          {/* Lys central très épuré */}
          <g transform="translate(60 22)" fill="none" stroke={palette.accent} strokeWidth="0.7" opacity="0.7">
            <path d="M 0 0 C -6 -3 -10 2 -7 6 C -2 4 0 0 0 0 Z" />
            <path d="M 0 0 C 6 -3 10 2 7 6 C 2 4 0 0 0 0 Z" />
            <path d="M 0 0 C 0 -6 0 -10 0 -12" />
          </g>
          <g transform="translate(60 138) rotate(180)" fill="none" stroke={palette.accent} strokeWidth="0.7" opacity="0.7">
            <path d="M 0 0 C -6 -3 -10 2 -7 6 C -2 4 0 0 0 0 Z" />
            <path d="M 0 0 C 6 -3 10 2 7 6 C 2 4 0 0 0 0 Z" />
          </g>
        </svg>
      )
    case "sepia":
      return (
        <svg
          aria-hidden
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 120 160"
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Cadres polaroïd décalés */}
          <g opacity="0.45">
            <rect x="18" y="20" width="36" height="44" fill={palette.bg} stroke={palette.accent} strokeWidth="0.4" transform="rotate(-6 36 42)" />
            <rect x="66" y="28" width="36" height="44" fill={palette.bg} stroke={palette.accent} strokeWidth="0.4" transform="rotate(4 84 50)" />
            <rect x="22" y="98" width="36" height="44" fill={palette.bg} stroke={palette.accent} strokeWidth="0.4" transform="rotate(5 40 120)" />
            <rect x="66" y="102" width="36" height="44" fill={palette.bg} stroke={palette.accent} strokeWidth="0.4" transform="rotate(-4 84 124)" />
          </g>
        </svg>
      )
    case "bokeh":
      return (
        <svg
          aria-hidden
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 120 160"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <radialGradient id="b1">
              <stop offset="0%" stopColor={palette.accent} stopOpacity="0.6" />
              <stop offset="60%" stopColor={palette.accent} stopOpacity="0.15" />
              <stop offset="100%" stopColor={palette.accent} stopOpacity="0" />
            </radialGradient>
          </defs>
          {[
            [20, 24, 10], [95, 30, 7], [40, 50, 5], [102, 70, 12],
            [15, 90, 8], [55, 110, 6], [88, 120, 10], [25, 140, 7],
          ].map(([cx, cy, r], i) => (
            <circle key={i} cx={cx} cy={cy} r={r} fill="url(#b1)" />
          ))}
        </svg>
      )
    case "ruban":
      return (
        <svg
          aria-hidden
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 120 160"
          preserveAspectRatio="xMidYMid slice"
        >
          <rect x="6" y="6" width="108" height="148" fill="none" stroke={palette.accent} strokeWidth="0.4" opacity="0.5" />
          {/* Ruban diagonal */}
          <g opacity="0.65">
            <path d="M 0 70 L 120 50 L 120 64 L 0 84 Z" fill={palette.accent} opacity="0.4" />
            <path d="M 0 90 L 120 70 L 120 78 L 0 98 Z" fill={palette.accent} opacity="0.25" />
          </g>
        </svg>
      )
    case "sceau":
      return (
        <svg
          aria-hidden
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 120 160"
          preserveAspectRatio="xMidYMid slice"
        >
          <rect x="6" y="6" width="108" height="148" fill="none" stroke={palette.accent} strokeWidth="0.5" opacity="0.4" />
          <circle cx="60" cy="22" r="9" fill="none" stroke={palette.accent} strokeWidth="0.6" opacity="0.7" />
          <circle cx="60" cy="22" r="6" fill="none" stroke={palette.accent} strokeWidth="0.4" opacity="0.5" />
          <circle cx="60" cy="138" r="9" fill="none" stroke={palette.accent} strokeWidth="0.6" opacity="0.7" />
          <circle cx="60" cy="138" r="6" fill="none" stroke={palette.accent} strokeWidth="0.4" opacity="0.5" />
          <line x1="20" y1="80" x2="100" y2="80" stroke={palette.accent} strokeWidth="0.3" opacity="0.3" />
        </svg>
      )
    case "monogramme-foil":
      return (
        <svg
          aria-hidden
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 120 160"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <linearGradient id="foil1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={palette.accent} stopOpacity="0.9" />
              <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.6" />
              <stop offset="100%" stopColor={palette.accent} stopOpacity="0.9" />
            </linearGradient>
          </defs>
          {/* Monogramme circulaire en filigrane */}
          <circle cx="60" cy="80" r="34" fill="none" stroke="url(#foil1)" strokeWidth="0.6" opacity="0.7" />
          <circle cx="60" cy="80" r="28" fill="none" stroke={palette.accent} strokeWidth="0.3" opacity="0.4" />
          <text
            x="60" y="86"
            fontSize="22"
            fontFamily="serif"
            textAnchor="middle"
            fill="url(#foil1)"
            opacity="0.8"
          >EB</text>
        </svg>
      )
    default:
      return null
  }
}
