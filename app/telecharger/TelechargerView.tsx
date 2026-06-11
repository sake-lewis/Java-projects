"use client"

import BloomMark from "@/components/ui/BloomMark"

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
  const jours = joursRestants(pdfExpiresAt)
  const messageWhatsApp = `Voici mon catalogue EVERBLOOM : ${pdfUrl}`
  const partageUrl = `https://wa.me/?text=${encodeURIComponent(messageWhatsApp)}`

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#E8E0D5] px-6 py-16 text-center">
      <BloomMark
        strokeWidth={0.8}
        className="pointer-events-none absolute -right-24 -top-24 h-[420px] w-[420px] text-[#1E4D3A]/[0.05]"
      />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center">
        <BloomMark className="h-12 w-12 text-[#C4956A]" />
        <div className="mt-4 text-lg font-semibold tracking-[0.3em] text-[#1E4D3A]">
          EVERBLOOM
        </div>

        <div className="mt-10 h-px w-12 bg-[#C4956A]" />

        <h1 className="mt-8 text-[1.75rem] font-semibold leading-tight tracking-tight text-[#1E4D3A] sm:text-3xl">
          Votre catalogue est prêt
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-[#1E4D3A]/65">
          « {nomCatalogue} » vous attend. Téléchargez-le ou partagez-le directement par WhatsApp.
        </p>

        <div className="mt-10 flex w-full flex-col gap-3 sm:flex-row">
          <a
            href={pdfUrl}
            download={`${nomCatalogue}.pdf`}
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-2 rounded-md bg-[#1E4D3A] py-4 text-base font-semibold text-[#E8E0D5] shadow-xl transition-all hover:bg-[#1E4D3A]/90 active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Télécharger le PDF
          </a>

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
    </main>
  )
}
