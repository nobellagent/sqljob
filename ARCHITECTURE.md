# Architecture

État de référence : branche `next`, SQLRooms `0.29.0`.

## Principes

1. **Un seul modèle de document.** `pages → groupes → cellules` est la source de vérité. Le notebook
   natif SQLRooms (`@sqlrooms/cells` / `@sqlrooms/notebook`, expérimental) a été retiré : il ne couvre
   ni pages, ni groupes, ni conditions, ni boucles, ni DAG. Le notebook custom est le produit.
2. **Un seul chemin de rendu.** Un type de cellule est décrit par une définition (schéma, rendu,
   exécution, export) et non par une cascade de `if (cell.type === …)`.
3. **Aucun état applicatif sur `window`.** Seul `window.sqljob` est exposé, comme API d'automatisation.
4. **Aucune mutation hors immutabilité.** `setAutoFreeze(false)` et `forceUpdate()` sont des dettes à
   résorber (phase P3) ; tout nouveau code passe par `produce()` et des sélecteurs.
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

Le `CommandContext` n'expose que trois capacités : `project`, `duckdb`, `ui`. Il ne donne **jamais**
accès au store Zustand ni à l'objet DuckDB brut — c'est ce qui permettra d'ouvrir le registre aux
plugins sans casser l'application à chaque évolution interne.

## Offline

| Couche | Technologie | Contenu |
|---|---|---|
| Config UI | `persistSliceConfigs` → localStorage | layout, thème |
| Données | OPFS (`opfs://sqljob.db`) | tables DuckDB |
| Projet | IndexedDB (à venir) | pages, groupes, cellules |
| Ressources | Service worker (`public/sw.js`) | JS, CSS, wasm, workers |

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
