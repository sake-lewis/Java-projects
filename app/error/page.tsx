"use client"

import React, { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function ErrorContent() {
  const searchParams = useSearchParams()
  const reason = searchParams.get('reason') as 'invalid' | 'expired' | 'used' | null

  const messages = {
    invalid: {
      titre: "Lien invalide",
      texte: "Ce lien de création n'est pas valide. Vérifiez que vous avez bien copié le lien reçu après votre paiement."
    },
    expired: {
      titre: "Lien expiré",
      texte: "Votre catalogue n'est plus disponible. Les catalogues sont accessibles pendant 7 jours après génération."
    },
    used: {
      titre: "Session déjà utilisée",
      texte: "Ce lien a déjà été utilisé pour créer un catalogue. Pour créer un nouveau catalogue, effectuez un nouveau paiement."
    },
    default: {
      titre: "Une erreur est survenue",
      texte: "Impossible d'accéder à votre catalogue. Veuillez réessayer ou effectuer un nouveau paiement."
    }
  }

  const { titre, texte } = messages[reason as keyof typeof messages] || messages.default

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#E8E0D5] px-6 py-12 text-center">
      <header className="mb-12">
        <div 
          className="text-3xl font-bold tracking-[0.2em] text-[#1E4D3A]"
          style={{ fontFamily: 'var(--font-cinzel), serif' }}
        >
          EVERBLOOM
        </div>
      </header>

      <div className="h-px w-[60px] bg-[#C4956A] mb-8"></div>

      <main className="max-w-[400px] space-y-6">
        <h1 
          className="text-3xl font-semibold text-[#1E4D3A]"
          style={{ fontFamily: 'var(--font-cormorant), serif' }}
        >
          {titre}
        </h1>
        <p 
          className="text-[15px] font-light leading-relaxed text-[#555555]"
          style={{ fontFamily: 'var(--font-lato), sans-serif' }}
        >
          {texte}
        </p>

        <div className="pt-8 space-y-4">
          <Link
            href={process.env.NEXT_PUBLIC_CHARIOW_BOUTIQUE_URL || "#"}
            className="inline-block w-full rounded-md bg-[#1E4D3A] px-8 py-4 text-[17px] font-semibold text-[#E8E0D5] shadow-xl transition-all hover:bg-[#1E4D3A]/90 hover:scale-[1.02] active:scale-95"
            style={{ fontFamily: 'var(--font-cormorant), serif' }}
          >
            Accéder à la boutique →
          </Link>
          <p 
            className="text-[12px] font-light text-[#888888]"
            style={{ fontFamily: 'var(--font-lato), sans-serif' }}
          >
            Choisissez un forfait et créez votre catalogue
          </p>
        </div>
      </main>
    </div>
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
