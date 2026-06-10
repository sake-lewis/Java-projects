# Cahier des charges — EVERBLOOM

**Projet :** EVERBLOOM — Service de création de catalogues photo PDF
**Version :** 1.0
**Date :** Juin 2026
**Type :** Application web (SaaS à paiement unique par usage)

---

## 1. Présentation du projet

### 1.1 Contexte
EVERBLOOM est un service web qui permet à un client (cible : marché africain,
paiement Mobile Money) de transformer ses photos d'événements personnels en un
**catalogue PDF élégant**, prêt à être téléchargé et partagé sur WhatsApp.

Les événements visés : mariage, anniversaire, deuil/funérailles, naissance/enfance,
remise de diplôme et fêtes solennelles.

### 1.2 Proposition de valeur
- Pas de compétence technique requise côté client.
- Paiement simple via Mobile Money (MTN MoMo / Orange Money) sur Chariow.
- Résultat professionnel (mise en page soignée, 5 thèmes par forfait).
- Livrable immédiat, partageable, disponible 7 jours.

### 1.3 Modèle économique
Paiement **unique** par catalogue, sans abonnement ni création de compte.
Un paiement = un lien d'accès = un catalogue.

---

## 2. Objectifs

| Objectif | Description |
|---|---|
| **O1** | Permettre la création d'un catalogue PDF sans inscription |
| **O2** | Sécuriser l'accès : seul un client ayant payé peut créer un catalogue |
| **O3** | Produire un PDF de qualité professionnelle selon le forfait choisi |
| **O4** | Garantir la confidentialité : photos et PDF supprimés automatiquement |
| **O5** | Faciliter le partage (WhatsApp) et la fidélisation (lien boutique en fin de PDF) |

---

## 3. Acteurs

| Acteur | Rôle |
|---|---|
| **Client** | Achète un forfait, crée et télécharge son catalogue |
| **Chariow** | Plateforme de paiement externe (Mobile Money) + déclencheur du webhook |
| **Système EVERBLOOM** | Génère les tokens, l'éditeur, le PDF, gère le cycle de vie |
| **Cron / planificateur** | Nettoie automatiquement les sessions expirées |

---

## 4. Périmètre fonctionnel

### 4.1 Inclus
- Réception du paiement via webhook Chariow.
- Génération d'un lien d'accès unique (token).
- Éditeur de catalogue (nom, description, thème, photos).
- Upload + recadrage des photos (ratio 9:16).
- Génération du PDF côté serveur.
- Téléchargement + partage WhatsApp.
- Expiration et nettoyage automatiques.

### 4.2 Exclu (hors périmètre v1)
- Création de compte / espace client persistant.
- Modification d'un catalogue après génération du PDF.
- Paiement intégré dans l'application (délégué à Chariow).
- Application mobile native (web uniquement).
- Back-office d'administration.

---

## 5. Flux utilisateur

```
Publicité Facebook
        ↓
Page Systeme.io (vidéo + liens de paiement)
        ↓
Paiement sur Chariow (MTN MoMo / Orange Money)
        ↓
Chariow → webhook → /api/webhook-chariow
        ↓
Création d'un token unique dans Firestore (statut "paid")
        ↓
Redirection vers /create/[forfait]?token=xxx
        ↓
Page d'accueil du forfait (start) — présentation + features
        ↓
Page de création (editor) :
   - nom + description
   - choix du thème (1 à 5)
   - upload des photos (recadrage 9:16)
   - bouton "Générer mon catalogue PDF"
        ↓
Génération PDF serveur (Puppeteer + Handlebars)
   - PDF stocké dans Firebase Storage (7 jours)
   - photos Cloudinary supprimées
        ↓
Téléchargement du PDF + partage WhatsApp
   - en fin de PDF : lien boutique Chariow pour recommander
```

---

## 6. Exigences fonctionnelles

### 6.1 Paiement & accès
- **EF-01** — À chaque vente (`successful.sale`), le système crée une session unique
  identifiée par un **token UUID**.
- **EF-02** — Le forfait (`standard` | `pro` | `premium`) et l'email du client sont
  extraits des métadonnées du webhook.
- **EF-03** — Tout webhook dont l'événement n'est pas `successful.sale` est ignoré.
- **EF-04** — Aucun accès à l'éditeur n'est possible sans token valide.

