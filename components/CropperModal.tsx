"use client"

import React, { useState, useRef } from 'react'
import ReactCrop, { Crop, PercentCrop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

interface CropperModalProps {
  isOpen: boolean
  imageFile: File | null
  onConfirm: (croppedBase64: string) => void
  onCancel: () => void
}

export default function CropperModal({ isOpen, imageFile, onConfirm, onCancel }: CropperModalProps) {
  const [imgSrc, setImgSrc] = useState('')
  // Le crop est conservé en POURCENTAGES de l'image : il reste exact quel que
  // soit le zoom, et se convertit directement en pixels natifs à la validation.
  const [crop, setCrop] = useState<PercentCrop>()
  const [zoom, setZoom] = useState(1)
  // Largeur d'affichage de l'image à zoom 1 (mesurée au chargement).
  const [baseWidth, setBaseWidth] = useState(0)
  const imgRef = useRef<HTMLImageElement>(null)
  const lastFileRef = useRef<File | null>(null)

  // Chargement du fichier (pendant le rendu, sans effet — nouvelle image = reset).
  if (isOpen && imageFile && imageFile !== lastFileRef.current) {
    lastFileRef.current = imageFile
    setImgSrc('')
    setCrop(undefined)
    setZoom(1)
    setBaseWidth(0)
    const reader = new FileReader()
    reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''))
    reader.readAsDataURL(imageFile)
  }

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height, naturalWidth, naturalHeight } = e.currentTarget
    setBaseWidth(width)
    // Pour un cadre 9:16 (vertical), on veut le rectangle de crop le plus grand
    // possible. Sur une photo paysage (naturalWidth > naturalHeight), partir
    // d'une largeur de 90% laisse un crop minuscule ; on contraint par la
    // hauteur à la place. Inversement, sur une photo portrait, contraindre par
    // la largeur donne le bon cadre.
    const paysage = naturalWidth > naturalHeight
    const initial = centerCrop(
      makeAspectCrop(
        paysage ? { unit: '%', height: 90 } : { unit: '%', width: 90 },
        9 / 16,
        width,
        height
      ),
      width,
      height
    )
    setCrop(initial)
  }

  async function handleConfirm() {
    const img = imgRef.current
    if (!img || !crop || !crop.width || !crop.height) return

    // % → pixels natifs : indépendant du zoom et de la taille d'affichage,
    // donc le résultat correspond exactement au cadre visible (WYSIWYG).
    const { naturalWidth, naturalHeight } = img
    const sx = (crop.x / 100) * naturalWidth
    const sy = (crop.y / 100) * naturalHeight
    const sw = (crop.width / 100) * naturalWidth
    const sh = (crop.height / 100) * naturalHeight

    const canvas = document.createElement('canvas')
    canvas.width = Math.round(sw)
    canvas.height = Math.round(sh)
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)

    // Qualité élevée : Cloudinary normalise ensuite en 1080×1920.
    const base64 = canvas.toDataURL('image/jpeg', 0.92)
    onConfirm(base64)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl overflow-hidden rounded-lg bg-[#1E1E1E] shadow-2xl">
        <div className="p-6">
          <h2 className="mb-6 text-center text-2xl font-semibold text-[#E8E0D5]" style={{ fontFamily: 'var(--font-sans)' }}>
            Recadrer la photo
          </h2>

          <div className="flex flex-col items-center gap-6">
            {/* overflow-auto : à zoom > 1 l'image dépasse et l'on panote en faisant défiler */}
            <div className="relative max-h-[60vh] w-full overflow-auto rounded-md border border-white/10 bg-black/20">
              {imgSrc ? (
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  aspect={9 / 16}
                  minWidth={60}
                >
                  <img
                    ref={imgRef}
                    src={imgSrc}
                    alt="Photo à recadrer"
                    onLoad={onImageLoad}
                    style={
                      baseWidth
                        ? { width: baseWidth * zoom, maxWidth: 'none' }
                        : undefined
                    }
                  />
                </ReactCrop>
              ) : (
                <div className="flex h-48 w-full items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#C4956A] border-t-transparent"></div>
                </div>
              )}
            </div>

            <div className="w-full space-y-2 px-4">
              <div className="flex justify-between text-xs text-[#E8E0D5]/60 uppercase tracking-wider">
                <span>Zoom</span>
                <span>{Math.round(zoom * 100)}%</span>
              </div>
              <input
                type="range"
                min="1"
                max="3"
                step="0.01"
                value={zoom}
                aria-label="Zoom de la photo"
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-[#E8E0D5]/20 accent-[#C4956A]"
              />
              {zoom > 1 && (
                <p className="text-center text-[11px] text-[#E8E0D5]/40">
                  Faites défiler l&apos;image pour cadrer la zone voulue
                </p>
              )}
            </div>

            <div className="flex w-full gap-4 pt-4">
              <button
                onClick={onCancel}
                className="flex-1 rounded-md border border-[#C4956A] py-3 text-sm font-medium text-[#C4956A] transition-colors hover:bg-[#C4956A]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4956A]"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirm}
                disabled={!crop || !crop.width}
                className="flex-1 rounded-md bg-[#1E4D3A] py-3 text-sm font-medium text-[#E8E0D5] transition-colors hover:bg-[#1E4D3A]/90 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8E0D5]"
              >
                Valider
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
