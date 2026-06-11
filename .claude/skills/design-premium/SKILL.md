---
name: design-premium
description: >
  Standards de design premium niveau Canva / Figma : hiérarchie visuelle, grille 8pt,
  échelles typographiques, palettes luxe, mise en page éditoriale et albums photo.
  Utiliser cette skill dès que la tâche touche au visuel — créer ou retoucher une page,
  un composant, un template PDF, un album, une vignette, un email ou un visuel marketing —
  même si l'utilisateur dit seulement « rends ça beau », « plus premium », « style luxe »,
  « ça fait cheap », ou mentionne couleurs, polices, espacement ou mise en page.
---

# Design Premium — niveau Canva / Figma

Travaille comme un directeur artistique senior qui livre du « quiet luxury » : un point
focal fort, beaucoup d'air, une palette resserrée, des détails exécutés au pixel.
Le premium ne vient jamais d'ajouter des effets — il vient de la discipline du système
et de la qualité de ce qu'on enlève.

## 1. Le système avant les pixels (méthode Figma)

Ne commence jamais par dessiner. Commence par poser les **tokens**, puis tout en découle :

- **Couleurs** : 3 à 5 maximum — une base, une couleur de texte, un neutre de surface,
  un ton de soutien, un accent. Définis d'abord les primitives (valeurs hex brutes),
  puis des alias sémantiques (`surface`, `encre`, `accent`) que le code utilise.
  Une 6e couleur doit se justifier ou disparaître.
- **Typographie** : une échelle modulaire d'environ 7 tailles, base 16px, ratio constant
  (seconde majeure 1.125 pour les interfaces denses, tierce 1.25 pour l'éditorial).
  Line-height : ~1.5 pour le corps, ~1.1 pour les titres. Sur fond sombre, augmente
  légèrement le letter-spacing. Les capitales exigent toujours du tracking (+0.05 à 0.15em).
- **Espacement** : grille 8pt (baseline 4pt). Chaque padding, margin et hauteur est un
  multiple de 4 — de préférence 8, 16, 24, 32, 48, 64. Une valeur hors grille est un bug.
- **Rayons et traits** : une seule famille de rayons (ex. 8 / 12 / 16), des filets fins
  (1px) pour le luxe — jamais de bordures épaisses.

Pourquoi : la cohérence mathématique est ce que l'œil perçoit comme « cher » sans
savoir l'expliquer. Les proportions harmonieuses font 80 % du travail.

## 2. Les quatre lois (méthode Canva)

À vérifier sur chaque écran ou page produite :

1. **Hiérarchie** — l'élément le plus important est le plus visible (taille, graisse,
   position, couleur). Un seul héros par vue ; si deux éléments crient, aucun n'est entendu.
2. **Contraste** — chaque paire d'éléments voisins diffère franchement (grand/petit,
   gras/fin, sombre/clair) ou est strictement identique. L'entre-deux est ce qui fait amateur.
3. **Alignement** — tout repose sur la grille. Bords, axes et horizons alignés ;
   gouttières identiques. Un seul élément flottant casse la perception d'ordre.
4. **Espace blanc** — au moins 20 % de chaque composition reste vide. L'air n'est pas
   de l'espace perdu : c'est le cadre silencieux qui met le contenu en valeur. En cas de
   doute, double les marges plutôt que de les réduire.

## 3. Typographie premium

- **Deux familles maximum** : une display de caractère (serif élégante type Playfair,
  Cormorant, Garamond pour le luxe) utilisée avec parcimonie, et une famille de labeur
  neutre et lisible. La typographie porte la personnalité — c'est elle le héros en 2026,
  pas les effets.
- La display ne sert que les titres et moments signature. Le corps reste sobre.
- Chiffres et données : utilise les variantes tabulaires si disponibles.
- Jamais plus de deux graisses par famille à l'écran (ex. 400 + 600).

## 4. Couleur luxe

- Texte sombre (charbon, jamais noir pur `#000`) sur fonds clairs chauds (ivoire, parchemin).
- Sur fond sombre : corps de texte crème chaud, jamais blanc pur.
- **L'or est mat** — laiton, beige doré (`#C4956A`, `#B08D57`) — jamais jaune saturé.
  Réserve les effets métal/foil aux grands signes (monogramme, titre) et aux filets fins.
- Combinaisons éprouvées : noir + or, ivoire + or, bleu nuit + or, vert profond + or.
- Les dégradés se comportent comme des sources de lumière (atmosphère subtile),
  jamais comme des arcs-en-ciel décoratifs.

## 5. Rythme éditorial

Une mise en page premium se lit comme un magazine :

- **Ouvre par une thèse** : l'élément le plus caractéristique du sujet, plein cadre.
- **Alterne les densités** : une vue immersive pleine page, puis une vue structurée en
  grille, puis de l'air. La monotonie (même gabarit répété N fois) tue le premium.
- **La structure encode du sens** : numérotations, filets et étiquettes uniquement si
  l'ordre ou le regroupement existe vraiment dans le contenu.
- **Le texte est du matériau de design** : verbes actifs, registre précis, aucun
  remplissage. Un bouton dit exactement ce qu'il fait.

## 6. Auto-critique avant livraison

Avant de montrer quoi que ce soit, passe cette checklist :

- [ ] Retire un élément (règle de Chanel) : qu'est-ce qui part sans que rien ne manque ?
- [ ] Est-ce que ça ressemble au rendu par défaut d'une IA (crème + serif + terracotta,
      ou fond noir + accent acide) ? Si oui, c'est un défaut, pas un choix — revois.
- [ ] Toutes les valeurs d'espacement sont-elles sur la grille 4/8 ?
- [ ] Le point focal est-il évident en moins d'une seconde de squint test ?
- [ ] Contraste texte accessible (4.5:1 corps, 3:1 grands titres) ?
- [ ] Rendu vérifié en conditions réelles (screenshot, mobile, impression PDF selon le cas) ?

## Références spécialisées

- **Album / template PDF** (catalogues photo, brochures, documents imprimables) :
  lis `references/albums-pdf.md` — marges, photos par page, rythme des planches,
  ornements, palettes par occasion.
- **Interface web** (pages, composants, dashboards) : lis `references/ui-web.md` —
  application des tokens en Tailwind, états (vide, chargement, erreur),
  micro-interactions, charte EVERBLOOM.
