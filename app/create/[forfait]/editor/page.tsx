"use client"

import React, { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { Session, Photo, FORFAIT_CONFIG, Forfait } from '@/types'
import FormulaireCreation from '@/components/FormulaireCreation'
import StyleSelector from '@/components/StyleSelector'
import PhotoGrid from '@/components/PhotoGrid'
import CropperModal from '@/components/CropperModal'
import BloomMark from '@/components/ui/BloomMark'

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
    } finally {
      // Toujours sortir de l'état "génération en cours" : succès comme échec,
      // sinon le spinner masque le bouton de téléchargement après réussite.
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

  // Anneau de focus cohérent pour l'accessibilité clavier (charte EVERBLOOM).
  const focusRing =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E4D3A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#E8E0D5]"

  // Raison du blocage de la génération, affichée au lieu de griser sans explication.
  const blocage =
    nomCatalogue.length < 3
      ? "Donnez un nom d'au moins 3 caractères pour générer."
      : photos.length === 0
        ? "Ajoutez au moins une photo pour générer."
        : null

  return (
    <div className="min-h-screen bg-[#E8E0D5] pb-28">
      <div className="mx-auto max-w-[560px] px-6 py-12 space-y-12">

        <header className="flex flex-col items-center gap-2 text-center">
          <BloomMark className="h-9 w-9 text-[#C4956A]" />
          <h1 className="text-2xl font-semibold tracking-[0.28em] text-[#1E4D3A]">EVERBLOOM</h1>
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#C4956A]">Éditeur de catalogue</p>
        </header>

        {/* Étape 1 — nom : numérotée pour donner une hiérarchie et un sens de progression */}
        <section className="space-y-6">
          <StepHeader numero={1} titre="Nommez votre catalogue" />
          <FormulaireCreation
            nomCatalogue={nomCatalogue}
            description={description}
            onNomChange={setNomCatalogue}
            onDescriptionChange={setDescription}
          />
        </section>

        {/* Étape 2 — thème */}
        <section className="space-y-6">
          <StepHeader numero={2} titre="Choisissez votre thème" />
          <StyleSelector
            forfait={forfait}
            selectedStyle={styleChoisi}
            onSelect={setStyleChoisi}
          />
        </section>

        {/* Étape 3 — photos. Le compteur vit dans PhotoGrid uniquement (plus de doublon). */}
        <section className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <StepHeader numero={3} titre="Ajoutez vos photos" />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={photos.length >= maxPhotos}
              aria-label="Ajouter une photo"
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#1E4D3A] text-[#1E4D3A] transition-all hover:bg-[#1E4D3A] hover:text-[#E8E0D5] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[#1E4D3A] ${focusRing}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
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
      </div>

      {/* Barre d'action collante : action primaire unique, toujours à portée de pouce.
          Porte les états génération / succès pour que le client n'ait jamais à chercher l'étape suivante. */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#C4956A]/30 bg-[#E8E0D5]/95 backdrop-blur-sm">
        <div className="mx-auto max-w-[560px] px-6 py-4 space-y-3">
          {error && (
            <p role="alert" className="text-center text-[14px] text-[#E53E3E] bg-[#E53E3E]/10 py-2 rounded">
              {error}
            </p>
          )}

          {!pdfUrl && !isGenerating && (
            <>
              <button
                onClick={handleGenerate}
                disabled={!!blocage}
                className={`w-full rounded-md bg-[#1E4D3A] py-4 text-lg font-semibold text-[#E8E0D5] shadow-xl transition-all hover:bg-[#1E4D3A]/90 disabled:opacity-40 disabled:cursor-not-allowed ${focusRing}`}
                style={{ fontFamily: 'var(--font-sans)' }}
              >
                Générer mon catalogue PDF
              </button>
              {blocage && (
                <p className="text-center text-[12px] font-light text-[#1E4D3A]/60" style={{ fontFamily: 'var(--font-sans)' }}>
                  {blocage}
                </p>
              )}
            </>
          )}

          {isGenerating && (
            <div className="flex items-center justify-center gap-3 py-3">
              <div className="h-6 w-6 animate-spin rounded-full border-[3px] border-[#1E4D3A] border-t-transparent"></div>
              <p className="text-[15px] font-light text-[#1E4D3A]" style={{ fontFamily: 'var(--font-sans)' }}>
                Génération en cours, veuillez patienter…
              </p>
            </div>
          )}

          {pdfUrl && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex gap-3">
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex flex-1 items-center justify-center gap-2 rounded-md bg-[#1E4D3A] py-4 text-base font-semibold text-[#E8E0D5] shadow-xl transition-all hover:bg-[#1E4D3A]/90 ${focusRing}`}
                  style={{ fontFamily: 'var(--font-sans)' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  Télécharger
                </a>

                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Voici mon catalogue EVERBLOOM : ${pdfUrl}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Partager sur WhatsApp"
                  className={`flex shrink-0 items-center justify-center gap-2 rounded-md bg-[#25D366] px-5 py-4 text-base font-semibold text-white shadow-xl transition-all hover:bg-[#25D366]/90 ${focusRing}`}
                  style={{ fontFamily: 'var(--font-sans)' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-11.7 8.38 8.38 0 0 1 3.8.9L21 3z"></path>
                  </svg>
                  Partager
                </a>
              </div>
              <p className="text-center text-[12px] font-light text-[#888888]">
                Disponible pendant 7 jours
              </p>
            </div>
          )}
        </div>
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

/** En-tête d'étape numérotée : donne hiérarchie et sens de progression au formulaire. */
function StepHeader({ numero, titre }: { numero: number; titre: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1E4D3A] text-sm font-semibold text-[#E8E0D5]">
        {numero}
      </span>
      <h2 className="text-2xl font-semibold text-[#1E4D3A]" style={{ fontFamily: 'var(--font-sans)' }}>
        {titre}
      </h2>
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
