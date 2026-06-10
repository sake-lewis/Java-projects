# Règles de gestion & détails — EVERBLOOM

> Document de référence synthétisant le fonctionnement de l'application, basé sur
> le cahier des charges (`CAHIER_DES_CHARGES.md`) **et** le code réel.
> Sert de base de travail pour le développement (templates, API, éditeur…).

---

## 1. Présentation de l'application

**EVERBLOOM** est un service web SaaS (paiement unique, sans abonnement ni compte)
qui transforme les photos d'événements personnels d'un client en un **catalogue PDF
élégant**, téléchargeable et partageable sur WhatsApp.

- **Cible** : marché africain, paiement Mobile Money (MTN MoMo / Orange Money)
- **Événements** : mariage, anniversaire, deuil/funérailles, naissance/enfance,
  remise de diplôme, fêtes solennelles
- **Principe** : 1 paiement = 1 token = 1 catalogue

### Stack technique

| Couche | Technologie |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TailwindCSS v4 |
| Backend | Next.js API Routes (runtime Node.js) |
| Base de données | Firebase Firestore |
| Stockage PDF | Firebase Storage (URLs signées) |
| Stockage photos (temporaire) | Cloudinary |
| Génération PDF | Puppeteer + Handlebars |
| Paiement | Chariow (externe) |
| Hébergement | Vercel (serverless + cron) |

### Offre commerciale (3 forfaits)

| Forfait | Prix | Photos max | Pages max |
|---|---|---|---|
| Standard | 3 000 FCFA | 50 | 50 |
| Pro | 5 000 FCFA | 100 | 100 |
| Premium | 10 000 FCFA | 150 | 150 |

### 5 thèmes par forfait (15 templates HTML au total)

1. Enfance / Naissance
2. Mariage
3. Deuil / Funérailles
4. Anniversaire
5. Solennel / Fêtes

### Pages & API

**Pages**
- `/create/[forfait]` — vérifie le token et redirige selon le statut
- `/create/[forfait]/start` — présentation du forfait
- `/create/[forfait]/editor` — éditeur de catalogue
- `/error` — token invalide / expiré / déjà utilisé

**API**
- `POST /api/webhook-chariow` — reçoit la vente, crée la session
- `GET /api/session` — lit l'état d'une session (sans données sensibles)
- `POST|DELETE /api/upload-photo` — upload / suppression d'une photo Cloudinary
- `POST /api/generate-pdf` — génère le PDF et le stocke
- `GET /api/cleanup` — nettoyage des sessions expirées (cron, protégé)

---

## 2. Règles de gestion

### Paiement & accès

- **RG-01** — Seul l'événement webhook `successful.sale` crée une session ; tout
  autre événement est ignoré (HTTP 200).
- **RG-02** — Chaque vente génère une session unique identifiée par un **token
  UUID v4**, statut initial `paid`.
- **RG-03** — Le forfait (`standard`/`pro`/`premium`) et l'email client sont extraits
  des métadonnées du webhook ; un forfait inconnu ou manquant → rejet (HTTP 400).
- **RG-04** — *(sécurité)* Le webhook n'est accepté que si le secret partagé
  `CHARIOW_WEBHOOK_SECRET` est fourni et valide ; sinon HTTP 401.
- **RG-05** — Aucun accès à l'éditeur sans token valide. Un token est invalide s'il
  n'existe pas, si la session est `expired`, ou si la date d'expiration est dépassée.
- **RG-06** — Le forfait de l'URL doit correspondre au forfait de la session, sinon
  redirection vers `/error`.

### Machine à états de la session

```
paid ──▶ generating ──▶ ready ──▶ downloaded
  ▲           │                        │
  └───────────┘ (échec)                ▼
                    (après 7 jours) ──▶ expired
```

- **RG-07** — Redirection selon statut : `paid`/`generating` → page **start** ;
  `ready`/`downloaded` → **editor** ; `expired` → `/error`.
- **RG-08** — En cas d'échec de génération PDF, la session **revient au statut
  `paid`** pour permettre un nouvel essai.

### Éditeur (saisie client)

- **RG-09** — Nom du catalogue : **min. 3, max. 60** caractères (obligatoire).
- **RG-10** — Description du catalogue : optionnelle, **max. 200** caractères.
- **RG-11** — Le client choisit **1 thème parmi 5**.
- **RG-12** — Photos ajoutées **une par une**, avec recadrage imposé au **ratio 9:16**.
- **RG-13** — Nombre de photos plafonné selon le forfait (**50 / 100 / 150**).
- **RG-14** — Chaque photo peut recevoir une description optionnelle (**max. 80**
  caractères).
- **RG-15** — Une photo peut être supprimée avant génération (supprimée aussi de
  Cloudinary).
- **RG-16** — Génération autorisée seulement si nom ≥ 3 caractères **et** au moins
  1 photo.

### Traitement des photos

- **RG-17** — Format accepté : image uniquement (`data:image/...`), **taille max
  10 Mo**.
- **RG-18** — À l'upload, chaque photo est normalisée à **1080×1920 (ratio 9:16)**,
  crop `fill`/`center`, et stockée sous `everbloom/[token]/` chez Cloudinary.

### Génération du PDF

