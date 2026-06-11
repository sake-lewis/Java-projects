"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import BloomMark from "@/components/ui/BloomMark"
import { Forfait, FORFAIT_CONFIG, StatutSession } from "@/types"

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

function formatDate(ms: number): string {
  return new Date(ms).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const ETIQUETTES_STATUT: Record<StatutSession, string> = {
  paid: "À utiliser",
  claimed: "Réclamée",
  generating: "Génération…",
  ready: "PDF prêt",
  downloaded: "Téléchargé",
  expired: "Expirée",
}

export default function AdminDashboard() {
  const router = useRouter()
  const [sessions, setSessions] = useState<SessionResume[]>([])
  const [chargement, setChargement] = useState(true)
  const [lien, setLien] = useState<LienGenere | null>(null)
  const [generation, setGeneration] = useState<Forfait | null>(null)
  const [copie, setCopie] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  async function chargerSessions() {
    try {
      const res = await fetch("/api/admin/sessions-recentes", { cache: "no-store" })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setSessions(data.sessions)
    } catch {
      // silencieux
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => {
    chargerSessions()
  }, [])

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
      setTimeout(() => setCopie(false), 2000)
    } catch {
      setErreur("Copie impossible — sélectionnez le texte manuellement")
    }
  }

  async function partagerWhatsApp() {
    if (!lien) return
    const message = `Voici votre lien EVERBLOOM (forfait ${FORFAIT_CONFIG[lien.forfait].label}) :\n${lien.url}\n\nIl est utilisable une seule fois.`
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(url, "_blank", "noopener,noreferrer")
  }

  async function seDeconnecter() {
    await fetch("/api/admin/logout", { method: "POST" })
    router.refresh()
  }

  return (
    <main className="min-h-screen bg-[#E8E0D5] pb-20">
      <div className="mx-auto max-w-[560px] px-5 py-8 space-y-8">
        <header className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <BloomMark className="h-9 w-9 text-[#C4956A]" />
            <div>
              <div className="text-[16px] font-semibold tracking-[0.28em] text-[#1E4D3A]">
                EVERBLOOM
              </div>
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#C4956A]">
                Tableau de bord
              </div>
            </div>
          </div>
          <button
            onClick={seDeconnecter}
            className="text-[12px] font-semibold uppercase tracking-wide text-[#1E4D3A]/60 hover:text-[#1E4D3A]"
          >
            Quitter
          </button>
        </header>

        <section className="space-y-4">
          <h2 className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#1E4D3A]/70">
            Générer un lien client
          </h2>
          <div className="grid gap-3">
            {FORFAITS.map(f => (
              <button
                key={f}
                onClick={() => genererLien(f)}
                disabled={generation !== null}
                className="flex items-center justify-between rounded-md border border-[#1E4D3A]/15 bg-white px-4 py-4 text-left shadow-sm transition-all hover:border-[#1E4D3A]/40 active:scale-[0.99] disabled:opacity-50"
              >
                <div>
                  <div className="text-[16px] font-semibold text-[#1E4D3A]">
                    Forfait {FORFAIT_CONFIG[f].label}
                  </div>
                  <div className="text-[12px] text-[#1E4D3A]/60">
                    {FORFAIT_CONFIG[f].photos_max} photos · {FORFAIT_CONFIG[f].prix.toLocaleString("fr-FR")} FCFA
                  </div>
                </div>
                <span className="text-[13px] font-semibold text-[#C4956A]">
                  {generation === f ? "…" : "Générer →"}
                </span>
              </button>
            ))}
          </div>

          {erreur && (
            <p role="alert" className="rounded-md bg-[#E53E3E]/10 px-3 py-2 text-center text-[13px] text-[#E53E3E]">
              {erreur}
            </p>
          )}

          {lien && (
            <div className="rounded-md border border-[#C4956A]/40 bg-[#C4956A]/5 p-4 space-y-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C4956A]">
                Lien {FORFAIT_CONFIG[lien.forfait].label} — usage unique
              </div>
              <div className="break-all rounded bg-white px-3 py-2 text-[13px] font-mono text-[#1E4D3A]">
                {lien.url}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={copier}
                  className="flex-1 rounded-md bg-[#1E4D3A] py-2.5 text-[14px] font-semibold text-[#E8E0D5] hover:bg-[#1E4D3A]/90"
                >
                  {copie ? "Copié ✓" : "Copier"}
                </button>
                <button
                  onClick={partagerWhatsApp}
                  className="flex-1 rounded-md bg-[#25D366] py-2.5 text-[14px] font-semibold text-white hover:bg-[#25D366]/90"
                >
                  WhatsApp
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#1E4D3A]/70">
            PDFs d&apos;instructions Chariow
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {FORFAITS.map(f => (
              <a
                key={f}
                href={`/api/admin/instructions-pdf?forfait=${f}`}
                download={`instructions-${f}.pdf`}
                className="rounded-md border border-[#1E4D3A]/15 bg-white py-3 text-center text-[13px] font-semibold text-[#1E4D3A] hover:border-[#1E4D3A]/40"
              >
                {FORFAIT_CONFIG[f].label}
              </a>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#1E4D3A]/70">
            Sessions récentes
          </h2>
          {chargement ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#1E4D3A] border-t-transparent" />
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-center text-[13px] text-[#1E4D3A]/50 py-6">
              Aucune session pour le moment.
            </p>
          ) : (
            <ul className="space-y-2">
              {sessions.map(s => (
                <li
                  key={s.token}
                  className="flex items-center justify-between rounded-md border border-[#1E4D3A]/10 bg-white px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <div className="truncate text-[14px] font-semibold text-[#1E4D3A]">
                      {s.nom_catalogue || `Forfait ${FORFAIT_CONFIG[s.forfait].label}`}
                    </div>
                    <div className="text-[11px] text-[#1E4D3A]/55">
                      {FORFAIT_CONFIG[s.forfait].label} · {formatDate(s.created_at)}
                    </div>
                  </div>
                  <span className="ml-3 shrink-0 rounded-full bg-[#1E4D3A]/[0.06] px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#1E4D3A]/70">
                    {ETIQUETTES_STATUT[s.statut]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}
