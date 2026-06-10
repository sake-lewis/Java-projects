"use client"

import React, { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { Session, Photo, FORFAIT_CONFIG, Forfait } from '@/types'
import FormulaireCreation from '@/components/FormulaireCreation'
import StyleSelector from '@/components/StyleSelector'
import PhotoGrid from '@/components/PhotoGrid'
import CropperModal from '@/components/CropperModal'

function EditorContent() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const forfait = params.forfait as Forfait
  const token = searchParams.get('token')

  const [session, setSession] = useState<Session | null>(null)
  const [nomCatalogue, setNomCatalogue] = useState("")
  const [description, setDescription] = useState("")
  const [styleChoisi, setStyleChoisi] = useState<1 | 2 | 3 | 4 | 5>(1)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [cropFile, setCropFile] = useState<File | null>(null)
  const [cropOpen, setCropOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const maxPhotos = FORFAIT_CONFIG[forfait]?.photos_max || 50

  useEffect(() => {
    async function loadSession() {
      if (!token) {
        router.push("/error")
        return
      }
      try {
        const res = await fetch(`/api/session?token=${token}`)
        if (!res.ok) throw new Error("Session non trouvée")
        const data = await res.json()
        setSession(data)
        setNomCatalogue(data.nom_catalogue || "")
        setDescription(data.description || "")
        setStyleChoisi(data.style_choisi || 1)
        setPhotos(data.photos || [])
        setPdfUrl(data.pdf_url || null)
      } catch (err) {
        console.error(err)
        router.push("/error")
      } finally {
        setIsLoading(false)
      }
    }
    loadSession()
  }, [token, router])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (photos.length >= maxPhotos) {
      setError(`Nombre maximum de photos atteint (${maxPhotos})`)
      return
    }

    setCropFile(file)
    setCropOpen(true)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleCropConfirm = async (base64: string) => {
    setCropOpen(false)
    try {
      const res = await fetch('/api/upload-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, image: base64 })
      })
      if (!res.ok) throw new Error("Échec de l'upload")
      const { url } = await res.json()
      setPhotos(prev => [...prev, { url, description: "" }])
      setError(null)
    } catch (err) {
      setError("Erreur lors de l'envoi de la photo")
    }
  }

  const handleDeletePhoto = async (index: number) => {
    const photoToDelete = photos[index]
    try {
      setPhotos(prev => prev.filter((_, i) => i !== index))
      await fetch('/api/upload-photo', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, url: photoToDelete.url })
      })
    } catch (err) {
      console.error("Erreur suppression photo:", err)
    }
  }

  const handleAddDescription = (index: number, desc: string) => {
    setPhotos(prev => prev.map((p, i) => i === index ? { ...p, description: desc } : p))
  }

  const handleGenerate = async () => {
    if (nomCatalogue.length < 3) {
      setError("Le nom du catalogue est trop court")
      return
    }
    if (photos.length === 0) {
      setError("Ajoutez au moins une photo")
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const res = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          nom_catalogue: nomCatalogue,
          description,
          style_choisi: styleChoisi,
          photos
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur génération")
      setPdfUrl(data.pdf_url)
    } catch (err: any) {
      setError(err.message)
      setIsGenerating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#E8E0D5]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1E4D3A] border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#E8E0D5] pb-24">
      <div className="mx-auto max-w-[560px] px-6 py-12 space-y-12">
        
        <header className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-[0.2em] text-[#1E4D3A]">EVERBLOOM</h1>
          <p className="text-[12px] font-light uppercase tracking-widest text-[#C4956A]">Éditeur de catalogue</p>
        </header>

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-[#1E4D3A]" style={{ fontFamily: 'var(--font-cormorant), serif' }}>
            Nommez votre catalogue
          </h2>
          <FormulaireCreation
            nomCatalogue={nomCatalogue}
            description={description}
            onNomChange={setNomCatalogue}
            onDescriptionChange={setDescription}
          />
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-[#1E4D3A]" style={{ fontFamily: 'var(--font-cormorant), serif' }}>
            Choisissez votre thème
          </h2>
          <StyleSelector
            forfait={forfait}
            selectedStyle={styleChoisi}
            onSelect={setStyleChoisi}
          />
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-[#1E4D3A]" style={{ fontFamily: 'var(--font-cormorant), serif' }}>
              Ajoutez vos photos ({photos.length}/{maxPhotos})
            </h2>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1E4D3A] text-[#E8E0D5] shadow-lg transition-transform hover:scale-110 active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
            />
          </div>
          
          <PhotoGrid
            photos={photos}
            maxPhotos={maxPhotos}
            onAddDescription={handleAddDescription}
            onDeletePhoto={handleDeletePhoto}
          />
        </section>

        <section className="pt-8 space-y-4">
          {error && (
            <p className="text-center text-[14px] text-[#E53E3E] bg-[#E53E3E]/10 py-2 rounded">
              {error}
            </p>
          )}

          {!pdfUrl && !isGenerating && (
            <button
              onClick={handleGenerate}
              disabled={nomCatalogue.length < 3 || photos.length === 0}
              className="w-full rounded-md bg-[#1E4D3A] py-4 text-lg font-semibold text-[#E8E0D5] shadow-xl transition-all hover:bg-[#1E4D3A]/90 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ fontFamily: 'var(--font-cormorant), serif' }}
            >
              Générer mon catalogue PDF
            </button>
          )}

          {isGenerating && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1E4D3A] border-t-transparent"></div>
              <p className="text-[15px] font-light text-[#1E4D3A]" style={{ fontFamily: 'var(--font-lato), sans-serif' }}>
                Génération en cours, veuillez patienter...
              </p>
            </div>
          )}

          {pdfUrl && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-3 rounded-md bg-[#1E4D3A] py-4 text-lg font-semibold text-[#E8E0D5] shadow-xl transition-all hover:bg-[#1E4D3A]/90"
                style={{ fontFamily: 'var(--font-cormorant), serif' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Télécharger mon catalogue PDF
              </a>
              
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Voici mon catalogue EVERBLOOM : ${pdfUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-3 rounded-md bg-[#25D366] py-4 text-lg font-semibold text-white shadow-xl transition-all hover:bg-[#25D366]/90"
                style={{ fontFamily: 'var(--font-cormorant), serif' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-11.7 8.38 8.38 0 0 1 3.8.9L21 3z"></path>
                </svg>
                Partager sur WhatsApp
              </a>

              <p className="text-center text-[12px] font-light text-[#888888]">
                Disponible pendant 7 jours
              </p>
            </div>
          )}
        </section>
      </div>

      <CropperModal
        isOpen={cropOpen}
        imageFile={cropFile}
        onConfirm={handleCropConfirm}
        onCancel={() => setCropOpen(false)}
      />
    </div>
  )
}

export default function EditorPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#E8E0D5]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1E4D3A] border-t-transparent"></div>
      </div>
    }>
      <EditorContent />
    </Suspense>
  )
}
