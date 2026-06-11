# Interface web premium — application des tokens

Application concrète du système (SKILL.md) à une interface Next.js / Tailwind.
Objectif : le niveau de finition d'un Linear, Stripe ou des meilleurs fichiers
communautaires Figma — rien qui sente le template.

## Tokens en pratique (Tailwind v4)

- Déclare les primitives puis les alias sémantiques en CSS variables dans `globals.css`
  (`--color-surface`, `--color-ink`, `--color-accent`...) et consomme-les via la config
  thème. Le code des composants n'utilise jamais une valeur hex en dur.
- Échelle d'espacement : reste sur l'échelle 4/8 de Tailwind (`p-2`, `p-4`, `p-6`,
  `p-8`, `gap-4`...). Les valeurs arbitraires `p-[13px]` sont interdites sauf
  contrainte externe documentée.
- Une seule échelle de rayons cohérente (ex. `rounded-lg` cartes, `rounded-md`
  contrôles, `rounded-full` pastilles) — pas de mélange aléatoire.

## Charte EVERBLOOM (si le travail concerne ce projet)

- Vert profond `#1E4D3A` (base), ivoire `#E8E0D5` (surface), or mat `#C4956A` (accent).
- Police : SF Pro Display avec repli Inter, via `var(--font-sans)`.
- Signature : composant `BloomMark` (fleur 8 pétales) pour marquer la marque —
  jamais un logo improvisé.
- Registre : français soigné, vouvoiement client, ton chaleureux et premium.

## Hiérarchie d'une vue

- Un seul héros par écran. Titre de page : la plus grande typo de la vue, et rien
  d'autre ne s'en approche.
- Les actions : une seule primaire par vue (pleine couleur accent), les autres en
  secondaire (outline/ghost). Deux boutons pleins côte à côte = faute.
- Cartes : élévation par ombre douce OU bordure fine, pas les deux. Ombres :
  larges, diffuses, très transparentes (`shadow-sm`/`shadow-md` custom) — jamais
  d'ombre dure.

## Les états font le premium

Un écran n'est fini que si ses quatre états sont dessinés :

1. **Vide** : illustration sobre ou icône + phrase d'invitation à agir + action.
   Jamais un écran blanc muet.
2. **Chargement** : skeletons aux dimensions exactes du contenu final (pas de
   spinner plein écran pour du contenu structuré).
3. **Erreur** : explique ce qui s'est passé et comment corriger, sans jargon ni
   excuse vague. Le ton reste celui de l'interface.
4. **Succès** : confirmation visible (toast, transition d'état du bouton), le
   vocabulaire reste identique du bouton à la confirmation (« Publier » → « Publié »).

## Micro-interactions

- Transitions 150–250ms, `ease-out`, sur les propriétés composables (opacity,
  transform). Jamais de transition sur `width`/`height` en layout.
- Hover : un seul effet discret (élévation légère, teinte +4 %) — pas de zoom agressif.
- Respecte `prefers-reduced-motion`.
- Une seule animation « moment » par page maximum (apparition orchestrée du héros) ;
  les effets dispersés partout font généré-par-IA.

## Mobile-first et accessibilité (plancher de qualité, non négociable)

- Conçois la vue en 390px d'abord, élargis ensuite. Cibles tactiles ≥ 44px.
- Contrastes : 4.5:1 corps de texte, 3:1 grands titres et icônes porteuses de sens.
- Focus clavier visible sur tous les éléments interactifs (anneau accent, jamais
  `outline: none` sec).
- Teste la vue avec du contenu réel long (noms longs, beaucoup d'éléments) : le
  design qui ne survit pas au vrai contenu n'est pas fini.

## Auto-critique spécifique web

- Squint test : en plissant les yeux, le point focal et le chemin de lecture
  doivent rester évidents.
- Screenshot la page (l'outil le permet) et regarde-la comme un client qui paie :
  qu'est-ce qui fait « bon marché » ? Corrige avant de livrer.
- Compare avec le rendu par défaut qu'aurait produit n'importe quel générateur :
  chaque écart doit être un choix motivé par le sujet, pas une décoration.