### 6.2 Éditeur
- **EF-05** — Le client saisit un **nom de catalogue** (min. 3 caractères, max. 60).
- **EF-06** — Le client saisit une **description** optionnelle (max. 200 caractères).
- **EF-07** — Le client choisit **1 thème parmi 5**.
- **EF-08** — Le client ajoute ses photos **une par une**, avec recadrage au ratio **9:16**.
- **EF-09** — Le nombre de photos est plafonné selon le forfait (50 / 100 / 150).
- **EF-10** — Chaque photo peut recevoir une **description optionnelle** (max. 80 caractères).
- **EF-11** — Une photo peut être supprimée avant génération.

### 6.3 Génération du PDF
- **EF-12** — Le PDF est généré côté serveur à partir du **template HTML** du thème choisi,
  rempli via Handlebars avec les photos et textes.
- **EF-13** — Le PDF est au format **A4**, sans marges, fonds imprimés.
- **EF-14** — Un **hash SHA-256** du PDF est calculé et stocké (intégrité).
- **EF-15** — Le PDF est stocké dans Firebase Storage avec une **URL signée valable 7 jours**.
- **EF-16** — Après génération, les **photos Cloudinary sont supprimées**.
- **EF-17** — En cas d'échec, la session revient au statut `paid` pour permettre un nouvel essai.

### 6.4 Livraison & partage
- **EF-18** — Le client peut **télécharger** le PDF.
- **EF-19** — Le client peut **partager** le lien du PDF sur WhatsApp.
- **EF-20** — Le PDF affiche, en dernière page, un lien vers la boutique Chariow.

### 6.5 Cycle de vie & nettoyage
- **EF-21** — Une session expire **7 jours** après la génération du PDF.
- **EF-22** — À l'expiration : le PDF est supprimé du Storage et le statut passe à `expired`.
- **EF-23** — Un **cron quotidien (2h du matin)** nettoie les sessions expirées.
- **EF-24** — Le cron est protégé par un secret (`CRON_SECRET`).

---

## 7. Offre commerciale

### 7.1 Forfaits

| Forfait | Prix | Photos max | Pages max | Positionnement |
|---|---|---|---|---|
| **Standard** | 3 000 FCFA | 50 | 50 | Sobre & élégant |
| **Pro** | 5 000 FCFA | 100 | 100 | Impressionnant |
| **Premium** | 10 000 FCFA | 150 | 150 | Luxueux |

### 7.2 Thèmes (5 par forfait)

| N° | Thème | Usage |
|---|---|---|
| 1 | Enfance / Naissance | Naissance & croissance |
| 2 | Mariage | Union & cérémonie |
| 3 | Deuil / Funérailles | Hommage & souvenir |
| 4 | Anniversaire | Célébration & joie |
| 5 | Solennel / Fêtes | Remise de diplôme & fêtes |

> Chaque forfait possède ses **5 variantes de templates HTML** (soit 15 templates au total),
> avec un niveau de raffinement croissant (sobre → avancé → luxueux).

---

## 8. Modèle de données (Firestore)

Collection **`sessions`**, document identifié par le `token` :

| Champ | Type | Description |
|---|---|---|
| `token` | string | Identifiant unique (UUID) |
| `forfait` | enum | `standard` \| `pro` \| `premium` |
| `email` | string | Email du client (issu du paiement) |
| `statut` | enum | `paid` \| `generating` \| `ready` \| `downloaded` \| `expired` |
| `nom_catalogue` | string | Saisi par le client |
| `description` | string | Optionnelle |
| `style_choisi` | 1–5 | Thème sélectionné |
| `photos` | array | Liste `{ url, description? }` (URLs Cloudinary) |
| `pdf_url` | string \| null | URL signée Firebase Storage |
| `pdf_hash` | string \| null | Hash SHA-256 du PDF (non exposé au client) |
| `created_at` | number | Timestamp de création |
| `downloaded_at` | number \| null | Timestamp du téléchargement |
| `pdf_expires_at` | number \| null | `généré_le + 7 jours` |
| `session_expires_at` | number \| null | Identique à `pdf_expires_at` |

### 8.1 Machine à états du statut

```
paid ──▶ generating ──▶ ready ──▶ downloaded
  ▲           │                        │
  └───────────┘ (échec)                │
                                       ▼
            (après 7 jours)  ──────▶ expired
```

---

## 9. Architecture technique

### 9.1 Stack

| Couche | Technologie |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TailwindCSS v4 |
| Backend | Next.js API Routes (runtime Node.js) |
| Base de données | Firebase Firestore |
| Stockage PDF | Firebase Storage (URL signées) |
| Stockage photos (temporaire) | Cloudinary |
| Génération PDF | Puppeteer + Handlebars |
| Paiement | Chariow (externe — MTN MoMo / Orange Money) |
| Hébergement | Vercel (fonctions serverless + cron) |