- **RG-19** — PDF généré côté serveur depuis le template HTML du thème choisi, rempli
  via Handlebars (nom, description, photos, total, lien boutique).
- **RG-20** — Format **A4, sans marges, fonds imprimés** (`printBackground`).
- **RG-21** — Un **hash SHA-256** du PDF est calculé et stocké (intégrité) — **jamais
  exposé au client**.
- **RG-22** — PDF stocké dans Firebase Storage sous `catalogues/[token]/catalogue.pdf`,
  accessible via **URL signée valable 7 jours**.
- **RG-23** — Après génération réussie : statut → `ready`, et **les photos Cloudinary
  sont supprimées**.
- **RG-24** — Cas spécial : Premium thème 4 génère 40 particules décoratives aléatoires.

### Livraison & partage

- **RG-25** — Le client peut télécharger le PDF et le partager sur WhatsApp (lien
  pré-rempli).
- **RG-26** — La dernière page du PDF affiche un lien vers la boutique Chariow
  (fidélisation).

### Cycle de vie & nettoyage

- **RG-27** — Une session expire **7 jours** après la génération du PDF
  (`pdf_expires_at = généré_le + 7j`).
- **RG-28** — À l'expiration : le PDF est supprimé du Storage, statut → `expired`,
  `pdf_url` → null.
- **RG-29** — Un **cron quotidien (2h du matin)** appelle `/api/cleanup` pour nettoyer
  les sessions expirées.
- **RG-30** — Le cron est protégé par `CRON_SECRET` (header `Authorization: Bearer
  ...`), sinon HTTP 401.

### Sécurité

- **RG-31** — Le `pdf_hash` n'est jamais renvoyé côté client (retiré de la réponse
  `/api/session`).
- **RG-32** — Clés secrètes (Firebase Admin, Cloudinary) strictement côté serveur,
  jamais dans le bundle navigateur.
- **RG-33** — `.env.local` exclu du dépôt Git.
- **RG-34** — *(sécurité)* La route de test `/api/debug-session` est désactivée en
  production (HTTP 404).

---

## 3. Modèle de données — collection Firestore `sessions`

Document identifié par le `token` :

| Champ | Type | Description |
|---|---|---|
| `token` | string | UUID, identifiant du document |
| `forfait` | enum | `standard` / `pro` / `premium` |
| `email` | string | Email client (du paiement) |
| `statut` | enum | `paid`/`generating`/`ready`/`downloaded`/`expired` |
| `nom_catalogue` | string | Saisi par le client |
| `description` | string | Optionnelle |
| `style_choisi` | 1–5 | Thème sélectionné |
| `photos` | array | `{ url, description? }` (URLs Cloudinary) |
| `pdf_url` | string \| null | URL signée Firebase Storage |
| `pdf_hash` | string \| null | SHA-256 (non exposé) |
| `created_at` | number | Timestamp création |
| `downloaded_at` | number \| null | Timestamp téléchargement |
| `pdf_expires_at` | number \| null | `généré_le + 7j` |
| `session_expires_at` | number \| null | Identique à `pdf_expires_at` |

---

## 4. Variables d'environnement

| Variable | Rôle |
|---|---|
| `NEXT_PUBLIC_FIREBASE_*` | Config Firebase côté client |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Clé privée du compte de service (serveur) |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Email du compte de service (serveur) |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Bucket Firebase Storage |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloud Cloudinary |
| `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Auth Cloudinary (serveur) |
| `NEXT_PUBLIC_CHARIOW_BOUTIQUE_URL` | Lien boutique (bas de PDF + page d'erreur) |
| `CHARIOW_WEBHOOK_SECRET` | Secret partagé authentifiant le webhook entrant |
| `CRON_SECRET` | Secret protégeant le cron de nettoyage |

---

## 5. Données transmises aux templates (Handlebars)

Le endpoint `POST /api/generate-pdf` compile le template
`lib/pdf/templates/{forfait}/style-{1..5}.html` avec :

| Variable | Type | Description |
|---|---|---|
| `nom_catalogue` | string | Titre du catalogue |
| `description` | string | Description du catalogue |
| `photos` | array | `{ url, description? }` |
| `total_photos` | number | Nombre de photos |
| `boutique_url` | string | Lien boutique Chariow |
| `particules` | array | *(Premium thème 4 uniquement)* 40 points décoratifs |

Helper disponible : `add` (addition de deux valeurs).

---

## 6. État d'avancement & reste à faire

| Élément | Statut |
|---|---|
| Structure, backend, frontend | ✅ Complet |
| Corrections de sécurité (logs clé, route debug, auth webhook, CRON_SECRET) | ✅ Fait |
| Parcours testé (Firestore, upload Cloudinary, génération PDF) | ✅ Fonctionnel |
| Correction warning `src=""` (CropperModal) | ✅ Fait |
| Configuration Firebase Storage (bucket inexistant → upload PDF échoue) | ⏳ À corriger |
| Test de bout en bout complet (jusqu'au téléchargement) | ⏳ À faire |
| Déploiement Vercel + variables d'environnement | ⏳ À faire |
| Configuration Chariow (webhook + redirection) | ⏳ À faire |
| Page Systeme.io | ⏳ À faire |
| Amélioration des templates PDF / thèmes | 🔜 Prochaine tâche |
