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
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#E8E0D5] px-6 py-16">
      <BloomMark
        strokeWidth={0.8}
        className="pointer-events-none absolute -right-24 -top-24 h-[420px] w-[420px] text-[#1E4D3A]/[0.05]"
      />

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center">
        <BloomMark className="h-12 w-12 text-[#C4956A]" />
        <div className="mt-4 text-lg font-semibold tracking-[0.3em] text-[#1E4D3A]">
          EVERBLOOM
        </div>
        <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.2em] text-[#C4956A]">
          Espace administrateur
        </p>

        <form onSubmit={soumettre} className="mt-10 w-full space-y-4">
          <label className="block">
            <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#1E4D3A]/70">
              Mot de passe
            </span>
            <input
              type="password"
              value={motDePasse}
              onChange={e => setMotDePasse(e.target.value)}
              autoFocus
              autoComplete="current-password"
              className="mt-2 w-full rounded-md border border-[#1E4D3A]/20 bg-white px-4 py-3 text-[15px] text-[#1E4D3A] focus:border-[#1E4D3A] focus:outline-none focus:ring-2 focus:ring-[#1E4D3A]/20"
              required
            />
          </label>

          {erreur && (
            <p role="alert" className="rounded-md bg-[#E53E3E]/10 px-3 py-2 text-center text-[13px] text-[#E53E3E]">
              {erreur}
            </p>
          )}

          <button
            type="submit"
            disabled={enCours || motDePasse.length === 0}
            className="w-full rounded-md bg-[#1E4D3A] py-3 text-[15px] font-semibold text-[#E8E0D5] shadow-md transition-all hover:bg-[#1E4D3A]/90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {enCours ? "Connexion…" : "Se connecter"}
          </button>
        </form>
      </div>
    </main>
  )
}
