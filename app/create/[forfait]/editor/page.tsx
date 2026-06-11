"use client"

import React, { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { Session, Photo, FORFAIT_CONFIG, Forfait, StyleId, EffetPhoto } from '@/types'
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

  const config = FORFAIT_CONFIG[forfait]

  const [session, setSession] = useState<Session | null>(null)
  const [nomCatalogue, setNomCatalogue] = useState("")
  const [description, setDescription] = useState("")
  const [styleChoisi, setStyleChoisi] = useState<StyleId>(1)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [dedicace, setDedicace] = useState("")
  const [couvertureIndex, setCouvertureIndex] = useState<number | null>(null)
  const [cropFile, setCropFile] = useState<File | null>(null)
  const [cropOpen, setCropOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Capacités du forfait (Phase 3).
  const dedicaceMax = config?.dedicace_max ?? 0
  const dedicaceActive = dedicaceMax > 0
  const effetsActives = config?.effets_photo ?? false
  const couvertureActive = config?.photo_couverture ?? false

  // La valeur du forfait se joue sur le nombre de photos.
  const maxPhotos = config?.photos_max ?? 60
  const pagesFixes = 3 + (dedicaceActive && dedicace.trim().length > 0 ? 1 : 0)
  const pagesActuelles = photos.length + pagesFixes
  const ratioPhotos = photos.length / maxPhotos
  const presquePlein = ratioPhotos >= 0.85 && ratioPhotos < 1
  const plein = photos.length >= maxPhotos

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
        setDedicace(data.dedicace || "")
        setCouvertureIndex(
          typeof data.photo_couverture_index === "number" ? data.photo_couverture_index : null
        )
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
      setPhotos(prev => [...prev, { url, description: "", effet: "couleur" }])
      setError(null)
    } catch (err) {
      setError("Erreur lors de l'envoi de la photo")
    }
  }

  const handleDeletePhoto = async (index: number) => {
    const photoToDelete = photos[index]
    try {
      setPhotos(prev => prev.filter((_, i) => i !== index))
      // Si on supprime la couverture ou un index avant la couverture, on ajuste.
      setCouvertureIndex(prev => {
        if (prev === null) return prev
        if (prev === index) return null
        if (prev > index) return prev - 1
        return prev
      })
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

  const handleChangeEffet = (index: number, effet: EffetPhoto) => {
    setPhotos(prev => prev.map((p, i) => i === index ? { ...p, effet } : p))
  }

  const handleSetCouverture = (index: number | null) => {
    setCouvertureIndex(index)
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
          photos,
          dedicace: dedicaceActive ? dedicace.slice(0, dedicaceMax) : "",
          photo_couverture_index: couvertureActive ? couvertureIndex : null,
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur génération")
      setPdfUrl(data.pdf_url)
    } catch (err: any) {
      setError(err.message)
    } finally {
      // Toujours sortir de l'état "génération en cours" : succès comme échec.
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

  const blocage =
    nomCatalogue.length < 3
      ? "Donnez un nom d'au moins 3 caractères pour générer."
      : photos.length === 0
        ? "Ajoutez au moins une photo pour générer."
        : null

  const dedicaceLongueur = dedicace.length
  const dedicaceTropLongue = dedicaceLongueur > dedicaceMax

  return (
    <div className="min-h-screen bg-[#E8E0D5] pb-28">
      <div className="mx-auto max-w-[560px] px-6 py-12 space-y-12">

        <header className="animate-fade-up flex flex-col items-center gap-2 text-center">
          <BloomMark className="h-10 w-10 text-or" />
          <h1 className="wordmark mt-1 text-xl">EVERBLOOM</h1>
          <div className="hairline-or mt-2 w-24" />
          <p className="display mt-3 text-[28px] text-vert">Composez votre catalogue</p>

          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-vert/15 bg-vert/[0.04] px-4 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-or" />
            <span className="text-[12px] font-semibold tracking-wide text-vert">
              Forfait {config?.label}
            </span>
            <span className="text-[11px] font-light text-vert/55">
              · {maxPhotos} photos max
            </span>
          </div>
        </header>

        {/* Étape 1 — nom */}
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

        {/* Étape 3 — photos */}
        <section className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <StepHeader numero={3} titre="Ajoutez vos photos" />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={plein}
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

          {/* Compteur de photos live */}
          <div
            className={`card px-4 py-3 transition-colors ${
              plein
                ? "border-or/40 bg-or/8"
                : presquePlein
                ? "border-or/25 bg-or/5"
                : ""
            }`}
          >
            <div className="flex items-baseline justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-vert/55">
                  Votre album
                </div>
                <div className="mt-1 text-[15px] font-semibold tabular-nums text-vert">
                  {photos.length} photo{photos.length > 1 ? "s" : ""}
                  <span className="ml-1 text-[12px] font-normal text-vert/45">
                    / {maxPhotos} max
                  </span>
                </div>
              </div>
              <div className="text-right text-[11px] text-vert/50">
                soit {pagesActuelles} page{pagesActuelles > 1 ? "s" : ""}
                <br />
                <span className="text-vert/35">
                  avec couverture, intro{dedicaceActive && dedicace.trim().length > 0 ? ", dédicace" : ""}, clôture
                </span>
              </div>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-vert/8">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  plein ? "bg-or" : presquePlein ? "bg-or/80" : "bg-vert/60"
                }`}
                style={{ width: `${Math.min(100, Math.round(ratioPhotos * 100))}%` }}
              />
            </div>
            {plein && (
              <p className="mt-2 text-[12px] font-medium text-[#8B6840]">
                Vous avez atteint le maximum de votre forfait.
              </p>
            )}
            {presquePlein && !plein && (
              <p className="mt-2 text-[12px] text-[#8B6840]/80">
                Plus que {maxPhotos - photos.length} photo
                {maxPhotos - photos.length > 1 ? "s" : ""} avant le plafond.
              </p>
            )}
          </div>

          <PhotoGrid
            photos={photos}
            maxPhotos={maxPhotos}
            effetsActives={effetsActives}
            couvertureActive={couvertureActive}
            couvertureIndex={couvertureIndex}
            onAddDescription={handleAddDescription}
            onDeletePhoto={handleDeletePhoto}
            onChangeEffet={handleChangeEffet}
            onSetCouverture={handleSetCouverture}
          />
        </section>

        {/* Étape 4 — dédicace (Pro + Premium) */}
        {dedicaceActive && (
          <section className="space-y-6">
            <StepHeader numero={4} titre="Ajoutez une dédicace" />
            <div className="space-y-2">
              <label className="flex items-baseline justify-between text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1E4D3A]/60">
                <span>Mot personnel · optionnel</span>
                <span
                  className={`text-[10px] ${
                    dedicaceTropLongue ? "text-[#C53030]" : "text-[#1E4D3A]/40"
                  }`}
                >
                  {dedicaceLongueur} / {dedicaceMax}
                </span>
              </label>
              <textarea
                value={dedicace}
                onChange={e => setDedicace(e.target.value)}
                maxLength={dedicaceMax + 50}
                placeholder="Quelques mots pour ouvrir votre catalogue…"
                rows={4}
                className={`w-full rounded-lg border bg-white px-4 py-3 text-[15px] leading-relaxed text-[#1E4D3A] placeholder:text-[#1E4D3A]/30 focus:outline-none focus:ring-2 focus:ring-[#1E4D3A]/15 ${
                  dedicaceTropLongue
                    ? "border-[#C53030]/40"
                    : "border-[#1E4D3A]/15 focus:border-[#1E4D3A]/40"
                }`}
                style={{ fontFamily: "var(--font-sans)" }}
              />
              <p className="text-[11px] text-[#1E4D3A]/45">
                Apparaîtra sur une page dédiée, juste après l&apos;intro.
              </p>
            </div>
          </section>
        )}
      </div>

      {/* Barre d'action collante */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#C4956A]/30 bg-[#E8E0D5]/95 backdrop-blur-sm">
        <div className="mx-auto max-w-[560px] px-6 py-4 space-y-3">
          {error && (
            <p role="alert" className="rounded-lg bg-erreur/10 py-2 text-center text-[14px] text-erreur">
              {error}
            </p>
          )}

          {!pdfUrl && !isGenerating && (
            <>
              <button
                onClick={handleGenerate}
                disabled={!!blocage || dedicaceTropLongue}
                className={`btn-primary w-full text-lg ${focusRing}`}
              >
                Générer mon catalogue PDF
              </button>
              {blocage && (
                <p className="text-center text-[12px] font-light text-[#1E4D3A]/60" style={{ fontFamily: 'var(--font-sans)' }}>
                  {blocage}
                </p>
              )}
              {dedicaceTropLongue && !blocage && (
                <p className="text-center text-[12px] text-[#C53030]">
                  Dédicace trop longue ({dedicaceMax} caractères max pour ce forfait).
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
                  download={`${nomCatalogue || 'catalogue'}.pdf`}
                  rel="noopener noreferrer"
                  className={`btn-primary flex-1 text-base ${focusRing}`}
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
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-vert text-sm font-semibold text-ivoire">
        {numero}
      </span>
      <h2 className="display text-[26px] text-vert">{titre}</h2>
      <div className="hairline-or min-w-6 flex-1" />
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
