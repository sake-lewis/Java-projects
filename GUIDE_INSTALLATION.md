# Guide d'installation — EVERBLOOM Catalogues v3

Ce guide te mène de zéro jusqu'à l'application accessible depuis ton PC **et**
ton téléphone, partout dans le monde.

---

## Étape 1 — Créer la base de données (Neon, gratuit)

1. Va sur **https://neon.tech** et crée un compte (avec ton compte GitHub c'est plus rapide).
2. Crée un projet, nomme-le par exemple `everbloom`.
3. Sur le tableau de bord du projet, clique **Connect** et copie l'URL de
   connexion (elle commence par `postgresql://...` et finit par `?sslmode=require`).

## Étape 2 — Récupérer tes clés Cloudinary

Tu as déjà un compte Cloudinary (cloud `dwznpqq1s`). Sur
**https://console.cloudinary.com** → Settings → API Keys, récupère :
`API Key` et `API Secret`.

## Étape 3 — Configurer le projet en local

Dans le dossier du projet :

```bash
npm install
```

Copie `.env.example` vers `.env.local`, puis remplis :

| Variable | Valeur |
|---|---|
| `ADMIN_PASSWORD` | Ton mot de passe de connexion (choisis-le fort) |
| `ADMIN_SESSION_SECRET` | Une longue chaîne aléatoire (32+ caractères) |
| `DATABASE_URL` | L'URL Neon copiée à l'étape 1 |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | `dwznpqq1s` |
| `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Clés de l'étape 2 |
| `CRON_SECRET` | Une autre chaîne aléatoire |

> Astuce : pour générer une chaîne aléatoire, dans PowerShell :
> `-join ((48..57)+(97..122) | Get-Random -Count 40 | % {[char]$_})`

Crée les tables dans Neon :

```bash
npm run db:push
```

Lance l'application :

```bash
npm run dev
```

Ouvre **http://localhost:3000** → page de connexion → ton `ADMIN_PASSWORD`. ✅

## Étape 4 — Déployer sur Vercel (accès PC + téléphone, partout)

1. Pousse le projet sur GitHub (nouveau dépôt, par exemple `everbloom-catalogues`) :

   ```bash
   git init
   git add .
   git commit -m "Everbloom Catalogues v3"
   git remote add origin https://github.com/sake-lewis/everbloom-catalogues.git
   git push -u origin main
   ```

2. Sur **https://vercel.com** → Add New → Project → importe le dépôt.
3. Avant de cliquer Deploy, ouvre **Environment Variables** et ajoute
   TOUTES les variables de ton `.env.local` (mêmes noms, mêmes valeurs),
   plus :
   - `PUPPETEER_SKIP_DOWNLOAD` = `true`
4. Clique **Deploy**. À la fin, tu obtiens une URL du type
   `https://everbloom-catalogues.vercel.app`.
5. Le cron de nettoyage (photos 7 jours + crédits expirés) est déjà déclaré
   dans `vercel.json` — Vercel l'active tout seul au premier déploiement.

**Sur ton téléphone** : ouvre l'URL dans Chrome → menu ⋮ →
« Ajouter à l'écran d'accueil ». L'application s'ouvre alors comme une vraie
app, en plein écran.

## Étape 5 — Ton premier catalogue (workflow complet)

1. Le client t'envoie sur WhatsApp : nom de l'entreprise, secteur, son numéro
   WhatsApp, le forfait payé, ses photos et les infos produits.
2. Dans l'app : **+ Client** → tu remplis la fiche → l'éditeur de son
   catalogue s'ouvre automatiquement.
3. **+ Ajouter un produit** : photo (recadrage IA automatique), nom, prix,
   description courte. Répète pour chaque produit.
4. **Générer le catalogue PDF** → le fichier `NomEntreprise.pdf` se télécharge
   sur ton appareil (PC ou téléphone).
5. Tu envoies le PDF au client sur WhatsApp. Terminé.

**Modifications ultérieures** : ouvre le catalogue → chaque ajout /
modification / suppression décompte 1 crédit automatiquement (l'app te
prévient et bloque si le solde est à zéro ou expiré). Encaisse le pack de
recharge ou le renouvellement via les boutons de la fiche client.

---

## Règles métier actives (rappel)

| Règle | Valeur |
|---|---|
| Forfaits | Basic 500 F · Standard 750 F · Premium 1 000 F |
| Produits max | 25 · 35 · 50 |
| Crédits inclus | 3 · 6 · 10 |
| Pack recharge | 5 modifications = 350 F |
| Validité des crédits | 6 mois (puis renouvellement) |
| Rétention des photos | 7 jours après chaque génération |
| Création initiale | GRATUITE (les crédits ne comptent qu'après la 1ʳᵉ génération) |
| Réordonner les produits | Gratuit |

Pour changer un tarif ou une limite : tout est dans **`lib/config.ts`**.

## Dépannage

- **« DATABASE_URL manquante »** → vérifie `.env.local` (local) ou les
  variables Vercel (production), puis relance.
- **La génération PDF échoue en local sous Windows** → la première fois,
  `npm install` télécharge un Chromium (~150 Mo). Si tu préfères utiliser
  ton Chrome installé : ajoute dans `.env.local`
  `PUPPETEER_EXECUTABLE_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe`
- **Les photos ne s'affichent pas dans le PDF** → vérifie les clés Cloudinary.
- **Mot de passe refusé** → `ADMIN_PASSWORD` dans les variables d'environnement
  (attention aux espaces en fin de valeur).