### 9.2 Pages

| Route | Rôle |
|---|---|
| `/create/[forfait]` | Vérifie le token et redirige selon le statut |
| `/create/[forfait]/start` | Page d'accueil/présentation du forfait |
| `/create/[forfait]/editor` | Éditeur de catalogue |
| `/error` | Token invalide, expiré ou déjà utilisé |

### 9.3 API

| Route | Méthode | Rôle |
|---|---|---|
| `/api/webhook-chariow` | POST | Reçoit la vente, crée la session |
| `/api/session` | GET | Lit l'état d'une session (sans données sensibles) |
| `/api/upload-photo` | POST / DELETE | Upload / suppression d'une photo Cloudinary |
| `/api/generate-pdf` | POST | Génère le PDF et le stocke |
| `/api/cleanup` | GET | Nettoyage des sessions expirées (cron, protégé) |

### 9.4 Génération PDF — adaptation serverless
- **Production (Vercel)** : `puppeteer-core` + `@sparticuz/chromium` (binaire léger).
- **Développement local** : `puppeteer` complet (devDependency).
- Sélection automatique via `lib/pdf/browser.ts`.
- Fonction `/api/generate-pdf` : **120 s** de timeout, **1024 Mo** de RAM.

---

## 10. Exigences de sécurité

- **ES-01** — Accès strictement conditionné à un **token unique** lié à un paiement.
- **ES-02** — Le `pdf_hash` n'est **jamais exposé** côté client.
- **ES-03** — Les **URL de PDF sont signées** et expirent au bout de 7 jours.
- **ES-04** — Les **photos sont supprimées** de Cloudinary après génération du PDF.
- **ES-05** — Les PDF sont **supprimés** du Storage à l'expiration.
- **ES-06** — Le cron de nettoyage est protégé par un **secret** (`CRON_SECRET`).
- **ES-07** — Les **clés secrètes** (Firebase Admin, Cloudinary) restent côté serveur,
  jamais dans le bundle navigateur.
- **ES-08** — Le fichier `.env.local` est exclu du dépôt Git.

---

## 11. Exigences non fonctionnelles

| Réf | Exigence |
|---|---|
| **ENF-01** | Le PDF doit être généré en moins de 120 s (limite serverless). |
| **ENF-02** | L'interface doit être responsive (mobile-first, cible smartphone). |
| **ENF-03** | Les photos sont normalisées (1080×1920, ratio 9:16) à l'upload. |
| **ENF-04** | Taille maximale d'une photo à l'upload : 10 Mo. |
| **ENF-05** | L'application doit fonctionner sans création de compte. |
| **ENF-06** | Build de production sans erreur (TypeScript strict). |

---

## 12. Contraintes & dépendances externes

- **Chariow** doit envoyer le webhook `successful.sale` avec
  `metadata.forfait` et `customer.email`, puis rediriger vers le bon lien.
- **Firebase** : projet configuré (Firestore + Storage + compte de service).
- **Cloudinary** : compte configuré (cloud name + API key/secret).
- **Vercel** : variables d'environnement renseignées (voir `DEPLOIEMENT_VERCEL.md`).
- Connexion Internet requise côté client pour l'upload et le téléchargement.

---

## 13. Livrables

1. Application web déployée sur Vercel.
2. 15 templates PDF (3 forfaits × 5 thèmes).
3. Documentation de déploiement (`DEPLOIEMENT_VERCEL.md`).
4. Le présent cahier des charges (`CAHIER_DES_CHARGES.md`).

---

## 14. Reste à faire avant mise en production

| Élément | Statut |
|---|---|
| Structure, backend, frontend | ✅ Complet |
| Corrections TypeScript (FormulaireCreation, generate-pdf, Firebase Admin) | ✅ Corrigé |
| Restructuration (suppression du routage en double, code mort) | ✅ Fait |
| Adaptation Puppeteer pour Vercel | ✅ Fait |
| Clé privée Firebase valide dans `.env.local` | ⏳ À fournir |
| Test local de bout en bout (avec credentials valides) | ⏳ À faire |
| Déploiement Vercel + variables d'environnement | ⏳ À faire |
| Configuration Chariow (webhook + redirection) | ⏳ À faire |
| Page Systeme.io | ⏳ À faire |

---

*Document de référence — décrit le QUOI (besoins et règles).
Pour le COMMENT (déploiement), voir `DEPLOIEMENT_VERCEL.md`.*
