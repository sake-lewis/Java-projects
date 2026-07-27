# Rapport d'audit de sécurité — EVERBLOOM Catalogues v3

> Revue complète du code réalisée ligne par ligne, orientée OWASP Top 10.
> Chaque protection listée est **implémentée dans le code livré** (fichier indiqué).

---

## 1. Modèle de menace

Application mono-opérateur exposée sur Internet (Vercel). Surfaces d'attaque :
la page de connexion (seule surface publique), les API (toutes derrière
authentification), le webhook cron, la génération PDF (Puppeteer charge des
ressources externes), et les données saisies (noms, descriptions, photos).

## 2. Protections en place, par catégorie d'attaque

### Authentification & sessions
| Protection | Où |
|---|---|
| Mot de passe comparé en **temps constant** (`crypto.timingSafeEqual`) — anti attaque temporelle | `lib/admin/auth.ts` |
| Cookie de session **signé HMAC-SHA256** avec secret ≥ 16 caractères exigé | `lib/admin/auth.ts` |
| Cookie `httpOnly` (illisible par JS), `secure` en production, `SameSite=Lax` | `lib/admin/auth.ts` |
| **Session glissante 30 min** : expiration réelle côté serveur, pas seulement côté cookie | `lib/admin/auth.ts` |
| **Rate limiting connexion** : 8 tentatives / 15 min / IP + délai fixe de 800 ms | `app/api/login/route.ts` |
| Corps de la requête login borné (4 Ko) et mot de passe borné (256 car.) | `app/api/login/route.ts` |
| **Chaque** route API protégée appelle `verifierEtRafraichir()` en première ligne | toutes les routes |
| Le proxy redirige toute page sans cookie vers /login (pré-tri UX) | `proxy.ts` |

### CSRF (falsification de requête intersite)
| Protection | Où |
|---|---|
| `SameSite=Lax` : le cookie n'est pas envoyé sur les requêtes mutantes intersites | `lib/admin/auth.ts` |
| **Vérification d'origine** : toute requête POST/PATCH/PUT/DELETE portant un `Origin` étranger → 403 | `proxy.ts` |

### XSS (injection de script)
| Protection | Où |
|---|---|
| React échappe toutes les sorties ; aucun `dangerouslySetInnerHTML` dans le projet | UI |
| Handlebars échappe par défaut (`{{ }}`) toutes les données client dans les PDF ; les triple-stash `{{{ }}}` ne servent qu'à des valeurs internes de confiance (polices, couleurs du code) | `lib/pdf/templates/*` |
| **CSP** stricte : scripts self uniquement, images limitées à Cloudinary, `frame-ancestors 'none'`, `object-src 'none'`, `form-action 'self'` | `proxy.ts` |
| SVG refusé à l'upload (peut embarquer du script) — formats raster uniquement | `lib/cloudinary.ts` |

### SSRF (Puppeteer chargerait des URLs internes)
| Protection | Où |
|---|---|
| URL de photo acceptée en base **uniquement** si elle commence par `https://res.cloudinary.com/<notre-cloud>/` (création ET modification de produit) | `app/api/produits/*` |
| **Défense en profondeur** : re-filtrage des URLs au moment du rendu PDF — tout ce qui n'est pas notre Cloudinary devient un placeholder | `lib/pdf/render.ts` (`urlSure`) |
| `public_id` Cloudinary borné (300 car.) et `..` interdit | `app/api/produits/*` |

### Injection SQL
| Protection | Où |
|---|---|
| 100% des requêtes passent par Drizzle ORM (**requêtes paramétrées**, jamais de concaténation) | `lib/db`, routes |
| Tous les identifiants d'URL validés `Number.isInteger` avant usage | routes `[id]` |

### Déni de service / abus de ressources
| Protection | Où |
|---|---|
| Upload photo : taille bornée à 2 niveaux — proxy (Content-Length) **et** route (lecture bornée, couvre le transfert chunked) | `proxy.ts`, `app/api/upload-photo/route.ts` |
| Formats d'image vérifiés par liste blanche, ~10 Mo max | `lib/cloudinary.ts` |
| Génération PDF bornée par les limites métier (max 50 produits) + timeouts Puppeteer (60 s / 30 s) | `lib/pdf/browser.ts` |
| Toutes les chaînes saisies ont une longueur maximale validée côté serveur | routes |

