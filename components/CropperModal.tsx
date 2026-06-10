"use client"

import React, { useState, useEffect, useRef } from 'react'
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

interface CropperModalProps {
  isOpen: boolean
  imageFile: File | null
  onConfirm: (croppedBase64: string) => void
  onCancel: () => void
}

export default function CropperModal({ isOpen, imageFile, onConfirm, onCancel }: CropperModalProps) {
  const [imgSrc, setImgSrc] = useState('')
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [zoom, setZoom] = useState(1)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (isOpen && imageFile) {
      const reader = new FileReader()
      reader.addEventListener('load', () => {
        setImgSrc(reader.result?.toString() || '')
        setZoom(1)
      })
      reader.readAsDataURL(imageFile)
    }
  }, [isOpen, imageFile])

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget
    const initialCrop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        9 / 16,
        width,
        height
      ),
      width,
      height
    )
    setCrop(initialCrop)
  }

  async function handleConfirm() {
    if (imgRef.current && completedCrop) {
      const canvas = document.createElement('canvas')
      const scaleX = imgRef.current.naturalWidth / imgRef.current.width
      const scaleY = imgRef.current.naturalHeight / imgRef.current.height
      
      canvas.width = completedCrop.width * scaleX
      canvas.height = completedCrop.height * scaleY
      
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.drawImage(
        imgRef.current,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        canvas.width,
        canvas.height
      )

      const base64 = canvas.toDataURL('image/jpeg', 0.85)
      onConfirm(base64)
    }
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
            <div className="relative max-h-[60vh] overflow-hidden rounded-md border border-white/10 bg-black/20">
              {imgSrc ? (
                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={9 / 16}
                  minWidth={100}
                  className="max-w-full"
                >
                  <img
                    ref={imgRef}
                    src={imgSrc}
                    alt="Crop me"
                    onLoad={onImageLoad}
                    style={{ transform: `scale(${zoom})`, transition: 'transform 0.1s ease-out' }}
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
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-[#E8E0D5]/20 accent-[#C4956A]"
              />
            </div>

            <div className="flex w-full gap-4 pt-4">
              <button
                onClick={onCancel}
                className="flex-1 rounded-md border border-[#C4956A] py-3 text-sm font-medium text-[#C4956A] transition-colors hover:bg-[#C4956A]/10"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 rounded-md bg-[#1E4D3A] py-3 text-sm font-medium text-[#E8E0D5] transition-colors hover:bg-[#1E4D3A]/90 shadow-lg"
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
