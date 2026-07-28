-- ============================================================
-- EVERBLOOM — colonnes des couleurs de couverture
-- À coller dans l'éditeur SQL de Neon (console.neon.tech →
-- ton projet → SQL Editor), puis « Run ».
-- Sans risque : ajoute 4 colonnes vides, ne touche à rien d'autre.
-- ============================================================

ALTER TABLE "catalogues" ADD COLUMN IF NOT EXISTS "couv_fond"  text;
ALTER TABLE "catalogues" ADD COLUMN IF NOT EXISTS "couv_encre" text;
ALTER TABLE "catalogues" ADD COLUMN IF NOT EXISTS "fin_fond"   text;
ALTER TABLE "catalogues" ADD COLUMN IF NOT EXISTS "fin_encre"  text;
