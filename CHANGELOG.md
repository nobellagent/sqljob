# Changelog

## 0.7.0 — 2026-11-16

### Plugins interactifs, et pdfme en plugin

- **`mount(root, contexte)`** : un plugin peut désormais interagir après le rendu. Le contexte
  contient `{type, cell, config, rows, queries, theme, host}`. Sans `mount`, un plugin reste un
  simple rendu HTML ; avec, il gère des boutons sans que l'application connaisse son interface.
- **`config`** : les champs déclarés dans `cellTypes[].schema` sont transmis sous forme d'objet
  (`config.template`), et leurs valeurs par défaut sont appliquées à la création de la cellule.
- **`pdfme-plugin`** publié au registre : génération de PDF depuis un template pdfme, avec les deux
  requêtes (`data`, `filename`) et un bouton de téléchargement. Module bundlé de 1,6 Mo
  (`npm run build:plugin-pdfme`), sous la limite d'installation.
- La cellule pdfme **native reste en place** : le plugin vit à côté, sous le type distinct
  `pdfme-plugin`. C'est la démonstration que l'architecture P6 supporte un type avancé sans code
  dans le cœur — pas encore un remplacement.
- Tests : le registre publié est vérifié de bout en bout (chaque entrée → manifeste → octets →
  empreinte → taille), pour tous les plugins, pas seulement l'exemple.

## 0.6.0 — 2026-11-16

### Types de cellule déclarés par le manifeste, API hôte contrôlée

Un plugin peut désormais se comporter comme un type natif, et appeler l'application par une API
dont chaque requête est vérifiée côté hôte.

- **`cellTypes`** (P6.1) : chaque type peut déclarer un titre, une icône, jusqu'à 4 **requêtes**
  et des **champs de configuration** (`text`, `textarea`, `number`, `select`, `checkbox`).
  Le schéma est injecté dans `CELL_TYPE_SCHEMAS` à l'activation : création, fiche de configuration,
  export et exécution fonctionnent sans code d'interface côté plugin.
- **Participation au DAG** : `executePluginCell` exécute les requêtes déclarées dans l'ordre, avec
  les paramètres habituels, et poste les résultats par clé (`queries.data`, `queries.filename`).
  Un type sans requête reçoit `queries = {}`.
- **API hôte** (P6.3) : `sqljobHost.query`, `sqljobHost.download`, `sqljobHost.storage.*`.
  Chaque appel exige la permission correspondante (`duckdb:read`, `ui:download`, `storage:local`),
  vérifiée à l'exécution et pas seulement affichée. La requête doit être un `SELECT`/`WITH` unique,
  sans écriture, avec un délai de 15 s ; les noms de téléchargement sont assainis ; le stockage est
  préfixé par l'identifiant du plugin et borné à 100 Ko par valeur.
- **Limites** (P6.2) : module jusqu'à 8 Mo, embarquement dans un export jusqu'à 4 Mo (au-delà,
  l'URL d'origine est conservée).
- **Plugin d'exemple** enrichi : `hello-cell` déclare une requête, trois champs et affiche le
  nombre de lignes reçues.

Ce qui n'est **pas** fait, volontairement : la cellule pdfme reste native (décision de Théo), et
l'iframe n'isole toujours pas l'exécution (CPU, réseau) — c'est écrit dans `docs/plugins.md`.

## 0.5.2 — 2026-11-16

### Les exports HTML embarquent les plugins du document

- L'export HTML n'emportait aucun plugin : une cellule d'un type fourni par un plugin restait vide,
  et l'onglet Plugins du fichier exporté échouait sur `fetch('registry.json')`
  (`NetworkError when attempting to fetch resource`).
- **Sélection** : seuls les plugins dont un type est utilisé par le document sont embarqués
  (`collectDocumentCellTypes`, parcours récursif des groupes et sous-groupes).
- **Embarquement** : manifeste + URL d'origine + source du module (≤ 512 Ko) dans
  `<script type="application/json" id="sqljobPluginBundle">` ; les `<` sont échappés en `\u003c`.
- **Chargement** : au démarrage, les plugins embarqués sont activés sans réseau ; l'iframe crée un
  `blob:` à partir de la source, donc le rendu fonctionne depuis `file://`.
- **Onglet Plugins** : section « Embarqués dans le document », et message explicite hors ligne à la
  place de l'erreur réseau.
