'use client';

import React from 'react';
import Button from '@/components/ui/Button';
import Link from 'next/link';

interface StartProProps {
  token: string;
}

export default function StartPro({ token }: StartProProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 flex flex-col items-center text-center">
      <header className="mb-12">
        <div className="text-4xl font-bold tracking-tighter mb-2">EVERBLOOM</div>
        <p className="text-xl text-gray-600">Bienvenue sur EVERBLOOM</p>
      </header>

      <main className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border p-8 md:p-12">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">Forfait Pro — 100 photos</h1>
        
        <div className="text-left mb-10">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">Ce qui est inclus :</h2>
          <ul className="space-y-3">
            <li className="flex items-center text-gray-600">
              <span className="mr-3 text-blue-500">✓</span>
              Jusqu'à 100 photos
            </li>
            <li className="flex items-center text-gray-600">
              <span className="mr-3 text-blue-500">✓</span>
              5 thèmes premium
            </li>
            <li className="flex items-center text-gray-600">
              <span className="mr-3 text-blue-500">✓</span>
              Styles visuels avancés
            </li>
            <li className="flex items-center text-gray-600">
              <span className="mr-3 text-blue-500">✓</span>
              PDF haute qualité
            </li>
            <li className="flex items-center text-gray-600">
              <span className="mr-3 text-blue-500">✓</span>
              Partageable sur WhatsApp
            </li>
          </ul>
        </div>

        <Link href={`/create/pro/editor?token=${token}`}>
          <Button className="w-full py-4 text-lg font-semibold">
            Commencer la création →
          </Button>
        </Link>
      </main>
    </div>
  );
}
