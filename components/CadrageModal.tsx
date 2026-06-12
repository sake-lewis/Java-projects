"use client"

import React, { useEffect, useRef, useState } from "react"

interface CadrageModalProps {
  isOpen: boolean
  imageUrl: string
  // Rapport largeur/hauteur du cadre = celui de la cellule de destination.
  aspect: number
  onConfirm: (base64: string) => void
  onCancel: () => void
}

const ZOOM_MIN = 1
const ZOOM_MAX = 3
const EXPORT_LARGEUR_MAX = 1600

/**
 * Réglage manuel du cadrage : zoom + déplacement au doigt/souris, dans un
 * cadre qui a exactement la forme de la cellule où la photo sera posée
 * (le « recadrage intelligent » choisit la cellule, ici on affine).
 * À la validation, la zone visible est exportée en JPEG et remplace la photo.
 */
export default function CadrageModal({ isOpen, imageUrl, aspect, onConfirm, onCancel }: CadrageModalProps) {
  const cadreRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [pret, setPret] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [enCours, setEnCours] = useState(false)
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)

  // Réinitialise à chaque ouverture.
  useEffect(() => {
    if (isOpen) {
      setZoom(1)
      setOffset({ x: 0, y: 0 })
      setPret(false)
      setErreur(null)
      setEnCours(false)
    }
  }, [isOpen, imageUrl])

  if (!isOpen) return null

  // Taille « cover » de base de l'image dans le cadre (zoom 1).
  function baseCover() {
    const cadre = cadreRef.current
    const img = imgRef.current
    if (!cadre || !img || !img.naturalWidth) return null
    const W = cadre.clientWidth
    const H = cadre.clientHeight
    const s0 = Math.max(W / img.naturalWidth, H / img.naturalHeight)
    return { W, H, iw: img.naturalWidth, ih: img.naturalHeight, s0 }
  }

  // Garde l'image couvrante : l'offset ne peut pas découvrir le cadre.
  function clampOffset(o: { x: number; y: number }, z: number) {
    const b = baseCover()
    if (!b) return o
    const s = b.s0 * z
    const maxX = Math.max(0, (b.iw * s - b.W) / 2)
    const maxY = Math.max(0, (b.ih * s - b.H) / 2)
    return {
      x: Math.max(-maxX, Math.min(maxX, o.x)),
      y: Math.max(-maxY, Math.min(maxY, o.y)),
    }
  }

  function onPointerDown(e: React.PointerEvent) {
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    dragRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y }
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = dragRef.current
    if (!d) return
    setOffset(clampOffset({ x: d.ox + (e.clientX - d.x), y: d.oy + (e.clientY - d.y) }, zoom))
  }

  function onPointerUp() {
    dragRef.current = null
  }

  function changerZoom(z: number) {
    setZoom(z)
    setOffset(prev => clampOffset(prev, z))
  }

  function valider() {
    const b = baseCover()
    const img = imgRef.current
    if (!b || !img) return
    setEnCours(true)
    setErreur(null)
    try {
      const s = b.s0 * zoom
      // Zone source visible dans le cadre, en coordonnées image.
      const sw = b.W / s
      const sh = b.H / s
      const sx = b.iw / 2 - (b.W / 2 + offset.x) / s
      const sy = b.ih / 2 - (b.H / 2 + offset.y) / s

      const outW = Math.min(EXPORT_LARGEUR_MAX, Math.round(sw))
      const outH = Math.round(outW / aspect)
      const canvas = document.createElement("canvas")
      canvas.width = outW
      canvas.height = outH
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("canvas")
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH)
      onConfirm(canvas.toDataURL("image/jpeg", 0.92))
    } catch {
      // Image inaccessible en lecture canvas (CORS) ou export impossible.
      setErreur("Réglage impossible sur cette photo — remplacez-la si besoin.")
      setEnCours(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-vert/60 px-6 backdrop-blur-sm">
      <div
        className="animate-fade-up w-full max-w-sm rounded-2xl bg-ivoire p-5 shadow-2xl"
        role="dialog"
        aria-label="Ajuster le cadrage"
      >
        <h3 className="display text-center text-[22px] text-vert">Ajustez le cadrage</h3>
        <p className="mt-1 text-center text-[12px] text-vert/50">
          Glissez la photo, zoomez — le cadre a la forme exacte de son emplacement.
        </p>

        {/* Cadre à la forme de la cellule de destination */}
        <div className="mt-4 flex justify-center">
          <div
            ref={cadreRef}
            className="relative touch-none select-none overflow-hidden rounded-lg bg-vert/10 shadow-inner"
            style={{
              aspectRatio: String(aspect),
              ...(aspect >= 1 ? { width: "100%" } : { height: "min(52vh, 420px)" }),
              cursor: dragRef.current ? "grabbing" : "grab",
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={imageUrl}
              alt=""
              crossOrigin="anonymous"
              draggable={false}
              onLoad={() => setPret(true)}
              className="pointer-events-none absolute left-1/2 top-1/2"
              style={{
                width: pret && cadreRef.current && imgRef.current
                  ? `${Math.round((baseCover()?.s0 ?? 1) * (imgRef.current.naturalWidth || 0))}px`
                  : "100%",
                maxWidth: "none",
                transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
              }}
            />
            {/* Tiers de cadrage */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute inset-y-0 left-1/3 w-px bg-white/30" />
              <div className="absolute inset-y-0 left-2/3 w-px bg-white/30" />
              <div className="absolute inset-x-0 top-1/3 h-px bg-white/30" />
              <div className="absolute inset-x-0 top-2/3 h-px bg-white/30" />
            </div>
          </div>
        </div>

        {/* Zoom */}
        <div className="mt-4 flex items-center gap-3">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0 text-vert/50">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="range"
            min={ZOOM_MIN}
            max={ZOOM_MAX}
            step={0.01}
            value={zoom}
            onChange={e => changerZoom(Number(e.target.value))}
            aria-label="Zoom"
            className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-vert/15 accent-[#1E4D3A]"
          />
          <span className="w-10 shrink-0 text-right text-[12px] tabular-nums text-vert/55">
            ×{zoom.toFixed(1)}
          </span>
        </div>

        {erreur && (
          <p className="mt-3 rounded-lg bg-erreur/10 py-2 text-center text-[13px] text-erreur">
            {erreur}
          </p>
        )}

        <div className="mt-5 flex gap-3">
          <button onClick={onCancel} disabled={enCours} className="btn-secondary flex-1 !py-3 text-[14px]">
            Annuler
          </button>
          <button onClick={valider} disabled={enCours || !pret} className="btn-primary flex-1 !py-3 text-[14px]">
            {enCours ? "Application…" : "Valider"}
          </button>
        </div>
      </div>
    </div>
  )
}