- Limite assumée : l'export ZIP n'embarque pas les plugins — il reste le format « tout le bundle »,
  à compléter si un besoin réel apparaît.

## 0.5.1 — 2026-11-16

### Les exports chargent la version de l'instance, plus celle du projet d'origine

L'export HTML écrivait en dur `https://ihatexcel.github.io/sqljob/dist-cdn/sqljob.js` : un fichier
exporté depuis ce fork chargeait donc le déploiement amont, c'est-à-dire une version ancienne du
code. La base est maintenant déduite du contexte (`src/lib/appBase.ts`) :

- URL du module courant quand il est servi depuis un `dist-cdn/` (GitHub Pages, zip local, jsDelivr) ;
- sinon dossier de la page, si elle est servie en http(s) ;
- sinon déploiement canonique (`file://`, contexte inconnu) ;
- surcharge possible par `localStorage["sqljob.export.baseUrl"]`.

Même correction pour les liens de partage Gist (`generateSqljobUrl`) et le lien Documentation, qui
pointaient aussi vers l'amont. Test de non-régression : `tests/app-base.test.ts`.

## 0.5.0 — 2026-11-15

### Plugins de cellule

Un tiers peut ajouter un type de cellule sans toucher au cœur : un module ES, un
manifeste `cell-plugin.json` et une entrée de registre.

- **`src/core/plugins/`** : `parseManifest` / `parseRegistry` (validation stricte, refus en
  bloc), `resolveEntry` (blocklist, retrait, version minimale), empreinte sha256 et taille
  vérifiées avant tout chargement, stockage local des plugins installés.
- **Chargement** : le module est importé **dans une iframe** `sandbox="allow-scripts"`, sans
  `allow-same-origin` ; `render({type, cell, rows, theme})` renvoie du HTML. Le code du plugin
  n'accède ni au DOM de l'application, ni à son stockage, ni à son origine.
- **Onglet Plugins** (icône puzzle) : chargement du registre, permissions affichées avant
  installation, activation/désactivation, désinstallation.
- **Commandes** : `sqljob.run(id, input)` en plus de `sqljob.commands.execute`, et alias
  `export.html`, `export.json`, `gist.save`.
- **Plugin d'exemple** `hello-cell` dans `public/plugins/`, registry `public/registry.json` ;
  l'empreinte est vérifiée par la CI (`tests/plugin-example.test.ts`).
- **Honnêteté documentée** (`docs/plugins.md`) : l'iframe isole l'affichage, pas l'exécution. Les
  permissions sont une déclaration, pas une barrière ; le registre protège contre une altération
  en transit, pas contre un auteur malveillant.

## 0.4.1 — 2026-11-15

### Découpage : plus aucun fichier source au-dessus de 20 Ko

- **`SqlBlockEditor.tsx` (182 Ko) → 28 modules** : `editor/config`, `schema`, `session`,
  `useStepEyeData`, `ui`, `distinct`, `varInput`, `filters`, une fabrique par type d'étape
  (`editor/steps/*`), les parties d'assemblage (`editor/parts/*`) et un hook `useSqlBlockEditor`
  qui porte l'état et les handlers. Le composant ne garde que la mise en page ; les imports
  existants continuent de fonctionner via `editor/stepParts.tsx` (barrel).
- **`executionSlice.ts` (73 Ko) → 6 fabriques** : `groupRun`, `zipExport`, `sqlExec`, `simpleCells`,
  `documents`, `richCells`, plus `execution/helpers.ts`. Le slice recompose par spread ; les 34
  méthodes sont conservées à l'identique (vérifié par comparaison des signatures).
- **Code mort supprimé** : `NotebookLayout.tsx`, les hooks `useCells`/`useExecution`/`useFiles`/
  `useGroups`, `GenericHtmlBody` ; exports inutilisés dé-exportés dans 26 fichiers.
- **Dépendances** : six paquets inutilisés retirés (`@codemirror/commands`, `@codemirror/language`,
  `@codemirror/search`, `@sqlrooms/canvas`, `@sqlrooms/cells`, `@sqlrooms/notebook`), huit
  dépendances implicites déclarées (Monaco, Univer, `@sqlrooms/monaco-editor`).
- **`knip`** : configuration `knip.json`, script `lint:dead`, exécution en CI. Le dépôt est propre
  (aucun export mort, aucun fichier inutilisé).

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
