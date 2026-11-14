# Changelog

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
