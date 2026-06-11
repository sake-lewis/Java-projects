"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import BloomMark from "@/components/ui/BloomMark"
import { Forfait, FORFAIT_CONFIG, StatutSession } from "@/types"

// Déconnexion automatique après 15 min d'inactivité, avertissement 1 min avant.
const INACTIVITE_LOGOUT_MS = 15 * 60 * 1000
const INACTIVITE_AVERTISSEMENT_MS = 60 * 1000

interface SessionResume {
  token: string
  forfait: Forfait
  statut: StatutSession
  nom_catalogue: string
  created_at: number
  pdf_expires_at: number | null
}

interface LienGenere {
  forfait: Forfait
  url: string
  token: string
}

const FORFAITS: Forfait[] = ["standard", "pro", "premium"]

const ETIQUETTES_STATUT: Record<StatutSession, string> = {
  paid: "À utiliser",
  claimed: "Réclamée",
  generating: "En cours",
  ready: "PDF prêt",
  downloaded: "Téléchargé",
  expired: "Expirée",
}

const COULEURS_STATUT: Record<StatutSession, { dot: string; bg: string; text: string }> = {
  paid:        { dot: "bg-[#C4956A]",      bg: "bg-[#C4956A]/10",      text: "text-[#8B6840]" },
  claimed:     { dot: "bg-[#1E4D3A]",      bg: "bg-[#1E4D3A]/8",       text: "text-[#1E4D3A]" },
  generating:  { dot: "bg-[#6B7280]",      bg: "bg-[#6B7280]/10",      text: "text-[#4B5563]" },
  ready:       { dot: "bg-[#2F855A]",      bg: "bg-[#2F855A]/10",      text: "text-[#216A47]" },
  downloaded:  { dot: "bg-[#1E4D3A]/50",   bg: "bg-[#1E4D3A]/5",       text: "text-[#1E4D3A]/70" },
  expired:     { dot: "bg-[#C53030]",      bg: "bg-[#C53030]/8",       text: "text-[#A02525]" },
}

