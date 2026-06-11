"use client"

import { useState } from "react"
import BloomMark from "@/components/ui/BloomMark"
import ChoixStockageModal from "@/components/ChoixStockageModal"

interface Props {
  pdfUrl: string
  nomCatalogue: string
  pdfExpiresAt: number | null
}

function joursRestants(pdfExpiresAt: number | null): number {
  if (!pdfExpiresAt) return 7
  const ms = pdfExpiresAt - Date.now()
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)))
}

export default function TelechargerView({ pdfUrl, nomCatalogue, pdfExpiresAt }: Props) {
  const [modalStockageOuverte, setModalStockageOuverte] = useState(false)
  const jours = joursRestants(pdfExpiresAt)
  const messageWhatsApp = `Voici mon catalogue EVERBLOOM : ${pdfUrl}`
  const partageUrl = `https://wa.me/?text=${encodeURIComponent(messageWhatsApp)}`

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#E8E0D5] px-6 py-16 text-center">
      <BloomMark
        strokeWidth={0.8}
        className="pointer-events-none absolute -right-24 -top-24 h-[420px] w-[420px] text-[#1E4D3A]/[0.05]"
      />

      <div className="animate-fade-up relative z-10 flex w-full max-w-md flex-col items-center">
        <BloomMark className="h-12 w-12 text-or" />
        <div className="wordmark mt-4 text-lg">EVERBLOOM</div>

        <div className="hairline-or mt-10 w-24" />

        <h1 className="display mt-8 text-[32px] text-vert sm:text-4xl">
          Votre catalogue est prêt
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-vert/65">
          « {nomCatalogue} » vous attend. Téléchargez-le ou partagez-le directement par WhatsApp.
        </p>

        <div className="mt-10 flex w-full flex-col gap-3 sm:flex-row">
          <button
            onClick={() => setModalStockageOuverte(true)}
            className="btn-primary focus-ring flex-1 text-base"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Télécharger le PDF
          </button>

          <a
            href={partageUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Partager sur WhatsApp"
            className="flex shrink-0 items-center justify-center gap-2 rounded-md bg-[#25D366] px-5 py-4 text-base font-semibold text-white shadow-xl transition-all hover:bg-[#25D366]/90 active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-11.7 8.38 8.38 0 0 1 3.8.9L21 3z" />
            </svg>
            Partager
          </a>
        </div>

        <p className="mt-8 text-[12px] uppercase tracking-[0.18em] text-[#1E4D3A]/50">
          Disponible {jours > 0 ? `${jours} jour${jours > 1 ? "s" : ""}` : "aujourd'hui seulement"}
        </p>
      </div>

      <ChoixStockageModal
        isOpen={modalStockageOuverte}
        pdfUrl={pdfUrl}
        nomCatalogue={nomCatalogue}
        onClose={() => setModalStockageOuverte(false)}
      />
    </main>
  )
}
