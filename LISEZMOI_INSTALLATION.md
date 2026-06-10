# Comment tester EVERBLOOM sur un autre PC

Ce dossier contient **tout le code nécessaire**, mais **pas** le dossier `node_modules`
(les librairies) ni `.next` (le cache de build) : ils se régénèrent automatiquement.

Suis ces étapes dans l'ordre.

---

## 1. Installer Node.js (si ce n'est pas déjà fait)

- Télécharger la version **LTS** sur https://nodejs.org
- Installer, puis vérifier dans un terminal :
  ```
  node --version
  npm --version
  ```

## 2. Ouvrir un terminal dans le dossier

- Ouvrir le dossier `everbloom` dans un terminal (PowerShell, Invite de commandes, ou le terminal de VS Code).

## 3. Installer les librairies

```
npm install
```
> Cette commande recrée le dossier `node_modules` adapté à ce PC.
> (Peut prendre 1 à 3 minutes la première fois.)

## 4. Vérifier le fichier des clés `.env.local`

- Le fichier `.env.local` doit être présent à la racine du dossier.
- ⚠️ Si la clé Firebase n'est pas valide, la génération de PDF échouera
  (« Failed to parse private key »). Voir `DEPLOIEMENT_VERCEL.md` § 2.

## 5. Lancer en mode développement

```
npm run dev
```
- Ouvrir http://localhost:3000 dans le navigateur.

> ℹ️ La page d'accueil `/` n'existe pas (le parcours commence après paiement via un lien
> `/create/[forfait]?token=...`). Pour tester l'éditeur, il faut un token de session valide
> dans Firestore.

## 6. (Optionnel) Tester le build de production

```
npm run build
npm start
```
- Le build doit afficher **Compiled successfully** sans erreur.

---

## Résumé des commandes

```
npm install      # 1 fois : installe les librairies
npm run dev      # développement (http://localhost:3000)
npm run build    # build de production
npm start        # lance le build de production
```

---

## En cas de problème

| Problème | Cause probable | Solution |
|---|---|---|
| `npm install` échoue | Node.js trop ancien | Installer Node.js LTS récent |
| « Failed to parse private key » | Clé Firebase invalide dans `.env.local` | Regénérer la clé (voir `DEPLOIEMENT_VERCEL.md`) |
| Erreur Puppeteer en local | Chromium non téléchargé | Relancer `npm install` |
| Page `/` vide ou 404 | Normal | Le parcours démarre via `/create/[forfait]?token=...` |
