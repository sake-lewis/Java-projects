"use client"

import React, { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import BloomMark from '@/components/ui/BloomMark'

function ErrorContent() {
  const searchParams = useSearchParams()
  const reason = searchParams.get('reason') as 'invalid' | 'expired' | 'used' | null

  // Voix de l'interface : on dit ce qui s'est passé et comment repartir,
  // sans s'excuser ni rester vague (principe frontend-design).
  const messages = {
    invalid: {
      titre: "Ce lien ne mène à rien",
      texte: "Le lien ouvert n'est pas reconnu. Reprenez celui reçu juste après votre paiement, ou relancez un forfait depuis la boutique.",
      action: "Voir les forfaits",
    },
    expired: {
      titre: "Cette floraison s'est refermée",
      texte: "Un catalogue reste disponible 7 jours après sa création. Au-delà, il est retiré. Recréez le vôtre en quelques minutes.",
      action: "Créer un nouveau catalogue",
    },
    used: {
      titre: "Ce lien a déjà servi",
      texte: "Il a déjà donné naissance à un catalogue. Pour en composer un autre, choisissez un nouveau forfait.",
      action: "Choisir un forfait",
    },
    default: {
      titre: "Un imprévu s'est glissé ici",
      texte: "Impossible d'ouvrir votre catalogue pour le moment. Réessayez, ou repartez d'un nouveau forfait depuis la boutique.",
      action: "Aller à la boutique",
    },
  }

  const { titre, texte, action } = messages[reason as keyof typeof messages] || messages.default

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#E8E0D5] px-6 py-16 text-center">
      <BloomMark
        strokeWidth={0.8}
        className="pointer-events-none absolute -bottom-28 -left-24 h-[380px] w-[380px] text-[#1E4D3A]/[0.05]"
      />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center">
        <BloomMark className="h-10 w-10 text-[#C4956A]/70" />
        <div className="mt-3 text-base font-semibold tracking-[0.3em] text-[#1E4D3A]/80">
          EVERBLOOM
        </div>

        <div className="mt-10 h-px w-12 bg-[#C4956A]" />

        <h1 className="mt-8 text-[1.75rem] font-semibold leading-tight tracking-tight text-[#1E4D3A] sm:text-3xl">
          {titre}
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-[#1E4D3A]/65">
          {texte}
        </p>

        <Link
          href={process.env.NEXT_PUBLIC_CHARIOW_BOUTIQUE_URL || "#"}
          className="mt-10 inline-flex w-full items-center justify-center rounded-md bg-[#1E4D3A] px-8 py-4 text-base font-semibold text-[#E8E0D5] shadow-lg transition-all hover:bg-[#1E4D3A]/90 hover:scale-[1.02] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E4D3A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#E8E0D5] sm:w-auto sm:px-10"
        >
          {action} →
        </Link>
      </div>
    </main>
  )
}

export default function ErrorPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#E8E0D5]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1E4D3A] border-t-transparent"></div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  )
}
