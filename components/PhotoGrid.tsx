"use client"

import React from "react"
import { Photo, EffetPhoto } from "@/types"

interface PhotoGridProps {
  photos: Photo[]
  maxPhotos: number
  effetsActives: boolean
  couvertureActive: boolean
  couvertureIndex: number | null
  onAddDescription: (index: number, description: string) => void
  onDeletePhoto: (index: number) => void
  onChangeEffet: (index: number, effet: EffetPhoto) => void
  onSetCouverture: (index: number | null) => void
}

const EFFETS: { id: EffetPhoto; label: string }[] = [
  { id: "couleur", label: "Couleur" },
  { id: "nb", label: "N&B" },
  { id: "sepia", label: "Sépia" },
]

const FILTRES_CSS: Record<EffetPhoto, string> = {
  couleur: "none",
  nb: "grayscale(1)",
  sepia: "sepia(0.75) saturate(0.85)",
}

export default function PhotoGrid({
  photos,
  maxPhotos,
  effetsActives,
  couvertureActive,
  couvertureIndex,
  onAddDescription,
  onDeletePhoto,
  onChangeEffet,
  onSetCouverture,
}: PhotoGridProps) {
  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#1E4D3A]/15 bg-white/40 py-12 text-[#1E4D3A]/40">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mb-3"
        >
          <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
          <circle cx="12" cy="13" r="3" />
        </svg>
        <p className="text-[14px] italic" style={{ fontFamily: "var(--font-sans)" }}>
          Aucune photo ajoutée
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span
          className="text-[11px] font-semibold uppercase tracking-[0.16em]"
          style={{ color: photos.length === maxPhotos ? "#C4956A" : "#1E4D3A99" }}
        >
          {photos.length} / {maxPhotos} photos
        </span>
        {couvertureActive && couvertureIndex !== null && (
          <button
            onClick={() => onSetCouverture(null)}
            className="text-[11px] font-medium text-[#C4956A] underline-offset-2 hover:underline"
          >
            Retirer la couverture
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {photos.map((photo, index) => {
          const effet: EffetPhoto = photo.effet ?? "couleur"
          const estCouverture = couvertureIndex === index
          return (
            <div
              key={index}
              className={`group relative flex flex-col gap-2 rounded-lg bg-[#F5F0EA] p-2 shadow-sm transition-all hover:shadow-md ${
                estCouverture ? "ring-2 ring-[#C4956A]" : ""
              }`}
            >
              <div className="relative aspect-[9/16] overflow-hidden rounded-md bg-[#E8E0D5]">
                <img
                  src={photo.url}
                  alt={`Photo ${index + 1}`}
                  className="h-full w-full object-cover transition-[filter] duration-200"
                  style={{ filter: FILTRES_CSS[effet] }}
                />

                {/* Badge couverture */}
                {estCouverture && (
                  <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-[#C4956A] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-white shadow">
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    Couverture
                  </span>
                )}

                {/* Bouton supprimer */}
                <button
                  onClick={() => {
                    if (estCouverture) onSetCouverture(null)
                    onDeletePhoto(index)
                  }}
                  aria-label="Supprimer la photo"
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>

                {/* Bouton couverture (Premium) */}
                {couvertureActive && !estCouverture && (
                  <button
                    onClick={() => onSetCouverture(index)}
                    aria-label="Choisir comme couverture"
                    className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-all hover:bg-[#C4956A]"
                    title="Choisir comme couverture"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Sélecteur d'effet (Pro/Premium) */}
              {effetsActives && (
                <div className="flex rounded-md bg-[#1E4D3A]/[0.05] p-0.5">
                  {EFFETS.map(e => {
                    const actif = effet === e.id
                    return (
                      <button
                        key={e.id}
                        onClick={() => onChangeEffet(index, e.id)}
                        className={`flex-1 rounded px-1 py-1 text-[10px] font-medium transition-all ${
                          actif
                            ? "bg-white text-[#1E4D3A] shadow-sm"
                            : "text-[#1E4D3A]/55 hover:text-[#1E4D3A]"
                        }`}
                      >
                        {e.label}
                      </button>
                    )
                  })}
                </div>
              )}

              <input
                type="text"
                value={photo.description || ""}
                maxLength={80}
                placeholder="Description (optionnelle)"
                onChange={e => onAddDescription(index, e.target.value)}
                className="w-full rounded border-none bg-[#E8E0D5] px-3 py-2 text-[13px] font-light text-[#1E4D3A] placeholder:text-[#1E4D3A]/40 focus:ring-1 focus:ring-[#1E4D3A]/20"
                style={{ fontFamily: "var(--font-sans)" }}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
