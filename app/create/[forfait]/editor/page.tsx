"use client"

import React, { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { Session, Photo, PageAlbum, FORFAIT_CONFIG, Forfait, StyleId, EffetPhoto, PHOTOS_PAR_PAGE_MAX } from '@/types'
import FormulaireCreation from '@/components/FormulaireCreation'
import StyleSelector from '@/components/StyleSelector'
import PageGrid from '@/components/PageGrid'
import ChoixPhotosModal from '@/components/ChoixPhotosModal'
import BloomMark from '@/components/ui/BloomMark'
import { preparerPhoto } from '@/lib/album/compress'

// Cible des fichiers en attente de sélection : nouvelle page, ajout à une
// page existante, ou remplacement d'une photo précise.
type CibleUpload =
  | { type: "nouvelle-page"; nombre: number }
  | { type: "ajout-page"; pageIdx: number }
  | { type: "remplacement"; pageIdx: number; photoIdx: number }

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
  const [pages, setPages] = useState<PageAlbum[]>([])
  const [dedicace, setDedicace] = useState("")
  const [couvertureUrl, setCouvertureUrl] = useState<string | null>(null)
  const [modalChoixOuverte, setModalChoixOuverte] = useState(false)
  const [cible, setCible] = useState<CibleUpload | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Capacités du forfait.
  const dedicaceMax = config?.dedicace_max ?? 0
  const dedicaceActive = dedicaceMax > 0
  const effetsActives = config?.effets_photo ?? false
  const couvertureActive = config?.photo_couverture ?? false

  // La valeur du forfait se joue sur le nombre de photos.
  const maxPhotos = config?.photos_max ?? 60
  const photosTotal = pages.reduce((n, p) => n + p.photos.length, 0)
  const pagesFixes = 3 + (dedicaceActive && dedicace.trim().length > 0 ? 1 : 0)
  const pagesActuelles = pages.length + pagesFixes
  const ratioPhotos = photosTotal / maxPhotos
  const presquePlein = ratioPhotos >= 0.85 && ratioPhotos < 1
  const plein = photosTotal >= maxPhotos

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
        // Compat : les anciennes sessions stockaient une liste plate `photos`.
        const pagesChargees: PageAlbum[] =
          data.pages ??
          (Array.isArray(data.photos) ? data.photos.map((p: Photo) => ({ photos: [p] })) : [])
        setPages(pagesChargees)
        setDedicace(data.dedicace || "")
        const flat = pagesChargees.flatMap(p => p.photos)
        setCouvertureUrl(
          typeof data.photo_couverture_index === "number"
            ? flat[data.photo_couverture_index]?.url ?? null
            : null
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

  // ——— Upload ———

  function lancerSelectionFichiers(nouvelleCible: CibleUpload) {
    setCible(nouvelleCible)
    if (fileInputRef.current) {
      fileInputRef.current.multiple = nouvelleCible.type === "nouvelle-page" && nouvelleCible.nombre > 1
      fileInputRef.current.click()
    }
  }

  async function uploadFichier(file: File): Promise<Photo> {
    const { base64, ratio } = await preparerPhoto(file)
    const res = await fetch('/api/upload-photo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, image: base64 })
    })
    if (!res.ok) throw new Error("Échec de l'upload")
    const { url } = await res.json()
    return { url, ratio, description: "", effet: "couleur" }
  }

  async function supprimerSurCloudinary(url: string) {
    try {
      await fetch('/api/upload-photo', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, url })
      })
    } catch (err) {
      console.error("Erreur suppression photo:", err)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fichiers = Array.from(e.target.files ?? [])
    if (fileInputRef.current) fileInputRef.current.value = ""
    if (fichiers.length === 0 || !cible) return

    // Plafonds : nombre demandé, 4 par page, capacité restante du forfait.
    let quota = maxPhotos - photosTotal
    if (cible.type === "nouvelle-page") quota = Math.min(quota, cible.nombre)
    if (cible.type === "ajout-page")
      quota = Math.min(quota, PHOTOS_PAR_PAGE_MAX - pages[cible.pageIdx].photos.length)
    if (cible.type === "remplacement") quota = 1
    const retenus = fichiers.slice(0, Math.max(0, quota))
    if (retenus.length === 0) {
      setError(`Nombre maximum de photos atteint (${maxPhotos})`)
      return
    }

    setIsUploading(true)
    setError(null)
    try {
      const nouvelles: Photo[] = []
      for (const f of retenus) {
        nouvelles.push(await uploadFichier(f))
      }

      if (cible.type === "nouvelle-page") {
        setPages(prev => [...prev, { photos: nouvelles }])
      } else if (cible.type === "ajout-page") {
        setPages(prev => prev.map((p, i) =>
          i === cible.pageIdx ? { photos: [...p.photos, ...nouvelles] } : p
        ))
      } else {
        const ancienne = pages[cible.pageIdx]?.photos[cible.photoIdx]
        setPages(prev => prev.map((p, i) =>
          i === cible.pageIdx
            ? {
                photos: p.photos.map((photo, j) =>
                  j === cible.photoIdx
                    ? { ...nouvelles[0], description: photo.description, effet: photo.effet }
                    : photo
                ),
              }
            : p
        ))
        if (ancienne) {
          if (couvertureUrl === ancienne.url) setCouvertureUrl(null)
          await supprimerSurCloudinary(ancienne.url)
        }
      }
    } catch {
      setError("Erreur lors de l'envoi des photos")
    } finally {
      setIsUploading(false)
      setCible(null)
    }
  }

  // ——— Actions sur les pages ———

  const handleDeletePhoto = async (pageIdx: number, photoIdx: number) => {
    const photo = pages[pageIdx]?.photos[photoIdx]
    if (!photo) return
    // La page se réorganise automatiquement ; elle disparaît si elle se vide.
    setPages(prev =>
      prev
        .map((p, i) =>
          i === pageIdx ? { photos: p.photos.filter((_, j) => j !== photoIdx) } : p
        )
        .filter(p => p.photos.length > 0)
    )
    if (couvertureUrl === photo.url) setCouvertureUrl(null)
    await supprimerSurCloudinary(photo.url)
  }

  const handleChangeEffet = (pageIdx: number, photoIdx: number, effet: EffetPhoto) => {
    setPages(prev => prev.map((p, i) =>
      i === pageIdx
        ? { photos: p.photos.map((photo, j) => (j === photoIdx ? { ...photo, effet } : photo)) }
        : p
    ))
  }

  const handleChangeDescription = (pageIdx: number, photoIdx: number, desc: string) => {
    setPages(prev => prev.map((p, i) =>
      i === pageIdx
        ? { photos: p.photos.map((photo, j) => (j === photoIdx ? { ...photo, description: desc } : photo)) }
        : p
    ))
  }

  // ——— Génération ———

  const handleGenerate = async () => {
    if (nomCatalogue.length < 3) {
      setError("Le nom du catalogue est trop court")
      return
    }
    if (photosTotal === 0) {
      setError("Ajoutez au moins une photo")
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const flat = pages.flatMap(p => p.photos)
      const couvertureIndex = couvertureUrl
        ? flat.findIndex(p => p.url === couvertureUrl)
        : -1
      const res = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          nom_catalogue: nomCatalogue,
          description,
          style_choisi: styleChoisi,
          pages,
          dedicace: dedicaceActive ? dedicace.slice(0, dedicaceMax) : "",
          photo_couverture_index:
            couvertureActive && couvertureIndex >= 0 ? couvertureIndex : null,
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
      : photosTotal === 0
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

        {/* Étape 3 — pages de photos */}
        <section className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <StepHeader numero={3} titre="Composez vos pages" />
            <button
              onClick={() => setModalChoixOuverte(true)}
              disabled={plein || isUploading}
              aria-label="Ajouter une page"
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

          {/* Compteur live */}
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
                  {photosTotal} photo{photosTotal > 1 ? "s" : ""}
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
                Plus que {maxPhotos - photosTotal} photo
                {maxPhotos - photosTotal > 1 ? "s" : ""} avant le plafond.
              </p>
            )}
          </div>

          {isUploading && (
            <div className="flex items-center justify-center gap-2 rounded-lg bg-vert/[0.04] py-3">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-vert border-t-transparent" />
              <span className="text-[13px] text-vert/70">Envoi des photos…</span>
            </div>
          )}

          <PageGrid
            pages={pages}
            effetsActives={effetsActives}
            couvertureActive={couvertureActive}
            couvertureUrl={couvertureUrl}
            onDeletePhoto={handleDeletePhoto}
            onReplacePhoto={(pageIdx, photoIdx) =>
              lancerSelectionFichiers({ type: "remplacement", pageIdx, photoIdx })
            }
            onAddPhotoToPage={pageIdx => {
              if (plein) return
              lancerSelectionFichiers({ type: "ajout-page", pageIdx })
            }}
            onChangeEffet={handleChangeEffet}
            onChangeDescription={handleChangeDescription}
            onSetCouverture={setCouvertureUrl}
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
                disabled={!!blocage || dedicaceTropLongue || isUploading}
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

      <ChoixPhotosModal
        isOpen={modalChoixOuverte}
        maxChoix={Math.min(PHOTOS_PAR_PAGE_MAX, maxPhotos - photosTotal)}
        onChoisir={n => {
          setModalChoixOuverte(false)
          lancerSelectionFichiers({ type: "nouvelle-page", nombre: n })
        }}
        onCancel={() => setModalChoixOuverte(false)}
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
