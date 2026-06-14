"use client"

import React, { useState } from "react"
import { PageAlbum, EffetPhoto, PHOTOS_PAR_PAGE_MAX, StyleId } from "@/types"
import { layoutPage, ordonnerPourLayout, LayoutId } from "@/lib/album/layout"
import { STYLES } from "@/lib/styles/catalog"
import { motifInner } from "@/lib/styles/motifs"
import { motifImagePath } from "@/lib/styles/motifImages"

interface PageGridProps {
  pages: PageAlbum[]
  styleChoisi: StyleId
  effetsActives: boolean
  couvertureActive: boolean
  couvertureUrl: string | null
  onDeletePhoto: (pageIdx: number, photoIdx: number) => void
  onReplacePhoto: (pageIdx: number, photoIdx: number) => void
  onAjusterPhoto: (pageIdx: number, photoIdx: number) => void
  onAgrandirPhoto: (pageIdx: number, photoIdx: number) => void
  onReduirePhoto: (pageIdx: number) => void
  onAddPhotoToPage: (pageIdx: number) => void
  onChangeEffet: (pageIdx: number, photoIdx: number, effet: EffetPhoto) => void
  onChangeDescription: (pageIdx: number, photoIdx: number, description: string) => void
  onSetCouverture: (url: string | null) => void
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

// Grilles miroir de celles du template PDF (master.html) : l'aperçu doit
// correspondre au rendu final.
const GRILLES: Record<LayoutId, React.CSSProperties> = {
  "solo-portrait": { display: "grid", placeItems: "center", gridTemplate: "1fr / 72%" },
  "solo-paysage": { display: "grid", placeItems: "center", gridTemplate: "1fr / 100%" },
  "duo-colonnes": { display: "grid", gridTemplateColumns: "1fr 1fr" },
  "duo-lignes": { display: "grid", gridTemplateRows: "1fr 1fr" },
  "duo-mixte": { display: "grid", gridTemplateRows: "0.85fr 1fr", justifyItems: "center" },
  "trio-gauche": { display: "grid", gridTemplateColumns: "1.5fr 1fr", gridTemplateRows: "1fr 1fr" },
  "trio-haut": { display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1.35fr 1fr" },
  "quatuor": { display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr" },
}

function styleCellule(layout: LayoutId, idx: number): React.CSSProperties {
  const s: React.CSSProperties = { minHeight: 0, minWidth: 0 }
  if (layout === "solo-portrait") s.height = "100%"
  if (layout === "solo-paysage") { s.width = "100%"; s.aspectRatio = "4/3" }
  if (layout === "duo-mixte") {
    if (idx === 0) { s.width = "100%"; s.height = "100%" }
    else { s.height = "100%"; s.aspectRatio = "3/4" }
  }
  if (layout === "trio-gauche" && idx === 0) s.gridRow = "span 2"
  if (layout === "trio-haut" && idx === 0) s.gridColumn = "span 2"
  return s
}

export default function PageGrid({
  pages,
  styleChoisi,
  effetsActives,
  couvertureActive,
  couvertureUrl,
  onDeletePhoto,
  onReplacePhoto,
  onAjusterPhoto,
  onAgrandirPhoto,
  onReduirePhoto,
  onAddPhotoToPage,
  onChangeEffet,
  onChangeDescription,
  onSetCouverture,
}: PageGridProps) {
  // Photo sélectionnée : ouvre la barre d'outils sous sa page.
  const [selection, setSelection] = useState<{ page: number; photo: number } | null>(null)
  // Images en échec de chargement (réseau) + jeton de relance par URL.
  const [imgErr, setImgErr] = useState<Record<string, true>>({})
  const [bust, setBust] = useState<Record<string, number>>({})

  // Motif du style courant, posé en filigrane sur chaque cadre photo.
  const motifSvg = motifInner(STYLES[styleChoisi]?.motif ?? "none")
  const accent = STYLES[styleChoisi]?.palette.accent ?? "#1E4D3A"
  // Motif image (PNG aquarelle) du style, s'il existe : prioritaire sur le SVG,
  // avec repli automatique sur le SVG si le fichier est absent.
  const motifImg = motifImagePath(styleChoisi)
  const [imgMotifOk, setImgMotifOk] = useState(true)
  React.useEffect(() => setImgMotifOk(true), [styleChoisi])

  function signalerEchec(url: string) {
    setImgErr(e => (e[url] ? e : { ...e, [url]: true }))
  }
  function effacerEchec(url: string) {
    setImgErr(e => {
      if (!e[url]) return e
      const c = { ...e }
      delete c[url]
      return c
    })
  }
  function relancerImage(url: string) {
    setBust(b => ({ ...b, [url]: (b[url] ?? 0) + 1 }))
    effacerEchec(url)
  }

  if (pages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-vert/15 bg-white/40 py-12 text-vert/40">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-3">
          <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
          <circle cx="12" cy="13" r="3" />
        </svg>
        <p className="text-[14px]">Votre album est encore vide</p>
        <p className="mt-1 text-[12px] text-vert/30">
          Ajoutez votre première page avec le bouton +
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {pages.map((page, pageIdx) => {
        const layout = layoutPage(page.photos)
        // Réordonne pour l'affichage, mais retrouve l'index réel pour les actions.
        const ordonnees = ordonnerPourLayout(page.photos, layout)
        const indexReel = (photo: (typeof ordonnees)[number]) =>
          page.photos.indexOf(photo)
        const sel = selection?.page === pageIdx ? selection.photo : null
        const photoSel = sel !== null ? page.photos[sel] : null
        const solo = page.photos.length === 1

        return (
          <div key={pageIdx} className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-vert/50">
                Page {pageIdx + 1}
                <span className="ml-2 font-normal normal-case tracking-normal text-vert/35">
                  {page.photos.length} photo{page.photos.length > 1 ? "s" : ""}
                </span>
              </span>
              {page.photos.length < PHOTOS_PAR_PAGE_MAX && (
                <button
                  onClick={() => onAddPhotoToPage(pageIdx)}
                  className="text-[11px] font-medium text-or underline-offset-2 hover:underline"
                >
                  + Ajouter une photo ici
                </button>
              )}
            </div>

            {/* Mini-canvas A4 : même moteur de mise en page que le PDF */}
            <div className="card aspect-[210/297] w-full overflow-hidden !rounded-lg p-[5%]">
              <div className="h-full w-full gap-2" style={GRILLES[layout]}>
                {ordonnees.map(photo => {
                  const i = indexReel(photo)
                  const estSel = sel === i
                  const estCouverture = couvertureUrl === photo.url
                  const enErreur = !!imgErr[photo.url]
                  const srcImg = bust[photo.url]
                    ? `${photo.url}${photo.url.includes("?") ? "&" : "?"}r=${bust[photo.url]}`
                    : photo.url
                  return (
                    <button
                      key={photo.url}
                      type="button"
                      onClick={() =>
                        setSelection(estSel ? null : { page: pageIdx, photo: i })
                      }
                      className={`relative overflow-hidden bg-white p-1 shadow-sm transition-all ${
                        estSel ? "ring-2 ring-or" : "hover:shadow-md"
                      }`}
                      style={styleCellule(layout, ordonnees.indexOf(photo))}
                    >
                      <img
                        src={srcImg}
                        alt=""
                        className="h-full w-full object-cover"
                        style={{ filter: FILTRES_CSS[photo.effet ?? "couleur"] }}
                        onError={() => signalerEchec(photo.url)}
                        onLoad={() => effacerEchec(photo.url)}
                      />
                      {/* Motif décoratif du style, posé sur le cadre.
                          PNG aquarelle si présent, sinon repli sur le SVG. */}
                      {!enErreur && imgMotifOk ? (
                        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                          <img src={motifImg} alt="" onError={() => setImgMotifOk(false)}
                            className="absolute left-[2%] top-[2%] w-[44%] rotate-180" style={{ opacity: 0.9 }} />
                          <img src={motifImg} alt="" onError={() => setImgMotifOk(false)}
                            className="absolute right-[2%] top-[2%] w-[44%] -scale-y-100" style={{ opacity: 0.9 }} />
                          <img src={motifImg} alt="" onError={() => setImgMotifOk(false)}
                            className="absolute left-[2%] bottom-[2%] w-[44%] -scale-x-100" style={{ opacity: 0.9 }} />
                          <img src={motifImg} alt="" onError={() => setImgMotifOk(false)}
                            className="absolute right-[2%] bottom-[2%] w-[44%]" style={{ opacity: 0.9 }} />
                        </div>
                      ) : (
                        motifSvg && !enErreur && (
                          <svg
                            viewBox="0 0 100 100"
                            preserveAspectRatio="none"
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0 h-full w-full opacity-70"
                            style={{ color: accent }}
                            dangerouslySetInnerHTML={{ __html: motifSvg }}
                          />
                        )
                      )}
                      {estCouverture && (
                        <span className="absolute left-1 top-1 flex items-center gap-1 rounded-full bg-or px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.08em] text-white shadow">
                          ★ Couv.
                        </span>
                      )}
                      {/* Image qui n'a pas pu charger (réseau) : relance non destructive */}
                      {enErreur && (
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={e => {
                            e.stopPropagation()
                            relancerImage(photo.url)
                          }}
                          className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-vert/[0.06] text-[10px] font-medium text-vert/70"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" />
                          </svg>
                          Réessayer
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Barre d'outils de la photo sélectionnée */}
            {photoSel && sel !== null && (
              <div className="card space-y-3 !rounded-lg px-3 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  {effetsActives && (
                    <div className="flex rounded-md bg-vert/[0.05] p-0.5">
                      {EFFETS.map(e => (
                        <button
                          key={e.id}
                          onClick={() => onChangeEffet(pageIdx, sel, e.id)}
                          className={`rounded px-2 py-1 text-[11px] font-medium transition-all ${
                            (photoSel.effet ?? "couleur") === e.id
                              ? "bg-white text-vert shadow-sm"
                              : "text-vert/55 hover:text-vert"
                          }`}
                        >
                          {e.label}
                        </button>
                      ))}
                    </div>
                  )}
                  {couvertureActive && (
                    <button
                      onClick={() =>
                        onSetCouverture(couvertureUrl === photoSel.url ? null : photoSel.url)
                      }
                      className={`rounded-md px-2 py-1 text-[11px] font-medium transition-all ${
                        couvertureUrl === photoSel.url
                          ? "bg-or text-white"
                          : "bg-or/10 text-or hover:bg-or/20"
                      }`}
                    >
                      ★ Couverture
                    </button>
                  )}
                  <span className="flex-1" />
                  {page.photos.length > 1 && (
                    <button
                      onClick={() => {
                        setSelection(null)
                        onAgrandirPhoto(pageIdx, sel)
                      }}
                      className="rounded-md bg-vert/[0.05] px-2 py-1 text-[11px] font-medium text-vert/70 hover:text-vert"
                    >
                      Agrandir
                    </button>
                  )}
                  {solo &&
                    ((pages[pageIdx - 1] &&
                      pages[pageIdx - 1].photos.length < PHOTOS_PAR_PAGE_MAX) ||
                      (pages[pageIdx + 1] &&
                        pages[pageIdx + 1].photos.length < PHOTOS_PAR_PAGE_MAX)) && (
                      <button
                        onClick={() => {
                          setSelection(null)
                          onReduirePhoto(pageIdx)
                        }}
                        className="rounded-md bg-vert/[0.05] px-2 py-1 text-[11px] font-medium text-vert/70 hover:text-vert"
                      >
                        Réduire
                      </button>
                    )}
                  <button
                    onClick={() => onAjusterPhoto(pageIdx, sel)}
                    className="rounded-md bg-vert/[0.05] px-2 py-1 text-[11px] font-medium text-vert/70 hover:text-vert"
                  >
                    Rogner
                  </button>
                  <button
                    onClick={() => onReplacePhoto(pageIdx, sel)}
                    className="rounded-md bg-vert/[0.05] px-2 py-1 text-[11px] font-medium text-vert/70 hover:text-vert"
                  >
                    Remplacer
                  </button>
                  <button
                    onClick={() => {
                      setSelection(null)
                      onDeletePhoto(pageIdx, sel)
                    }}
                    className="rounded-md bg-erreur/8 px-2 py-1 text-[11px] font-medium text-erreur hover:bg-erreur/15"
                  >
                    Supprimer
                  </button>
                </div>

                {solo && (
                  <input
                    type="text"
                    value={photoSel.description || ""}
                    maxLength={80}
                    placeholder="Légende sous la photo (optionnelle)"
                    onChange={e => onChangeDescription(pageIdx, sel, e.target.value)}
                    className="field !py-2 text-[13px]"
                  />
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
