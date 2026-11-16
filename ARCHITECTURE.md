# Architecture

État de référence : branche `next`, SQLRooms `0.29.0`.

## Principes

1. **Un seul modèle de document.** `pages → groupes → cellules` est la source de vérité. Le notebook
   natif SQLRooms (`@sqlrooms/cells` / `@sqlrooms/notebook`, expérimental) a été retiré : il ne couvre
   ni pages, ni groupes, ni conditions, ni boucles, ni DAG. Le notebook custom est le produit.
2. **Un seul chemin de rendu.** Un type de cellule est décrit par une définition (schéma, rendu,
   exécution, export) et non par une cascade de `if (cell.type === …)`.
3. **Aucun état applicatif sur `window`.** Seul `window.sqljob` est exposé, comme API d'automatisation.
4. **Aucune mutation en place.** L'état est immuable : toute écriture passe par
   `store/mutations.ts` (`updateCellAt`, `updateGroupAt`, `updateCellById`, `updateGroupById`) ou par
   un `produce()` explicite dans un slice. Une branche modifiée change de référence, ce qui suffit à
   React. Les exécutions asynchrones travaillent sur `cloneCellForExecution()` puis valident d'un
   bloc avec `commitCellInState()`.
5. **Le data layer est injectable.** `DuckDBManager` implémente une interface ; il n'est pas consulté
   en statique depuis les composants.
6. **Aucun fichier source > 20 KB** hors code généré (objectif P3 ; les fichiers actuels au-delà sont
   listés dans le plan de restructuration).

## Couches

```
App shell (room-shell : layout en arbre, panneaux, thème)
  └─ Document sqljob (pages → groupes → cellules)
       ├─ modèles métier : conditions, boucles, paramètres, DAG
       └─ rendu via CellRegistry
  └─ Command Registry (src/core/commands.ts)
       ├─ UI : les boutons appellent executeCommand(id, input)
       ├─ automatisation : window.sqljob.commands.execute(id, input)
       └─ plugins (phase ultérieure) : même contrat
  └─ Data layer : DuckDBManager (duckdb-wasm) + OPFS
       └─ persistance : OPFS (base) / localStorage (layout) / IndexedDB (projet, à venir)
  └─ Distribution : bundle ESM (jsDelivr) + PWA (service worker)
```

## Command Registry

Toute action de l'application est une commande déclarée :

```ts
defineCommand({
  id: 'notebook.runAll',        // domaine.action
  label: 'Tout exécuter',
  category: 'query',            // query | project | export | data
  permission: 'write',          // read | write | external
  undoable: false,
  params: z.object({}),         // optionnel, validé avant exécution
  execute: async (input, ctx) => { /* ... */ },
})
```

Le `CommandContext` n'expose que quatre capacités : `project`, `duckdb`, `ui` et `history`. Il ne donne
**jamais** accès au store Zustand ni à l'objet DuckDB brut — c'est ce qui permettra d'ouvrir le
registre aux plugins sans casser l'application à chaque évolution interne.

Une commande `undoable` déclenche la prise d'un instantané du document **avant** exécution ; la pile
(25 entrées) vit dans l'hôte, le registre ne manipule que des instantanés opaques. `history.undo`
est elle-même une commande, donc accessible depuis l'URL ou l'API.

Automatisation : `window.sqljob.commands.execute(id, input)` et
`#cmd=<id>&input=<json>` (le hash est consommé après exécution).

## Plugins de cellule

Un type de cellule peut venir d'un plugin : `src/core/plugins/` valide un manifeste, vérifie
l'empreinte sha256 des octets téléchargés, puis enregistre le type dans le registre de rendu.

