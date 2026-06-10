'use client';

import React from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import BloomMark from '@/components/ui/BloomMark';
import { Forfait, FORFAIT_CONFIG } from '@/types';

interface StartForfaitProps {
  forfait: Forfait;
  token: string;
}

/** Contenu éditorial par forfait (positionnement + bénéfices). */
const CONTENU: Record<Forfait, { positionnement: string; tagline: string; features: string[] }> = {
  standard: {
    positionnement: 'Sobre & élégant',
    tagline: 'Une mise en page épurée qui laisse vos photos respirer.',
    features: [
      "Jusqu'à 50 photos",
      '5 thèmes au choix',
      'Mise en page soignée',
      'PDF haute définition',
      'Partage WhatsApp immédiat',
    ],
  },
  pro: {
    positionnement: 'Impressionnant',
    tagline: 'Des compositions avancées pour un album qui marque les esprits.',
    features: [
      "Jusqu'à 100 photos",
      '5 thèmes premium',
      'Compositions avancées',
      'PDF haute définition',
      'Partage WhatsApp immédiat',
    ],
  },
  premium: {
    positionnement: 'Luxueux',
    tagline: 'Le plus grand soin du détail, pour des souvenirs dignes d’un écrin.',
    features: [
      "Jusqu'à 150 photos",
      "5 thèmes d'exception",
      'Finitions luxueuses',
      'PDF ultra haute définition',
      'Partage WhatsApp immédiat',
    ],
  },
};

export default function StartForfait({ forfait, token }: StartForfaitProps) {
  const config = FORFAIT_CONFIG[forfait];
  const { positionnement, tagline, features } = CONTENU[forfait];
  const prix = config.prix.toLocaleString('fr-FR');

  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-hidden bg-[#E8E0D5] px-6 py-16 sm:py-20">
      {/* Filigrane signature : la fleur qui ne fane pas, immense et discrète */}
      <BloomMark
        strokeWidth={0.8}
        className="pointer-events-none absolute -right-24 -top-24 h-[420px] w-[420px] text-[#1E4D3A]/[0.05] sm:h-[560px] sm:w-[560px]"
      />

      <div className="relative z-10 flex w-full max-w-xl flex-col items-center text-center">
        {/* Lockup de marque */}
        <BloomMark className="h-12 w-12 text-[#C4956A]" />
        <div className="mt-4 text-xl font-semibold tracking-[0.32em] text-[#1E4D3A]">
          EVERBLOOM
        </div>

        {/* Eyebrow forfait */}
        <div className="mt-10 text-[11px] font-medium uppercase tracking-[0.24em] text-[#C4956A]">
          Forfait {config.label} · {positionnement}
        </div>

        {/* Thèse de la page : l'écrin pour les souvenirs */}
        <h1 className="mt-4 text-[2rem] font-semibold leading-[1.1] tracking-tight text-[#1E4D3A] sm:text-[2.75rem]">
          Offrez à vos souvenirs
          <br />
          un écrin à leur hauteur.
        </h1>

        <p className="mt-5 max-w-md text-[15px] leading-relaxed text-[#1E4D3A]/65 sm:text-base">
          {tagline}
        </p>

        {/* Liste « inclus » — structurée par des filets laiton, sans puces génériques */}
        <ul className="mt-12 w-full max-w-sm text-left">
          {features.map((feature, i) => (
            <li
              key={feature}
              className={`flex items-center justify-between py-3.5 ${
                i !== 0 ? 'border-t border-[#C4956A]/25' : ''
              }`}
            >
              <span className="text-[15px] text-[#1E4D3A]">{feature}</span>
              <span className="ml-4 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C4956A]" />
            </li>
          ))}
        </ul>

        {/* Prix + appel à l'action */}
        <div className="mt-12 flex items-baseline gap-2">
          <span className="text-4xl font-semibold tracking-tight text-[#1E4D3A]">{prix}</span>
          <span className="text-sm text-[#1E4D3A]/55">FCFA · paiement unique</span>
        </div>

        <Link href={`/create/${forfait}/editor?token=${token}`} className="mt-7 w-full sm:w-auto">
          <Button size="lg" className="w-full sm:w-auto sm:px-12">
            Commencer la création →
          </Button>
        </Link>

        <p className="mt-4 text-[12px] text-[#1E4D3A]/45">
          Disponible 7 jours · aucune inscription requise
        </p>
      </div>
    </main>
  );
}
