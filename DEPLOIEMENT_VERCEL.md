# Checklist de déploiement Vercel — EVERBLOOM

Guide pas-à-pas pour mettre EVERBLOOM en production sur Vercel.
À suivre dans l'ordre. Coche chaque case ✅ au fur et à mesure.

---

## 1. Avant de déployer — vérifications locales

- [ ] `npm install` réussit sans erreur bloquante
- [ ] `npm run build` réussit (doit afficher **Compiled successfully** + 0 erreur TypeScript)
- [ ] Le fichier `.env.local` **n'est PAS** envoyé sur GitHub (déjà ignoré via `.gitignore` → ligne `.env*`)

---

## 2. Variables d'environnement (le point le plus important)

Toutes ces variables doivent être ajoutées dans **Vercel → ton projet → Settings → Environment Variables**
(les recopier depuis ton `.env.local`). Sans elles, l'app ne fonctionne pas.

> ⚠️ Les variables qui commencent par `NEXT_PUBLIC_` sont visibles côté navigateur (normal).
> Les autres (clés secrètes) doivent rester **privées**.

### 🔥 Firebase — Admin (secret, côté serveur)

| Variable | Où la trouver |
|---|---|
| `FIREBASE_ADMIN_PRIVATE_KEY` | Firebase Console → ⚙️ Paramètres du projet → **Comptes de service** → *Générer une nouvelle clé privée* (fichier JSON, champ `private_key`) |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Même fichier JSON, champ `client_email` |

> 🚨 **Cause de l'erreur « Failed to parse private key »** : la clé doit être collée **en entier**,
> avec les `\n` ou les vrais retours à la ligne, entre guillemets :
> `FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"`
> Dans l'interface Vercel, colle la valeur telle quelle (Vercel gère les retours à la ligne).

### 🔥 Firebase — Client (public)

| Variable | Où la trouver |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Console → ⚙️ → Général → *Tes applications* → config Web |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | idem |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | idem |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | idem (sert aussi à stocker les PDF) |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | idem |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | idem |

### 🖼️ Cloudinary (stockage temporaire des photos)

| Variable | Où la trouver |
|---|---|
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary → Dashboard → *Cloud name* |
| `CLOUDINARY_API_KEY` | Cloudinary → Dashboard → *API Key* (secret) |
| `CLOUDINARY_API_SECRET` | Cloudinary → Dashboard → *API Secret* (secret) |

### 🛒 Chariow + nettoyage

| Variable | Rôle |
|---|---|
| `NEXT_PUBLIC_CHARIOW_BOUTIQUE_URL` | Lien de ta boutique Chariow (affiché en bas du PDF + page d'erreur) |
| `CRON_SECRET` | Mot de passe secret qui protège le nettoyage automatique des sessions. Invente une longue chaîne aléatoire. |
| `CHARIOW_WEBHOOK_SECRET` | Secret partagé qui authentifie le webhook entrant de Chariow. Invente une longue chaîne aléatoire et configure Chariow pour l'envoyer (en-tête `x-chariow-signature` / `x-webhook-secret`, ou paramètre d'URL `?secret=`). Sans lui, **aucune session n'est créée** (réponse 500). |

> ✅ Pense à cocher **Production**, **Preview** ET **Development** pour chaque variable
> (ou au minimum **Production**).

---

## 3. Importer le projet sur Vercel

- [ ] Pousser le code sur un dépôt GitHub (le dossier `everbloom/`)
- [ ] Sur [vercel.com](https://vercel.com) → **Add New → Project** → importer le dépôt
- [ ] Framework détecté : **Next.js** (automatique)
- [ ] Root Directory : pointer sur le dossier `everbloom` si le repo contient des sous-dossiers
- [ ] Ajouter **toutes** les variables d'environnement de l'étape 2
- [ ] Cliquer **Deploy**

---

## 4. Génération PDF (Puppeteer) — déjà configuré ✅

Le code est déjà prêt pour le serverless Vercel :

- En production : `puppeteer-core` + `@sparticuz/chromium` (binaire léger)
- `vercel.json` réserve déjà **120 s** et **1024 Mo** de RAM à `/api/generate-pdf`

Rien à faire de plus, mais après le 1er déploiement :

- [ ] Tester une génération PDF réelle (paiement test → éditeur → *Générer*)
- [ ] Si le PDF échoue, vérifier les **Logs** Vercel de la fonction `/api/generate-pdf`

---

## 5. Cron de nettoyage automatique — déjà configuré ✅

`vercel.json` contient déjà :

```json
"crons": [{ "path": "/api/cleanup", "schedule": "0 2 * * *" }]
```

→ Nettoyage tous les jours à **2h du matin** (supprime les sessions/PDF de +7 jours).

- [ ] Vérifier que la variable `CRON_SECRET` est bien définie (sinon le cron renvoie 401)
- [ ] Après déploiement : Vercel → **Settings → Cron Jobs** doit lister le job

---

## 6. Configurer Chariow (après déploiement)

Une fois l'URL Vercel obtenue (ex : `https://everbloom.vercel.app`) :

- [ ] **Webhook (Pulse)** : dans Chariow, configurer l'URL
      `https://TON-DOMAINE/api/webhook-chariow` sur l'événement `successful.sale`
- [ ] Vérifier que les **métadonnées** envoyées contiennent bien `metadata.forfait`
      (`standard` | `pro` | `premium`) et `customer.email`
- [ ] **Redirection après paiement** : configurer Chariow pour rediriger vers
      `https://TON-DOMAINE/create/[forfait]?token=xxx`

---

## 7. Tests finaux (parcours complet)

- [ ] Paiement test Chariow → réception du webhook (vérifier la session créée dans Firestore)
- [ ] Ouverture du lien `/create/[forfait]?token=...` → page d'accueil du forfait
- [ ] Upload de photos + recadrage 9:16 → fonctionne
- [ ] Choix d'un thème + génération PDF → PDF téléchargeable
- [ ] Partage WhatsApp → lien fonctionne
- [ ] Lien expiré / token invalide → redirige vers `/error`

---

## 8. Domaine personnalisé (optionnel)

- [ ] Vercel → **Settings → Domains** → ajouter ton nom de domaine
- [ ] Mettre à jour `NEXT_PUBLIC_CHARIOW_BOUTIQUE_URL` et les URL Chariow si besoin

---

### Récapitulatif des 13 variables d'environnement à ne pas oublier

```
# Firebase Admin (secret)
FIREBASE_ADMIN_PRIVATE_KEY
FIREBASE_ADMIN_CLIENT_EMAIL

# Firebase Client (public)
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET

# Chariow + nettoyage
NEXT_PUBLIC_CHARIOW_BOUTIQUE_URL
CRON_SECRET
```
