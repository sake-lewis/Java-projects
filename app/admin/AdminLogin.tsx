"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import BloomMark from "@/components/ui/BloomMark"

export default function AdminLogin() {
  const router = useRouter()
  const [motDePasse, setMotDePasse] = useState("")
  const [erreur, setErreur] = useState<string | null>(null)
  const [enCours, setEnCours] = useState(false)

  async function soumettre(e: React.FormEvent) {
    e.preventDefault()
    setEnCours(true)
    setErreur(null)
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mot_de_passe: motDePasse }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setErreur(data.error || "Connexion impossible")
        return
      }
      router.refresh()
    } catch {
      setErreur("Erreur réseau")
    } finally {
      setEnCours(false)
    }
  }

  return (
    <main
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#E8E0D5] px-6 py-16"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      {/* Filigrane décoratif — léger, contraste minimum pour ne pas concurrencer le contenu. */}
      <BloomMark
        strokeWidth={0.7}
        className="pointer-events-none absolute -right-32 -top-32 h-[480px] w-[480px] text-[#1E4D3A]/[0.045]"
      />
      <BloomMark
        strokeWidth={0.7}
        className="pointer-events-none absolute -left-28 -bottom-28 h-[360px] w-[360px] text-[#C4956A]/[0.06]"
      />

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center">
        <BloomMark className="h-14 w-14 text-[#C4956A]" />
        <div className="mt-4 text-[15px] font-semibold tracking-[0.34em] text-[#1E4D3A]">
          EVERBLOOM
        </div>
        <div className="mt-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#C4956A]">
          Espace administrateur
        </div>

        <div className="mt-12 w-full rounded-2xl border border-[#1E4D3A]/10 bg-white/80 p-6 shadow-[0_1px_2px_rgba(30,77,58,0.04),0_8px_24px_rgba(30,77,58,0.06)] backdrop-blur-sm">
          <form onSubmit={soumettre} className="space-y-4">
            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1E4D3A]/65">
                Mot de passe
              </span>
              <input
                type="password"
                value={motDePasse}
                onChange={e => setMotDePasse(e.target.value)}
                autoFocus
                autoComplete="current-password"
                aria-invalid={!!erreur}
                className="mt-2 w-full rounded-lg border border-[#1E4D3A]/15 bg-white px-4 py-3 text-[15px] text-[#1E4D3A] placeholder:text-[#1E4D3A]/30 transition-all focus:border-[#1E4D3A]/50 focus:outline-none focus:ring-4 focus:ring-[#1E4D3A]/10"
                required
              />
            </label>

            {erreur && (
              <p
                role="alert"
                className="animate-in fade-in slide-in-from-top-1 rounded-lg bg-[#E53E3E]/8 px-3 py-2 text-center text-[13px] font-medium text-[#C53030]"
              >
                {erreur}
              </p>
            )}

            <button
              type="submit"
              disabled={enCours || motDePasse.length === 0}
              className="group relative flex w-full items-center justify-center gap-2 rounded-lg bg-[#1E4D3A] py-3 text-[15px] font-semibold text-[#E8E0D5] shadow-[0_1px_2px_rgba(30,77,58,0.2),0_4px_12px_rgba(30,77,58,0.15)] transition-all hover:bg-[#1E4D3A]/92 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1E4D3A]/20"
            >
              {enCours ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#E8E0D5]/40 border-t-[#E8E0D5]" />
                  Connexion…
                </>
              ) : (
                <>
                  Se connecter
                  <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
                </>
              )}
            </button>
          </form>
        </div>

        <p className="mt-8 text-center text-[11px] uppercase tracking-[0.18em] text-[#1E4D3A]/40">
          Accès réservé · Catalogues qui ne fanent pas
        </p>
      </div>
    </main>
  )
}
