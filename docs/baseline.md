# Mesures de référence — build, démarrage, mémoire

Relevé du 2026-11-15, version `0.4.1`. Ces chiffres servent de point de comparaison :
toute régression notable (build ×2, démarrage ×1,5) doit être expliquée avant d'être acceptée.

## Build

Mesuré dans GitHub Actions (`ubuntu-latest`, 4 vCPU, 16 Go), seuls endroits où le build
s'exécute — la machine de développement a 3,2 Go de RAM et `build:cdn` en demande ~6.

| Étape | Durée |
|---|---|
| `npm ci` | 44–49 s |
| `npm run typecheck` | 8 s |
| `npm test` (89 tests) | 4 s |
| `npm run lint:dead` (knip) | 2 s |
| `npm run build:cdn` (`NODE_OPTIONS=--max-old-space-size=6144`) | 93 s |
| Job « Build CDN » complet | ~2 min 40 |

## Démarrage

Site public (`https://nobellagent.github.io/sqljob/`), réseau et cache désactivés, Chromium
(profil de test), mesure par `PerformanceNavigationTiming`.

| Indicateur | Valeur |
|---|---|
| `domInteractive` | 0,83 s |
| `loadEventEnd` | 4,4 s |
| Ressources chargées | 23 |
| JavaScript transféré | 2,24 Mo |
| Total transféré | 2,42 Mo |

Le chargement inclut DuckDB (wasm chargé depuis le CDN, hors budget de build) et Monaco ;
le `load` à 4,4 s correspond à la fin du chargement des chunks éditeur, pas au premier rendu
utilisable — la barre d'outils et la page sont interactives dès ~1 s.

## Mémoire

| Indicateur | Valeur |
|---|---|
| Tas JS utilisé après démarrage | 32,3 Mo |
| Limite du tas (navigateur) | 1 756 Mo |

Un document de 200 000 lignes charge ~256 Ko de données dans OPFS ; c'est le volume de données,
pas le code, qui fait croître la mémoire — l'onglet reste sous 100 Mo pour un usage courant.

## Ce que ces mesures ne couvrent pas

- Pas de mesure sur mobile réel ni sur Firefox/Safari.
- Pas de mesure de l'exécution SQL à froid (première requête sur une base vide vs table chargée).
- Les chiffres de build varient de ±20 % selon la charge des runners GitHub.
