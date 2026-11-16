# sqljob

Notebook SQL local-first : préparer, analyser et partager des données dans le navigateur — sans serveur, sans compte, sans cloud.

**[Ouvrir l'application →](https://ihatexcel.github.io/sqljob)**

---

## À quoi ça sert

sqljob sert à construire et diffuser des **moulinettes** : des enchaînements SQL paramétrés que
quelqu'un d'autre peut ouvrir et exécuter sans rien installer.

- pipelines ETL entièrement côté client (DuckDB-WASM)
- interfaces de calcul ou de simulation pilotées par SQL
- rapports autonomes partageables (HTML/JSON)
- notebooks paramétrés diffusés par GitHub Gist, avec chiffrement optionnel

---

## Fonctionnalités

- Import CSV, Parquet et Excel directement dans DuckDB
- Notebook multi-pages : groupes, cellules auto-exécutables, conditions, boucles, DAG
- Graphiques par rôles SQL : `SELECT date::XAXIS, revenue::BARCHART FROM sales`
- Paramètres, groupes conditionnels, cellules tableur Univer, transformations SQLBlock
- Export HTML / JSON / Base64 / PDF, partage Gist chiffré (AES-GCM)
- Intégration en web component : `<sqljob-app>`
- **Offline** : base DuckDB persistante (OPFS) + PWA (service worker)
- **Automatisation** : `window.sqljob.run('notebook.runAll')`
- **Plugins** : types de cellule tiers (manifeste + registre + empreinte sha256), rendus en iframe sandboxée

---

## Démarrage

```bash
git clone https://github.com/ihatexcel/sqljob.git
cd sqljob
npm install
npm run dev
```

Ou directement en ligne, sans installation.

---

## Stack

| Couche | Technologie |
|---|---|
| Moteur SQL | DuckDB-WASM 1.32.0 (moteur DuckDB 1.5.x) |
| UI | React 18 + [SQLRooms](https://sqlrooms.org/) 0.29.0 |
| État | Zustand 5 + Immer |
| Build | Vite 5 + TypeScript |
| Styles | Tailwind CSS 4 |
| Graphiques | ECharts 5 |
| Tableur | Univer |

---

## Développement

```bash
npm run dev          # serveur de dev (localhost:5173)
npm run build        # build application → dist/
npm run build:cdn    # bundle web component → dist-cdn/
npm run dev:cdn      # dev du web component (localhost:5174)

npm run typecheck    # tsc --noEmit
npm run lint         # eslint (code nouveau : core, commands, tests)
npm test             # vitest
npm run ci           # typecheck + lint + tests
```

La CI (`.github/workflows/ci.yml`) exécute typecheck, lint, tests et build CDN sur chaque push.
Le déploiement (`deploy.yml`) publie sur GitHub Pages ; la release (`release.yml`) publie sur npm
au tag `v*` et attache les artefacts.

> Le build CDN consomme ~6 Go de RAM : il est conçu pour tourner en CI, pas sur un poste contraint.

---

## Structure

```
src/
  app/
    components/       # panneaux, cellules, modales
    hooks/            # useCommands (branchement du registre)
    store/            # store Zustand + slices
    room.tsx          # racine RoomShell
  core/
    commands.ts       # CommandRegistry (contrat commun)
    appCommands.ts    # commandes noyau
  lib/
    DuckDBManager.ts  # moteur DuckDB + OPFS
    ConfigManager.ts  # config notebook
    EChartSqlParser.ts
    SqlBlockService.ts
  web-component/
    sqljob-app.ts
public/
  sw.js               # service worker (offline)
  manifest.webmanifest
tests/                # vitest
```

Voir [ARCHITECTURE.md](./ARCHITECTURE.md) pour les règles et les décisions assumées.

---

## Licence

AGPL-3.0-or-later — © Théo Nobella-Pichonnier
