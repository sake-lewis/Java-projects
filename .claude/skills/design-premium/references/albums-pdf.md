# Albums photo & templates PDF premium

Règles issues des standards des albums de mariage professionnels et des plus beaux
templates Canva. Un album premium se reconnaît à sa retenue : peu de photos par page,
beaucoup d'air, un rythme de lecture maîtrisé.

## Densité et marges

- **2 à 3 photos par page maximum** (4 à 6 par double-page). Au-delà, on bascule dans
  l'effet « annuaire scolaire » qui détruit la valeur perçue de chaque image.
- **Marges autour des images : l'équivalent de 1,5 à 2,5 cm** (environ 40–70px en A4
  96dpi). L'espace négatif est le cadre silencieux de la photo, comme en galerie.
- **Au moins 20 % de chaque page reste vide.** En cas de doute, enlève une photo
  plutôt que de réduire les marges.
- Gouttières strictement identiques entre toutes les photos d'une même grille.

## Rythme des planches

La séquence des pages se compose comme un récit :

1. **Couverture** : un seul élément héros (titre, monogramme ou photo pleine page).
2. **Alternance des densités** : pleine page immersive → grille de 2-3 → respiration
   (page presque vide avec une citation, un ornement, une dédicace). Ne répète jamais
   le même gabarit plus de 2 pages de suite.
3. **Moments forts en pleine page** : les meilleures photos méritent la page entière,
   voire un fond perdu (full-bleed). C'est l'alternance pleine page / grille qui crée
   l'émotion.
4. **Clôture** : page calme, signature, mention discrète (édition, date).

## Composition des grilles photo

- Horizons et lignes de force alignés entre photos voisines — l'œil perçoit
  immédiatement le calme d'une planche bien réglée.
- Mélange portrait/paysage : ancre la composition sur un axe commun, ne laisse
  jamais une photo « flotter ».
- Pour les pages à forte énergie (fête, réception) : grille stricte et serrée qui
  organise les candides en collage cohérent.

## Palettes par registre émotionnel

Toujours 3–5 couleurs (base, encre, surface, soutien, accent). L'or est mat
(laiton/doré beige), jamais jaune saturé. Combinaisons éprouvées par occasion :

| Registre | Base | Encre | Accent | Esprit |
|---|---|---|---|---|
| Romantique | ivoire rosé | charbon chaud | rose poudré / or | guirlandes fines, serif délicate |
| Moderne | blanc cassé | encre froide | terracotta | géométrie, aplats francs |
| Tendre (enfance) | crème | brun doux | pastel (menthe, pêche) | rondeurs, cursive légère |
| Hommage (deuil) | noir profond ou ivoire | or mat | lys, sépia | solennité, filets fins, beaucoup d'air |
| Festif | fond clair lumineux | charbon | corail / champagne | bokeh discret, énergie contenue |
| Solennel | bleu nuit | ivoire | or | monogramme, Neo Deco, symétrie |

Le deuil exige une retenue maximale : aucune décoration joyeuse, contrastes doux,
typographie classique, silence visuel.

## Ornements et effets « foil »

- Un seul ornement signature par template (monogramme, filet doré, fleuron) répété
  avec parcimonie — pas un catalogue d'ornements.
- Effet foil en CSS : dégradé métallique subtil (`linear-gradient` 2-3 tons d'or mat)
  appliqué au texte via `background-clip: text`, réservé aux titres et monogrammes.
- Filets : 1px, jamais plus. Les cadres épais font « certificat bon marché ».
- Neo Deco fonctionne très bien pour le solennel : géométrie fine, symétrie, angles.

## Spécificités techniques (HTML → PDF via Puppeteer)

- Dimensionne en unités print (`@page`, mm) ou en px à ratio fixe ; vérifie le rendu
  au format final, pas dans un viewport de navigateur quelconque.
- Les polices doivent être embarquées/chargées avant le rendu (attention aux
  `waitUntil` réseau) — un fallback système ruine la typographie.
- Fond perdu : étends l'image au-delà du cadre visible pour éviter les liserés blancs.
- Les photos Cloudinary : demande la taille réellement nécessaire (transformations
  `w_`, `h_`, `c_fill`, `g_auto`) — jamais l'original surdimensionné ; `q_auto:good`.
- Teste toujours avec des photos aux ratios variés (portrait, paysage, carré) :
  un template premium ne casse sur aucun ratio.
