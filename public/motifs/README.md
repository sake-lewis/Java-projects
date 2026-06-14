# Motifs image (PNG aquarelle) par style

Déposez ici **un PNG par style**, nommé par le numéro du style :

```
public/motifs/1.png    → Terre & Racines
public/motifs/2.png    → Feuillage
...
public/motifs/18.png   → Amour & Union
...
public/motifs/20.png   → Mémoire
```

## Règles
- **Format** : PNG carré, **fond transparent**, ~1500×1500 px.
- **Contenu** : un bouquet/ornement isolé (centré), assorti au style, sans cadre
  ni texte. Il sera posé automatiquement dans deux coins opposés du cadre photo
  (un exemplaire pivoté à 180°).
- **Progressif** : si le fichier d'un style est présent, il remplace le motif
  vectoriel ; sinon le motif dessiné du catalogue reste utilisé. On peut donc
  ajouter les images une par une.

## Où c'est utilisé
- Éditeur (aperçu des pages) et sélecteur de styles : chargé via `/motifs/<id>.png`,
  avec repli automatique sur le SVG si absent.
- PDF : lu côté serveur et embarqué en base64 dans le document.

Voir `lib/styles/motifImages.ts`.
