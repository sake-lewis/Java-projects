"use client"

import React from 'react'
import { Photo } from '@/types'

interface PhotoGridProps {
  photos: Photo[]
  maxPhotos: number
  onAddDescription: (index: number, description: string) => void
  onDeletePhoto: (index: number) => void
}

export default function PhotoGrid({ photos, maxPhotos, onAddDescription, onDeletePhoto }: PhotoGridProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span 
          className="text-xs font-light uppercase tracking-widest"
          style={{ 
            fontFamily: 'var(--font-sans)',
            color: photos.length === maxPhotos ? '#C4956A' : '#1E4D3A'
          }}
        >
          {photos.length} / {maxPhotos} photos
        </span>
      </div>

      {photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-[#C4956A]/60">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mb-4"
          >
            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
            <circle cx="12" cy="13" r="3" />
          </svg>
          <p 
            className="text-lg italic"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            Aucune photo ajoutée
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {photos.map((photo, index) => (
            <div 
              key={index} 
              className="group relative flex flex-col gap-2 rounded-lg bg-[#F5F0EA] p-2 shadow-sm transition-all hover:shadow-md"
            >
              <div className="relative aspect-[9/16] overflow-hidden rounded-md bg-[#E8E0D5]">
                <img
                  src={photo.url}
                  alt={`Photo ${index + 1}`}
                  className="h-full w-full object-cover"
                />
                <button
                  onClick={() => onDeletePhoto(index)}
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              <input
                type="text"
                value={photo.description || ''}
                maxLength={80}
                placeholder="Description (optionnelle)"
                onChange={(e) => onAddDescription(index, e.target.value)}
                className="w-full rounded border-none bg-[#E8E0D5] px-3 py-2 text-[13px] font-light text-[#1E4D3A] placeholder:text-[#1E4D3A]/40 focus:ring-1 focus:ring-[#1E4D3A]/20"
                style={{ fontFamily: 'var(--font-sans)' }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