function formatTempsRelatif(ms: number): string {
  const diff = Date.now() - ms
  const min = Math.floor(diff / 60000)
  if (min < 1) return "à l'instant"
  if (min < 60) return `il y a ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `il y a ${h} h`
  const j = Math.floor(h / 24)
  if (j < 7) return `il y a ${j} j`
  return new Date(ms).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
}

// Détail visuel par forfait : la hiérarchie de prix se traduit par une
// gradation de présence visuelle (Standard sobre → Premium accentué d'or).
const TONS_FORFAIT: Record<
  Forfait,
  { eyebrow: string; border: string; bgHover: string; accent: string }
> = {
  standard: {
    eyebrow: "text-[#1E4D3A]/55",
    border: "border-[#1E4D3A]/12 hover:border-[#1E4D3A]/30",
    bgHover: "hover:bg-[#1E4D3A]/[0.02]",
    accent: "text-[#1E4D3A]/70",
  },
  pro: {
    eyebrow: "text-[#1E4D3A]/70",
    border: "border-[#1E4D3A]/15 hover:border-[#1E4D3A]/40",
    bgHover: "hover:bg-[#1E4D3A]/[0.03]",
    accent: "text-[#1E4D3A]",
  },
  premium: {
    eyebrow: "text-[#C4956A]",
    border: "border-[#C4956A]/30 hover:border-[#C4956A]/60",
    bgHover: "hover:bg-[#C4956A]/[0.04]",
    accent: "text-[#C4956A]",
  },
}

export default function AdminDashboard() {
  const router = useRouter()
  const [sessions, setSessions] = useState<SessionResume[]>([])
  const [chargement, setChargement] = useState(true)
  const [lien, setLien] = useState<LienGenere | null>(null)
  const [generation, setGeneration] = useState<Forfait | null>(null)
  const [copie, setCopie] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [avertissementInactif, setAvertissementInactif] = useState(false)
  const [secondesRestantes, setSecondesRestantes] = useState(INACTIVITE_AVERTISSEMENT_MS / 1000)
  const lastActivityRef = useRef<number>(Date.now())
  // Maintenance — nombre de PDFs ≥ 7 jours à nettoyer.
  const [nettoyageACount, setNettoyageACount] = useState<number | null>(null)
  const [nettoyageEnCours, setNettoyageEnCours] = useState(false)
  const [nettoyageResultat, setNettoyageResultat] = useState<number | null>(null)
  const [nettoyageErreur, setNettoyageErreur] = useState<string | null>(null)

  async function chargerSessions() {
    try {
      const res = await fetch("/api/admin/sessions-recentes", { cache: "no-store" })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setSessions(data.sessions)
    } catch {
      // silencieux — la liste sera vide jusqu'au prochain refresh
    } finally {
      setChargement(false)
    }
  }

  async function chargerNettoyageStatus() {
    try {
      const res = await fetch("/api/admin/nettoyage-status", { cache: "no-store" })
      if (!res.ok) {
        setNettoyageACount(0)
        return
      }
      const data = await res.json()
      setNettoyageACount(typeof data.a_nettoyer === "number" ? data.a_nettoyer : 0)
    } catch {
      setNettoyageACount(0)
    }
  }

  useEffect(() => {
    chargerSessions()
    chargerNettoyageStatus()
  }, [])

  async function forcerNettoyage() {
    if (!nettoyageACount) return
    setNettoyageEnCours(true)
    setNettoyageErreur(null)
    setNettoyageResultat(null)
    try {
      const res = await fetch("/api/admin/forcer-nettoyage", { method: "POST" })
      const data = await res.json()
      if (!res.ok) {
        setNettoyageErreur(data?.error ?? "Échec du nettoyage")
        return
      }
      setNettoyageResultat(typeof data.nettoyees === "number" ? data.nettoyees : 0)
      setNettoyageACount(0)
      // Reflète les statuts mis à jour dans la liste des sessions récentes.
      chargerSessions()
    } catch {
      setNettoyageErreur("Erreur réseau")
    } finally {
      setNettoyageEnCours(false)
    }
  }

  async function genererLien(forfait: Forfait) {
    setGeneration(forfait)
    setErreur(null)
    setCopie(false)
    try {
      const res = await fetch("/api/admin/generer-lien", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forfait }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErreur(data.error || "Échec de la génération")
        return
      }
      setLien({ forfait, url: data.url, token: data.token })
      chargerSessions()
      // Replier la vue vers la card de résultat (mobile : utile si on a scrollé)
      requestAnimationFrame(() => {
        document.getElementById("lien-resultat")?.scrollIntoView({ behavior: "smooth", block: "center" })
      })
    } catch {
      setErreur("Erreur réseau")
    } finally {
      setGeneration(null)
    }
  }

  async function copier() {
    if (!lien) return
    try {
      await navigator.clipboard.writeText(lien.url)
      setCopie(true)
      setTimeout(() => setCopie(false), 1800)
    } catch {
      setErreur("Copie impossible — sélectionnez le lien manuellement.")
    }
  }

  function partagerWhatsApp() {
    if (!lien) return
    const message = `Voici votre lien EVERBLOOM (forfait ${FORFAIT_CONFIG[lien.forfait].label}) :\n${lien.url}\n\nIl est utilisable une seule fois.`
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(url, "_blank", "noopener,noreferrer")
  }

  async function seDeconnecter() {
    await fetch("/api/admin/logout", { method: "POST" })
    router.refresh()
  }

  // Détecteur d'inactivité : les events utilisateur réinitialisent un horloge,
  // un intervalle d'1 s vérifie si on dépasse les seuils. L'avertissement est
  // ignoré par les events (seul "Rester connecté" reprend la session) pour
  // éviter qu'un mouvement de souris involontaire le ferme.
  useEffect(() => {
    if (avertissementInactif) return
    const events = ["mousedown", "mousemove", "keydown", "touchstart", "scroll", "click"] as const
    const onActivity = () => {
      lastActivityRef.current = Date.now()
    }
    for (const e of events) window.addEventListener(e, onActivity, { passive: true })
    return () => {
      for (const e of events) window.removeEventListener(e, onActivity)
    }
  }, [avertissementInactif])

  useEffect(() => {
    const interval = setInterval(() => {
      const ecoule = Date.now() - lastActivityRef.current
      const restant = INACTIVITE_LOGOUT_MS - ecoule
      if (restant <= 0) {
        // Déconnexion en silence : le serveur ignore déjà le cookie expiré, mais
        // on appelle logout explicitement pour effacer le cookie côté navigateur.
        fetch("/api/admin/logout", { method: "POST" }).finally(() => {
          router.refresh()
        })
      } else if (restant <= INACTIVITE_AVERTISSEMENT_MS) {
        setAvertissementInactif(true)
        setSecondesRestantes(Math.max(0, Math.ceil(restant / 1000)))
      } else if (avertissementInactif) {
        setAvertissementInactif(false)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [router, avertissementInactif])

  async function prolongerSession() {
    // Reset côté client + rafraîchit le cookie côté serveur via /api/admin/ping.
    lastActivityRef.current = Date.now()
    setAvertissementInactif(false)
    try {
      const res = await fetch("/api/admin/ping", { method: "POST" })
      if (!res.ok) {
        // Cookie déjà expiré côté serveur : on déconnecte côté UI pour rester cohérent.
        router.refresh()
      }
    } catch {
      // silencieux — le prochain fetch admin échouera de toute façon si le cookie est mort
    }
  }

  const compteurAujourdhui = useMemo(() => {
    const debutJour = new Date()
    debutJour.setHours(0, 0, 0, 0)
    return sessions.filter(s => s.created_at >= debutJour.getTime()).length
  }, [sessions])

  return (
    <main
      className="relative min-h-screen bg-[#E8E0D5] pb-24"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      {/* Modal d'inactivité — apparaît à 1 min avant la déconnexion auto */}
      {avertissementInactif && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="inactif-titre"
          aria-describedby="inactif-desc"
          className="fixed inset-0 z-[200] flex items-center justify-center bg-[#1E1E1E]/55 px-5 backdrop-blur-sm"
        >
          <div className="animate-in fade-in zoom-in-95 w-full max-w-[360px] rounded-2xl border border-[#C4956A]/30 bg-[#E8E0D5] p-6 text-center shadow-[0_8px_28px_rgba(0,0,0,0.18)]">
            <BloomMark className="mx-auto h-9 w-9 text-[#C4956A]" />
            <h2
              id="inactif-titre"
              className="mt-4 text-[18px] font-semibold tracking-tight text-[#1E4D3A]"
            >
              Vous êtes inactif
            </h2>
            <p
              id="inactif-desc"
              className="mt-2 text-[13px] leading-relaxed text-[#1E4D3A]/65"
            >
              Pour votre sécurité, vous serez déconnecté dans
              <br />
              <span className="mt-2 inline-block text-[28px] font-semibold tabular-nums text-[#C4956A]">
                {secondesRestantes}
              </span>
              <br />
              seconde{secondesRestantes > 1 ? "s" : ""}.
            </p>

            <div className="mt-5 space-y-2">
              <button
                onClick={prolongerSession}
                autoFocus
                className="w-full rounded-lg bg-[#1E4D3A] py-3 text-[14px] font-semibold text-[#E8E0D5] shadow-[0_1px_2px_rgba(30,77,58,0.18),0_4px_12px_rgba(30,77,58,0.12)] transition-all hover:bg-[#1E4D3A]/92 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1E4D3A]/20"
              >
                Rester connecté
              </button>
              <button
                onClick={seDeconnecter}
                className="w-full rounded-lg border border-[#1E4D3A]/15 bg-transparent py-2.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#1E4D3A]/65 transition-colors hover:bg-[#1E4D3A]/[0.04] hover:text-[#1E4D3A]"
              >
                Se déconnecter maintenant
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filigranes décoratifs (très discrets) */}
      <BloomMark
        strokeWidth={0.7}
        className="pointer-events-none fixed -right-32 -top-32 z-0 h-[420px] w-[420px] text-[#1E4D3A]/[0.035]"
      />

      {/* Header sticky */}
      <header className="sticky top-0 z-30 border-b border-[#1E4D3A]/8 bg-[#E8E0D5]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-[640px] items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <BloomMark className="h-7 w-7 text-[#C4956A]" />
            <div className="flex flex-col leading-none">
              <span className="text-[13px] font-semibold tracking-[0.26em] text-[#1E4D3A]">
                EVERBLOOM
              </span>
              <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.22em] text-[#C4956A]">
                Administration
              </span>
            </div>
          </div>
          <button
            onClick={seDeconnecter}
            className="rounded-md px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#1E4D3A]/55 transition-colors hover:bg-[#1E4D3A]/5 hover:text-[#1E4D3A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E4D3A]/20"
            aria-label="Se déconnecter"
          >
            Quitter
          </button>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-[640px] px-5 py-8 space-y-12">

        {/* HERO — action primaire de la page */}
        <section aria-labelledby="hero-titre" className="space-y-5">
          <div className="space-y-2">
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#C4956A]">
              Confirmer un paiement
            </div>
            <h1
              id="hero-titre"
              className="text-[28px] font-semibold leading-[1.15] tracking-tight text-[#1E4D3A]"
            >
              Générer un lien<br />pour votre client
            </h1>
            <p className="max-w-[44ch] text-[14px] leading-relaxed text-[#1E4D3A]/65">
              Choisissez le forfait correspondant au paiement reçu.
              Le lien est unique et n&apos;ouvre que ce forfait.
            </p>
            {compteurAujourdhui > 0 && (
              <div className="inline-flex items-center gap-2 pt-1 text-[11px] font-medium uppercase tracking-[0.14em] text-[#1E4D3A]/45">
                <span className="h-1 w-1 rounded-full bg-[#C4956A]" />
                {compteurAujourdhui} lien{compteurAujourdhui > 1 ? "s" : ""} aujourd&apos;hui
              </div>
            )}
          </div>

          <div className="space-y-3">
            {FORFAITS.map(f => {
              const config = FORFAIT_CONFIG[f]
              const ton = TONS_FORFAIT[f]
              const enChargement = generation === f
              const desactive = generation !== null && !enChargement
              return (
                <button
                  key={f}
                  onClick={() => genererLien(f)}
                  disabled={generation !== null}
                  className={`group relative flex w-full items-center gap-4 rounded-xl border bg-white px-5 py-4 text-left shadow-[0_1px_2px_rgba(30,77,58,0.04)] transition-all duration-200 ${ton.border} ${ton.bgHover} hover:shadow-[0_2px_4px_rgba(30,77,58,0.06),0_8px_20px_rgba(30,77,58,0.05)] active:scale-[0.995] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1E4D3A]/15 ${
                    desactive ? "opacity-40 cursor-not-allowed" : ""
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${ton.eyebrow}`}>
                      Forfait
                    </div>
                    <div className="mt-0.5 flex items-baseline gap-2">
                      <span className="text-[18px] font-semibold leading-tight text-[#1E4D3A]">
                        {config.label}
                      </span>
                      {f === "premium" && (
                        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#C4956A]">
                          · Le plus complet
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5 flex items-center gap-2 text-[12px] text-[#1E4D3A]/55">
                      <span className="font-semibold text-[#1E4D3A]/70">
                        {config.prix.toLocaleString("fr-FR")} FCFA
                      </span>
                      <span aria-hidden>·</span>
                      <span>{config.pages_max} pages</span>
                      <span aria-hidden>·</span>
                      <span>{config.styles_disponibles.length}/10 styles</span>
                    </div>
                  </div>

                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all ${ton.accent} ${
                      f === "premium"
                        ? "bg-[#C4956A]/8 group-hover:bg-[#C4956A]/15"
                        : "bg-[#1E4D3A]/[0.04] group-hover:bg-[#1E4D3A]/[0.08]"
                    } group-hover:translate-x-0.5`}
                    aria-hidden
                  >
                    {enChargement ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M13 5l7 7-7 7" />
                      </svg>
                    )}
                  </span>
                </button>
              )
            })}
          </div>

          {erreur && (
            <p
              role="alert"
              className="animate-in fade-in slide-in-from-top-1 rounded-lg bg-[#C53030]/8 px-4 py-2.5 text-center text-[13px] font-medium text-[#C53030]"
            >
              {erreur}
            </p>
          )}
        </section>

        {/* RÉSULTAT — apparaît à la génération */}
        {lien && (
          <section
            id="lien-resultat"
            aria-live="polite"
            className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-4 rounded-2xl border border-[#C4956A]/35 bg-gradient-to-b from-[#C4956A]/[0.06] to-transparent p-5 shadow-[0_1px_2px_rgba(196,149,106,0.08),0_12px_32px_rgba(196,149,106,0.10)]"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#C4956A]/15 text-[#C4956A]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#C4956A]">
                    Lien {FORFAIT_CONFIG[lien.forfait].label} · Usage unique
                  </div>
                </div>
              </div>
              <button
                onClick={() => setLien(null)}
                aria-label="Fermer"
                className="rounded-full p-1 text-[#1E4D3A]/40 transition-colors hover:bg-[#1E4D3A]/5 hover:text-[#1E4D3A]/70"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="break-all rounded-lg border border-[#1E4D3A]/8 bg-white px-3.5 py-3 font-mono text-[13px] leading-relaxed text-[#1E4D3A]/85">
              {lien.url}
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={copier}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#1E4D3A] py-3 text-[14px] font-semibold text-[#E8E0D5] shadow-[0_1px_2px_rgba(30,77,58,0.18),0_4px_12px_rgba(30,77,58,0.12)] transition-all hover:bg-[#1E4D3A]/92 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1E4D3A]/20"
              >
                {copie ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Copié
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    Copier le lien
                  </>
                )}
              </button>
              <button
                onClick={partagerWhatsApp}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#25D366] py-3 text-[14px] font-semibold text-white shadow-[0_1px_2px_rgba(37,211,102,0.2),0_4px_12px_rgba(37,211,102,0.14)] transition-all hover:bg-[#22C55E] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#25D366]/25"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-11.7 8.38 8.38 0 0 1 3.8.9L21 3z" />
                </svg>
                WhatsApp
              </button>
            </div>

            {/* Ouvre l'éditeur directement — utile pour tester un forfait sans
                passer par le copier-coller. Le lien reste à usage unique. */}
            <a
              href={lien.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#1E4D3A]/20 bg-white py-2.5 text-[13px] font-semibold text-[#1E4D3A] transition-all hover:border-[#1E4D3A]/40 hover:bg-[#1E4D3A]/[0.03] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1E4D3A]/15"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              Tester l&apos;éditeur (nouvel onglet)
            </a>

            <p className="text-center text-[11px] uppercase tracking-[0.16em] text-[#1E4D3A]/45">
              Envoyez-le au client — il ne fonctionne qu&apos;une seule fois
            </p>
          </section>
        )}

        {/* UTILITAIRE — PDFs Chariow */}
        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#1E4D3A]/60">
              PDFs d&apos;instructions Chariow
            </h2>
            <span className="text-[10px] uppercase tracking-[0.16em] text-[#1E4D3A]/35">
              À uploader une fois
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {FORFAITS.map(f => (
              <a
                key={f}
                href={`/api/admin/instructions-pdf?forfait=${f}`}
                download={`everbloom-instructions-${f}.pdf`}
                className="group flex items-center justify-center gap-1.5 rounded-lg border border-[#1E4D3A]/10 bg-white py-2.5 text-[13px] font-semibold text-[#1E4D3A] transition-all hover:border-[#1E4D3A]/30 hover:bg-[#1E4D3A]/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E4D3A]/20"
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="opacity-50 transition-opacity group-hover:opacity-90"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                {FORFAIT_CONFIG[f].label}
              </a>
            ))}
          </div>
        </section>

        {/* MAINTENANCE — nettoyage manuel des PDFs expirés */}
        <section className="space-y-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#1E4D3A]/60">
            Maintenance
          </h2>
          {(() => {
            const inactif = !nettoyageACount
            const hasResult = nettoyageResultat !== null && nettoyageResultat > 0
            return (
              <div
                className={`rounded-xl border px-4 py-4 transition-colors ${
                  inactif
                    ? "border-[#1E4D3A]/8 bg-white"
                    : "border-[#C4956A]/40 bg-[#C4956A]/[0.06]"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[14px] font-semibold text-[#1E4D3A]">
                      Nettoyer les PDFs expirés
                    </div>
                    <div className="mt-0.5 text-[12px] text-[#1E4D3A]/55">
                      {nettoyageACount === null
                        ? "Vérification…"
                        : nettoyageACount === 0
                        ? "Aucun PDF de plus de 7 jours."
                        : `${nettoyageACount} PDF${nettoyageACount > 1 ? "s" : ""} en attente de suppression.`}
                    </div>
                  </div>
                  <button
                    onClick={forcerNettoyage}
                    disabled={inactif || nettoyageEnCours}
                    className={`shrink-0 inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-[13px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-4 ${
                      inactif
                        ? "bg-[#1E4D3A]/8 text-[#1E4D3A]/40 cursor-not-allowed"
                        : "bg-[#C4956A] text-white shadow-[0_1px_2px_rgba(196,149,106,0.25),0_4px_12px_rgba(196,149,106,0.18)] hover:bg-[#B07E55] active:scale-[0.98] focus-visible:ring-[#C4956A]/30"
                    }`}
                  >
                    {nettoyageEnCours ? (
                      <>
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Suppression…
                      </>
                    ) : (
                      <>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <line x1="10" y1="11" x2="10" y2="17" />
                          <line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                        Supprimer
                      </>
                    )}
                  </button>
                </div>

                {hasResult && (
                  <p className="mt-3 rounded-md bg-[#2F855A]/10 px-3 py-2 text-center text-[12px] font-medium text-[#216A47]">
                    {nettoyageResultat} PDF{nettoyageResultat! > 1 ? "s" : ""} supprimé{nettoyageResultat! > 1 ? "s" : ""} de Cloudinary.
                  </p>
                )}
                {nettoyageErreur && (
                  <p className="mt-3 rounded-md bg-[#C53030]/8 px-3 py-2 text-center text-[12px] font-medium text-[#C53030]">
                    {nettoyageErreur}
                  </p>
                )}

                <p className="mt-3 text-[11px] leading-relaxed text-[#1E4D3A]/40">
                  Le cron Vercel s&apos;exécute déjà chaque nuit. Ce bouton sert au cas où vous souhaitez forcer le nettoyage immédiatement.
                </p>
              </div>
            )
          })()}
        </section>

        {/* SESSIONS RÉCENTES */}
        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#1E4D3A]/60">
              Sessions récentes
            </h2>
            {!chargement && sessions.length > 0 && (
              <span className="text-[10px] uppercase tracking-[0.16em] text-[#1E4D3A]/35">
                {sessions.length} dernière{sessions.length > 1 ? "s" : ""}
              </span>
            )}
          </div>

          {chargement ? (
            <ul className="space-y-2" aria-hidden>
              {[0, 1, 2].map(i => (
                <li
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-[#1E4D3A]/8 bg-white px-3.5 py-3"
                >
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-1/2 animate-pulse rounded bg-[#1E4D3A]/8" />
                    <div className="h-2.5 w-1/3 animate-pulse rounded bg-[#1E4D3A]/5" />
                  </div>
                  <div className="ml-3 h-5 w-14 animate-pulse rounded-full bg-[#1E4D3A]/8" />
                </li>
              ))}
            </ul>
          ) : sessions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#1E4D3A]/15 bg-white/40 px-5 py-10 text-center">
              <BloomMark className="mx-auto h-8 w-8 text-[#1E4D3A]/20" />
              <p className="mt-3 text-[13px] text-[#1E4D3A]/55">
                Aucune session pour le moment.<br />
                <span className="text-[#1E4D3A]/40">Les liens générés apparaîtront ici.</span>
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {sessions.map(s => {
                const couleurs = COULEURS_STATUT[s.statut]
                return (
                  <li
                    key={s.token}
                    className="flex items-center justify-between gap-3 rounded-lg border border-[#1E4D3A]/8 bg-white px-3.5 py-3 transition-colors hover:border-[#1E4D3A]/15"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[14px] font-semibold text-[#1E4D3A]">
                        {s.nom_catalogue || (
                          <span className="text-[#1E4D3A]/55">
                            Lien {FORFAIT_CONFIG[s.forfait].label} en attente
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[#1E4D3A]/50">
                        <span className="font-medium uppercase tracking-wide">
                          {FORFAIT_CONFIG[s.forfait].label}
                        </span>
                        <span aria-hidden>·</span>
                        <span>{formatTempsRelatif(s.created_at)}</span>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 inline-flex items-center gap-1.5 rounded-full ${couleurs.bg} px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${couleurs.text}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${couleurs.dot}`} aria-hidden />
                      {ETIQUETTES_STATUT[s.statut]}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}
