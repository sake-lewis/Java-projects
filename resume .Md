C'est quoi

Un service web qui permet à un client africain de créer un catalogue photo PDF à partir de ses photos d'événements (mariage, anniversaire, deuil, naissance, remise de diplôme).



Flux utilisateur

Publicité Facebook

&#x20;       ↓

Page Systeme.io (vidéo + liens de paiement)

&#x20;       ↓

Client paie sur Chariow (MTN MoMo / Orange Money)

&#x20;       ↓

Chariow envoie Pulse → /api/webhook-chariow

→ Backend crée un token unique dans Firestore

→ Chariow redirige vers /create/\[forfait]?token=xxx

&#x20;       ↓

Page d'accueil du forfait (start)

→ Présentation EVERBLOOM + features du forfait

→ Bouton "Commencer la création"

&#x20;       ↓

Page de création (editor)

→ Saisie nom + description

→ Choix du thème (5 thèmes)

→ Upload photos une par une (recadrage 9:16)

→ Bouton "Générer mon catalogue PDF"

&#x20;       ↓

Génération PDF côté serveur (Puppeteer)

→ Template HTML + photos injectées via Handlebars

→ PDF stocké dans Firebase Storage (7 jours)

&#x20;       ↓

Client télécharge le PDF

→ Partageable sur WhatsApp

→ En fin de PDF : lien boutique Chariow pour recommander



Forfaits

ForfaitPrixPhotosStylesStandard3 000 FCFA505 thèmes sobresPro5 000 FCFA1005 thèmes avancésPremium10 000 FCFA1505 thèmes luxueux



5 thèmes (par forfait)

StyleThème1Enfance / Naissance2Mariage3Deuil / Funérailles4Anniversaire5Événement solennel / Fêtes



Stack technique



Frontend : Next.js 14, TailwindCSS

Backend : Next.js API Routes, Node.js

Base de données : Firebase Firestore

Stockage PDF : Firebase Storage

Photos : Cloudinary

Génération PDF : Puppeteer + Handlebars

Paiement : Chariow (externe, MTN MoMo / Orange Money)

Déploiement : Vercel





Modèle de données (Firestore)

sessions/{token}

&#x20; ├── token            ← identifiant unique

&#x20; ├── forfait          ← standard | pro | premium

&#x20; ├── email            ← email du client

&#x20; ├── statut           ← paid | generating | ready | downloaded | expired

&#x20; ├── nom\_catalogue    ← saisi par le client

&#x20; ├── description      ← optionnelle

&#x20; ├── style\_choisi     ← 1 à 5

&#x20; ├── photos           ← URLs Cloudinary

&#x20; ├── pdf\_url          ← URL signée Firebase Storage

&#x20; ├── pdf\_hash         ← hash SHA256 du PDF

&#x20; ├── created\_at       ← timestamp création

&#x20; ├── downloaded\_at    ← timestamp téléchargement

&#x20; ├── pdf\_expires\_at   ← created\_at + 7 jours

&#x20; └── session\_expires\_at



Sécurité



Token unique par paiement — impossible d'accéder sans avoir payé

PDF disponible 7 jours puis supprimé automatiquement

Photos Cloudinary supprimées après génération du PDF

Cron job toutes les nuits à 2h pour nettoyer les sessions expirées





Pages de l'application

/create/\[forfait]              ← vérifie le token → redirige

/create/\[forfait]/start        ← accueil du forfait

/create/\[forfait]/editor       ← création du catalogue

/error                         ← token invalide ou expiré



Où en est le projet



✅ Structure complète générée par Gemini

✅ 15 templates PDF documentés

✅ Backend complet

✅ Frontend complet

⏳ Corrections TypeScript en cours (FormulaireCreation, generate-pdf)

⏳ Tests en local

⏳ Déploiement Vercel

⏳ Configuration Chariow (Pulse + redirect URLs)

⏳ Page Systeme.io

