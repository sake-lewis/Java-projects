"use client"

import React, { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import BloomMark from '@/components/ui/BloomMark'

/**
 * Page d'attente après paiement Chariow.
 *
 * Chariow ne connaît pas le token (créé côté serveur par le webhook), il
 * redirige donc le client ici avec son email + le forfait acheté. La page
 * sonde l'API toutes les 2 secondes jusqu'à trouver la session correspondante
 * (laisse le temps au webhook d'arriver), puis redirige automatiquement vers
 * l'éditeur. Au bout de ~60 s sans résultat, on bascule en page d'erreur.
 */
function MerciContent() {
  const router = useRouter()
  const params = useSearchParams()
  const email = params.get('email')
  const forfait = params.get('forfait')

  const [status, setStatus] = useState<'searching' | 'failed'>('searching')
  const [secondes, setSecondes] = useState(0)

  useEffect(() => {
    if (!email || !forfait) {
      router.replace('/error?reason=invalid')
      return
    }

    let annule = false
    const debut = Date.now()
    const TIMEOUT_MS = 60_000

    async function sonder() {
      while (!annule) {
        try {
          const res = await fetch(
            `/api/recent-session?email=${encodeURIComponent(email!)}&forfait=${encodeURIComponent(forfait!)}`,
            { cache: 'no-store' }
          )
          if (res.ok) {
            const data = await res.json()
            if (data.found && data.token) {
              router.replace(`/create/${data.forfait}?token=${data.token}`)
              return
            }
          }
        } catch {
          // Réessaye au tour suivant — pas de log côté client pour rester discret
        }

        const ecoule = Date.now() - debut
        if (ecoule >= TIMEOUT_MS) {
          if (!annule) setStatus('failed')
          return
        }
        setSecondes(Math.floor(ecoule / 1000))
        await new Promise(r => setTimeout(r, 2000))
      }
    }

    sonder()
    return () => { annule = true }
  }, [email, forfait, router])

  // Quand la sonde épuise son temps : Chariow n'a sans doute pas notifié, on
  // bascule sur la page d'erreur dédiée pour proposer de relancer.
  useEffect(() => {
    if (status === 'failed') {
      router.replace('/error?reason=invalid')
    }
  }, [status, router])

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

        <div className="mt-12 h-10 w-10 animate-spin rounded-full border-[3px] border-[#1E4D3A] border-t-transparent" />

        <h1 className="mt-8 text-[1.5rem] font-semibold tracking-tight text-[#1E4D3A] sm:text-2xl">
          Merci pour votre achat
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-[#1E4D3A]/65">
          Nous préparons votre espace de création.<br />
          Vous allez être redirigé dans un instant.
        </p>

        <p className="mt-8 text-[11px] uppercase tracking-[0.2em] text-[#1E4D3A]/40">
          {secondes < 5 ? 'Connexion à votre paiement…' :
           secondes < 20 ? 'Validation en cours…' :
           'Encore quelques secondes…'}
        </p>
      </div>
    </main>
  )
}

export default function MerciPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#E8E0D5]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1E4D3A] border-t-transparent" />
      </div>
    }>
      <MerciContent />
    </Suspense>
  )
}
