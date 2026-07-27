# EVERBLOOM Catalogues — v3

Outil de production de **catalogues PDF professionnels** pour e-commerçants et
vendeurs, opéré par une seule personne. Le client envoie ses infos et photos
par WhatsApp ; l'opérateur produit le catalogue et livre le PDF.

## En bref

- **3 forfaits** : Basic (500 F · 25 produits · 3 modifs), Standard (750 F · 35 · 6),
  Premium (1 000 F · 50 · 10)
- **10 secteurs d'activité**, chacun avec son ambiance visuelle fixe
  (palette, typographies) × 3 niveaux de mise en page = **30 rendus**
- **Bouton WhatsApp pré-rempli sur chaque fiche produit** du PDF (tous forfaits)
- **Crédits de modification** : 1 modification = 1 crédit, validité 6 mois,
  pack de recharge 5 modifs / 350 F
- **Photos conservées 7 jours** après la génération, puis purgées automatiquement
- **PDF jamais stocké en ligne** : généré à la demande, téléchargé directement,
  nommé d'après l'entreprise du client

## Stack

Next.js 16 · React 19 · TailwindCSS v4 · TypeScript · Drizzle ORM ·
Neon Postgres · Cloudinary (photos + recadrage IA) · Puppeteer + Handlebars ·
Vercel (hébergement + cron)

## Démarrage

Voir **GUIDE_INSTALLATION.md** pour le pas-à-pas complet (Neon, Cloudinary,
variables d'environnement, lancement local, déploiement Vercel).

```bash
npm install
cp .env.example .env.local   # puis remplir les valeurs
npm run db:push              # crée les tables dans Neon
npm run dev                  # http://localhost:3000
```

## Tester le rendu PDF sans base de données

```bash
npx tsx scripts/test-pdf.ts
# → scripts/out/demo-basic.pdf, demo-standard.pdf, demo-premium.pdf
```

## Structure

```
app/
  login/                    Connexion opérateur
  (admin)/
    page.tsx                Tableau de bord (stats, recherche, clients)
    clients/nouveau         Création client (forfait, secteur, WhatsApp)
    clients/[id]            Fiche client (crédits, paiements, catalogues)
    catalogues/[id]         Éditeur de catalogue (produits, photos, PDF)
  api/                      Routes serveur (auth, CRUD, upload, PDF, cron)
lib/
  config.ts                 Règles métier (forfaits, secteurs, validités)
  credits.ts                Débit des crédits de modification
  db/                       Schéma Drizzle + connexion Neon
  cloudinary.ts             Upload, recadrage IA, purge
  pdf/
    ambiances.ts            10 ambiances sectorielles
    templates/              basic.html · standard.html · premium.html
    render.ts               Assemblage Handlebars
    browser.ts              Puppeteer (local + Vercel)
proxy.ts                    Garde d'authentification + CSP
vercel.json                 Cron quotidien de nettoyage (2h UTC)
```