### Secrets & configuration
| Protection | Où |
|---|---|
| Clés serveur (Cloudinary secret, DATABASE_URL, secrets) jamais dans le bundle navigateur — seul le cloud name est public | `.env.example` |
| `.env*` exclus de git | `.gitignore` |
| Cron protégé par secret comparé en **temps constant** | `app/api/cron/cleanup/route.ts` |
| `X-Powered-By` désactivé (pas de fuite de version) | `next.config.ts` |

### En-têtes de sécurité
`Content-Security-Policy`, `X-Content-Type-Options: nosniff`,
`X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`,
`Permissions-Policy` (caméra/micro/géoloc coupés), `Strict-Transport-Security`
(HSTS 1 an) — `proxy.ts` + `next.config.ts`.

### Divers
- Messages d'erreur **génériques** côté client, détail uniquement dans les logs serveur.
- `robots: noindex` — l'outil n'apparaît pas dans les moteurs de recherche.
- Suppression en cascade propre (client → catalogues → produits → photos Cloudinary) : pas de données orphelines.
- Route de débogage : aucune. Pages d'admin : toutes derrière authentification.

## 3. Limites connues (transparence)

1. **Le rate limiting est en mémoire** : sur Vercel, chaque instance serverless a
   son propre compteur. Pour un durcissement maximal, activer aussi
   « Attack Challenge Mode » dans les réglages Vercel (gratuit) ou brancher
   Upstash Redis. Risque résiduel faible : le délai de 800 ms/tentative reste
   appliqué partout et le mot de passe est long.
2. **`'unsafe-inline'` dans la CSP scripts** : requis par Next.js pour son
   hydratation. Risque résiduel très faible (aucune donnée n'est rendue en HTML
   brut).
3. **Un seul mot de passe opérateur** : c'est le choix du cahier des charges.
   Prends un mot de passe long (phrase de passe de 4-5 mots), il est comparé
   en temps constant et non stocké en base.
4. Aucune garantie chiffrée du type « 97% » ne serait sérieuse — en sécurité,
   on couvre des classes d'attaques. Celles du Top 10 OWASP applicables à
   cette application sont toutes traitées ci-dessus.

## 4. Audit des dépendances (npm audit)

Failles corrigées par mise à jour :
- **drizzle-orm → 0.45.2** : corrige une injection SQL via identifiants mal
  échappés (GHSA-gpj5-g38j-94v9).
- **next → 16.2.12** : corrige un contournement du proxy (GHSA-6gpp-xcg3-4w24),
  un déni de service des Server Actions, une SSRF sur serveurs custom et une
  confusion de cache.

Avis restants, **sans impact en production** (documentés par transparence) :
- `esbuild` / `brace-expansion` : outils de développement uniquement (drizzle-kit,
  eslint), jamais exécutés sur le serveur en ligne.
- `postcss` embarqué par Next : utilisé au build uniquement ; correctif à venir
  côté Vercel (`npm update next` de temps en temps).
- `sharp`/libvips embarqué par Next (optimisation d'images) : risque limité car
  seules les images de NOTRE Cloudinary sont autorisées (`remotePatterns`).

Geste d'entretien recommandé : une fois par mois, `npm update && npm audit`.

## 5. Bonnes pratiques d'exploitation (ton rôle)

- `ADMIN_PASSWORD` : phrase de passe longue, jamais partagée sur WhatsApp.
- `ADMIN_SESSION_SECRET` et `CRON_SECRET` : 32+ caractères aléatoires, différents.
- Active la **2FA sur tes comptes** Vercel, Neon, Cloudinary et GitHub — c'est
  le maillon le plus attaqué en pratique.
- Mets à jour les dépendances de temps en temps : `npm audit && npm update`.
