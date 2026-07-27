# Utiliser Everbloom en un clic — sur ce PC et sur n'importe quel PC

## 1. Raccourci bureau pour l'usage LOCAL (ce PC)

Le fichier **`Lancer-Everbloom.bat`** (à la racine du projet) démarre tout en
un clic : il installe les dépendances si besoin, lance l'application et ouvre
ton navigateur sur l'interface.

Pour l'avoir sur le bureau :
1. Clic droit sur `Lancer-Everbloom.bat`
2. **Envoyer vers → Bureau (créer un raccourci)**
3. (Optionnel) Clic droit sur le raccourci → Propriétés → Changer d'icône.

> Prérequis local : Node.js installé et `.env.local` rempli (voir GUIDE_INSTALLATION.md).

## 2. Accès EN LIGNE depuis n'importe où (recommandé)

Une fois le déploiement Vercel fait (GUIDE_INSTALLATION.md, étape 4), ton
application a une adresse du type `https://everbloom-catalogues.vercel.app`,
disponible 24h/24, PC éteint ou pas.

### Raccourci bureau vers la version en ligne
1. Ouvre l'URL dans Chrome
2. Réduis la fenêtre, puis **glisse le cadenas** (à gauche de l'adresse) vers le bureau
   → un raccourci cliquable est créé.

### Mieux : INSTALLER l'application (sur n'importe quel PC)
Everbloom est une **PWA installable**. Sur n'importe quel PC :
1. Ouvre l'URL dans Chrome ou Edge
2. Clique l'icône **« Installer »** dans la barre d'adresse
   (ou menu ⋮ → *Installer Everbloom*)
3. L'application s'installe avec sa propre fenêtre, son icône fleur dans le
   menu Démarrer et sur le bureau — comme un vrai logiciel, sans rien
   télécharger d'autre.

Sur téléphone : Chrome → menu ⋮ → **Ajouter à l'écran d'accueil**.

> Chaque PC/téléphone demandera ton mot de passe opérateur à la première
> connexion : c'est normal, c'est ta protection.
