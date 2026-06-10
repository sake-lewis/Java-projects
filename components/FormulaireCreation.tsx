"use client"

import React from 'react'

interface FormulaireCreationProps {
  nomCatalogue: string
  description: string
  onNomChange: (value: string) => void
  onDescriptionChange: (value: string) => void
}

export default function FormulaireCreation({
  nomCatalogue,
  description,
  onNomChange,
  onDescriptionChange
}: FormulaireCreationProps) {
  const isNomInvalide = nomCatalogue.length > 0 && nomCatalogue.length < 3

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="flex justify-between items-end">
          <label 
            htmlFor="nom-catalogue" 
            className="text-base font-semibold text-[#1E4D3A]"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            Nom du catalogue
          </label>
          <span className="text-[12px] font-light text-[#C4956A]" style={{ fontFamily: 'var(--font-sans)' }}>
            {nomCatalogue.length}/60
          </span>
        </div>
        <input
          id="nom-catalogue"
          type="text"
          maxLength={60}
          value={nomCatalogue}
          onChange={(e) => onNomChange(e.target.value)}
          placeholder="Ex: Mariage de Jean & Marie"
          className={`w-full rounded-md border bg-[#F5F0EA] px-4 py-3 text-[15px] font-light text-[#1E4D3A] outline-none transition-all placeholder:text-[#1E4D3A]/30 ${
            isNomInvalide ? 'border-[#E53E3E]' : 'border-[#C4956A]/40 focus:border-[#1E4D3A]'
          }`}
          style={{ fontFamily: 'var(--font-sans)' }}
        />
        {isNomInvalide && (
          <p className="text-[12px] font-light text-[#E53E3E]" style={{ fontFamily: 'var(--font-sans)' }}>
            Le nom doit contenir au moins 3 caractères
          </p>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-end">
          <label 
            htmlFor="description" 
            className="text-base font-semibold text-[#1E4D3A]"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            Description
          </label>
          <span className="text-[12px] font-light text-[#C4956A]" style={{ fontFamily: 'var(--font-sans)' }}>
            {description.length}/200
          </span>
        </div>
        <textarea
          id="description"
          maxLength={200}
          rows={3}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Décrivez ce moment en quelques mots..."
          className="w-full resize-none rounded-md border border-[#C4956A]/40 bg-[#F5F0EA] px-4 py-3 text-[15px] font-light text-[#1E4D3A] outline-none transition-all placeholder:text-[#1E4D3A]/30 focus:border-[#1E4D3A]"
          style={{ fontFamily: 'var(--font-sans)' }}
        />
      </div>
    </div>
  )
}
