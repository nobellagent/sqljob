# Changelog

## 0.4.0 — 2026-11-15

### Store immuable : fin de la dette de mutation

Le store ne mute plus l'état en place. Toutes les écritures passent par `produce()` (voir
`src/app/store/mutations.ts`) : une branche modifiée change de référence, ce qui suffit à React
pour re-rendre. Le compteur de version `_rev`, l'action `forceUpdate()` et le contournement
`setAutoFreeze(false)` disparaissent (vérifié : plus aucune occurrence dans `src`).

- **`store/mutations.ts`** : `updateCellInState`, `updateGroupInState`, `updateCellByIdInState`,
  `updateGroupByIdInState`, `getCellByIdInState`, plus `cloneCellForExecution` / `commitCellInState`
  pour les exécutions asynchrones (statut, résultats, tables Arrow) qui écrivent sur une copie de
  travail puis la valident en une fois.
- **Actions** `updateCellAt`, `updateGroupAt`, `updateGroupById`, `updateCellById` : le mutateur
  reçoit un brouillon immer, donc le code d'édition existant est réutilisé tel quel.
- **Slices** : `cells`, `groups`, `files`, `copyPaste`, `export`, `parameters`, `execution` — les
  groupes et cellules ne sont plus modifiés par référence ; `executionSlice` et le chargement de
  source travaillent sur une copie avant validation.
- **Composants** : `GroupModals`, `CellConfigModal`, `SqlBlockEditor`, `CellHeader`, `SqlEditorWidget`,
  les 12 corps de cellule et `GroupContainer` écrivent via les actions de mise à jour. L'instance
  EasyMDE n'est plus stockée dans la cellule (elle vit dans une `ref`).
- **Abonnements** : les composants qui s'abonnaient au compteur de version lisent désormais les
  données réelles (groupes de la page, option ECharts, contenu HTML, run Univer).
- **Tests** : 8 tests sur les mises à jour immuables (identité, branches partagées, cellules
  imbriquées, recherche par identifiant), et un test de rendu par type de cellule.

## 0.3.1 — 2026-11-15

- **Correction de la persistance du document** : les cellules étaient mutées en place et portaient
  des références DOM, deux causes qui empêchaient toute écriture dans IndexedDB.
  - détection des changements par sérialisation du contenu (le store signale les mutations profondes
    via `_rev`, pas par une nouvelle référence de `pages`) ;
  - `sanitizeForStorage()` retire DOM, callbacks, caches d'exécution et cycles avant stockage ;
    `File`/`Blob`/`Date`/`ArrayBuffer` sont conservés.
  - l'annulation (`history.undo`) utilise la même copie stockable : `cell.add` ne lève plus
    « Converting circular structure to JSON ».
- Vérifié : ajout d'un groupe + d'une cellule markdown → rechargement → les deux cellules sont
  rendues, l'IDB contient `sql,markdown`.

## 0.3.0 — 2026-11-15

### Commandes

- **14 commandes** : `notebook.runAll`, `notebook.runGroup`, `notebook.runCell`, `page.add`,
  `page.setActive`, `group.add`, `group.delete`, `cell.add`, `cell.delete`, `history.undo`,
  `export.config`, `project.openGist`, `db.reset`, `db.query`.
- **Annulation** : instantané pris avant chaque commande `undoable`, pile de 25 entrées,
  `window.sqljob.commands.undo()`.
- **Automatisation par URL** : `#cmd=db.query&input={"sql":"SELECT 1"}` ; le hash est consommé
  après exécution.

### Persistance

- **Document dans IndexedDB** (`sqljob/project/current`), sauvegarde débattue à 500 ms et vidée
  sur `pagehide`.
- Restauration au démarrage **uniquement** en l'absence de configuration externe
  (`#defaultConfigBase64`, `?gist=`, `?config=`…), sinon la configuration chargée garde la priorité.
- Indicateur de base dans la barre d'outils (taille, mode OPFS/RAM) et pied de panneau Sources
  avec réinitialisation.

### Outillage

- `fake-indexeddb` pour tester la persistance en Node.
- `.gitignore` complété ; 21 branches `claude/*` fusionnées supprimées du remote.
- `CONTRIBUTING.md`, `SECURITY.md`, `docs/export-formats.md`.

## 0.2.1 — 2026-11-14

- La release attache désormais `dist-cdn.zip` (bundle complet) au lieu des deux fichiers d'entrée :
  le build étant découpé en chunks, `sqljob.js` seul (31 octets) était inutilisable.

## 0.2.0 — 2026-11-14

### Socle

- Alignement de tous les paquets `@sqlrooms/*` sur `0.29.0` (stable).
- Suppression des `overrides`, du pin `@sqlrooms/pivot@0.29.0-rc.2` et des stubs Vite associés.
- Déclaration explicite de `@sqlrooms/duckdb-core` et `zod@4`.
- Migration du layout `mosaic` vers l'arbre `split` / `panel` / `tabs` de la 0.29.
- Fin du mode « notebook sqlrooms » expérimental : une seule implémentation.

### Command Registry

- `CommandRegistry` typé : identifiants `domaine.action`, schéma zod, permissions
  (`read` / `write` / `external`), catégories, annulation.
- Commandes noyau : `notebook.runAll`, `export.config`, `db.reset`, `db.query`.
- API d'automatisation : `window.sqljob.commands.execute(id, input)`.

### Offline

- Base DuckDB persistante `opfs://sqljob.db` (contexte sécurisé requis).
- `INSTALL excel` non bloquant hors ligne.
- Service worker + manifeste PWA : démarrage hors réseau après une première visite.

### Qualité

- Scripts `typecheck`, `lint`, `test`, `ci`.
- CI GitHub Actions : typecheck, lint, tests, build CDN, artefacts.
- Workflow de release : build, `npm publish --provenance`, artefacts attachés.
- 24 tests unitaires (SqlBlock AST ↔ SQL, rôles ECharts, Command Registry).

### Packaging

- `@ihatexcel/sqljob`, `files: ["dist-cdn"]`, licence AGPL-3.0-or-later, `engines.node >= 22`.
