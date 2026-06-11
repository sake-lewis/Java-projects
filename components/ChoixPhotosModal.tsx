"use client"

import React from "react"

interface ChoixPhotosModalProps {
  isOpen: boolean
  maxChoix: number // capacité restante du forfait (plafonnée à 4)
  onChoisir: (nombre: number) => void
  onCancel: () => void
}

// Pictogrammes des mises en page (1 à 4 photos sur la page).
const APERCUS: Record<number, { cols: string; rows: string; cells: { c?: string; r?: string }[] }> = {
  1: { cols: "1fr", rows: "1fr", cells: [{}] },
  2: { cols: "1fr 1fr", rows: "1fr", cells: [{}, {}] },
  3: { cols: "1.4fr 1fr", rows: "1fr 1fr", cells: [{ r: "span 2" }, {}, {}] },
  4: { cols: "1fr 1fr", rows: "1fr 1fr", cells: [{}, {}, {}, {}] },
}

/**
 * Demande combien de photos poser sur la page (1 à 4). La mise en page
 * exacte sera ensuite choisie automatiquement selon le format des photos.
 */
export default function ChoixPhotosModal({ isOpen, maxChoix, onChoisir, onCancel }: ChoixPhotosModalProps) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-vert/40 backdrop-blur-sm sm:items-center"
      onClick={onCancel}
    >
      <div
        className="animate-fade-up w-full max-w-sm rounded-t-2xl bg-ivoire p-6 shadow-2xl sm:rounded-2xl"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-label="Nombre de photos sur la page"
      >
        <h3 className="display text-center text-[22px] text-vert">
          Combien de photos sur cette page ?
        </h3>
        <p className="mt-1 text-center text-[12px] text-vert/50">
          La mise en page s&apos;adapte automatiquement au format de vos photos.
        </p>

        <div className="mt-6 grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(n => {
            const apercu = APERCUS[n]
            const possible = n <= maxChoix
            return (
              <button
                key={n}
                disabled={!possible}
                onClick={() => onChoisir(n)}
                className="group focus-ring flex flex-col items-center gap-2 rounded-xl border border-vert/15 bg-surface p-3 transition-all hover:border-vert hover:shadow-md disabled:cursor-not-allowed disabled:opacity-30"
              >
                <div
                  className="grid aspect-[3/4] w-full gap-[3px]"
                  style={{ gridTemplateColumns: apercu.cols, gridTemplateRows: apercu.rows }}
                >
                  {apercu.cells.map((cell, i) => (
                    <span
                      key={i}
                      className="rounded-[2px] bg-vert/25 transition-colors group-hover:bg-vert/45"
                      style={{ gridRow: cell.r, gridColumn: cell.c }}
                    />
                  ))}
                </div>
                <span className="text-[13px] font-semibold text-vert">{n}</span>
              </button>
            )
          })}
        </div>

        <button
          onClick={onCancel}
          className="btn-secondary mt-5 w-full !py-3 text-[14px]"
        >
          Annuler
        </button>
      </div>
    </div>
  )
}