| Élément | Rôle |
|---|---|
| `cell-plugin.json` | `id`, `version`, `sqljobMinVersion`, `types`, `permissions`, `entry`, `integrity`, `cellTypes` |
| `registry.json` | liste des plugins, `size`, `withdrawn`, `blocklist` (`id` ou `id@version`) |
| `core/plugins/loader` | installation (taille + empreinte) et activation (`register`/`render`) |
| `core/plugins/cellSchema` | traduction de `cellTypes` en schéma natif (requêtes + champs) |
| `core/plugins/hostApi` | permissions vérifiées : `query` en lecture seule, `download`, stockage |
| `cellTypes/PluginBody` | rendu dans une iframe `sandbox="allow-scripts"` |

Le rendu est isolé de l'application (pas de `allow-same-origin`) ; le code du plugin, lui, reste
du JavaScript non confiné. Les permissions sont **vérifiées à chaque appel** de l'API hôte, mais
elles ne bornent ni le CPU ni le réseau : un plugin peut toujours faire des requêtes sortantes et
consommer de la mémoire. Voir `docs/plugins.md`.

## Offline

| Couche | Technologie | Contenu |
|---|---|---|
| Config UI | `persistSliceConfigs` → localStorage | layout, thème |
| Données | OPFS (`opfs://sqljob.db`) | tables DuckDB |
| Projet | IndexedDB (`sqljob/project/current`) | pages, groupes, cellules |
| Ressources | Service worker (`public/sw.js`) | JS, CSS, wasm, workers |

Le document est écrit dans IndexedDB 500 ms après la dernière modification et une dernière fois sur
`pagehide`. Au démarrage, il n'est restauré que si aucune configuration externe n'est fournie
(`#defaultConfigBase64`, `?gist=`, `?config=`…) — sinon la configuration chargée gagne.

## Pourquoi DuckDB reste chargé depuis le CDN

`@duckdb/duckdb-wasm` pèse **33 Mo** (`duckdb-eh.wasm`). Le bundler dans `dist-cdn` ferait un paquet
que jsDelivr refuse (limite de 20 Mo par fichier) et ferait exploser le temps de build. La version est
donc figée par constante (`DUCKDB_WASM_VERSION`) et le service worker met le wasm et le worker en
cache : après une première visite en ligne, l'application démarre et exécute du SQL hors réseau.
Le moteur alternatif `ducklings` reste chargé à la demande, uniquement s'il est sélectionné.

## Pièges connus (vérifiés en exécution)

- **`resolvePanelIdentity` ignore `id`** : un nœud `{type:'panel', id:'main'}` ne rend rien ; il faut
  `panel: 'main'`. Test de régression dans `tests/layout.test.ts`.
- **`ConfigManager.loadConfigFromGist()` ne renvoie jamais `null`** : il retombe sur la config par
  défaut. Toute logique « pas de config → restaurer le local » doit tester la présence réelle d'une
  source (`#defaultConfigBase64`, paramètres d'URL), pas la valeur de retour.
- **`build:cdn` demande ~6 Go de RAM** : il se lance en CI, jamais sur un poste à 3 Go.
- **Les paquets `@sqlrooms/*` ont des imports internes sans extension** : Vitest doit les inliner
  (`server.deps.inline`) sinon la résolution Node échoue.

Le service worker met en cache au fil de l'eau le bundle et les dépendances jsDelivr
(`@duckdb/duckdb-wasm`, monaco) : après une première visite en ligne, l'application démarre hors
réseau. `INSTALL excel` est non bloquant hors ligne.

## Décisions assumées

- **ECharts reste le moteur de graphiques.** La syntaxe SQL à rôles (`::XAXIS`, `::BARCHART`) est un
  différenciateur produit ; Mosaic ne la remplace pas.
- **`@sqlrooms/documents` / `blocks` ne sont pas adoptés.** Un document éditorial n'est pas un
  notebook de calcul.
- **L'export HTML single-file complet n'est pas promis.** Un `file://` ne charge ni module ES, ni
  worker, ni wasm par URL relative ; le format par défaut est le dossier autonome.
- **Les plugins tiers ne sont pas sandboxés.** Une déclaration de permissions n'est pas une garantie
  d'exécution ; la documentation doit le dire explicitement.
