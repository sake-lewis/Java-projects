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
      <div className="space-y-2">
        <div className="flex items-end justify-between">
          <label htmlFor="nom-catalogue" className="text-[15px] font-semibold text-vert">
            Nom du catalogue
          </label>
          <span className="text-[12px] tabular-nums text-vert/40">
            {nomCatalogue.length}/60
          </span>
        </div>
        <input
          id="nom-catalogue"
          type="text"
          maxLength={60}
          value={nomCatalogue}
          onChange={(e) => onNomChange(e.target.value)}
          placeholder="Ex : Mariage de Jean & Marie"
          className={`field ${isNomInvalide ? 'border-erreur/50' : ''}`}
        />
        {isNomInvalide && (
          <p className="text-[12px] text-erreur">
            Le nom doit contenir au moins 3 caractères
          </p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-end justify-between">
          <label htmlFor="description" className="text-[15px] font-semibold text-vert">
            Description
          </label>
          <span className="text-[12px] tabular-nums text-vert/40">
            {description.length}/200
          </span>
        </div>
        <textarea
          id="description"
          maxLength={200}
          rows={3}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Décrivez ce moment en quelques mots…"
          className="field resize-none"
        />
      </div>
    </div>
  )
}
