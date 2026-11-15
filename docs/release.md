# Publier une version

Pas de `changesets` : la règle tient en trois lignes, et le dépôt est seul consommateur de son
paquet. Ce qui compte est que la version, le journal et le tag racontent la même chose.

## Règle

1. `package.json` : incrémenter `version` (SemVer).
2. `CHANGELOG.md` : une section `## X.Y.Z — AAAA-MM-JJ` en tête, avec le détail des changements.
3. Commit `docs(X.Y.Z): journal et version`, puis tag annoté `vX.Y.Z` poussé sur `main`.

Le tag déclenche `.github/workflows/release.yml` : typecheck, tests, build du web component,
`npm pack --dry-run`, calcul des empreintes SRI, archive `dist-cdn.zip` attachée à la release GitHub.

## Publication npm : volontairement inactive

Le paquet s'appelle `@ihatexcel/sqljob`. Ce scope appartient à l'organisation npm `ihatexcel`,
pas à ce fork, et le paquet n'existe pas sur le registre. L'étape `npm publish` du workflow reste
donc inerte : elle n'est exécutée que si le secret `NPM_TOKEN` existe, et il n'existe pas.

Conséquence pratique : **le paquet n'est pas distribuable via `npm install`**. Les deux canaux réels
sont le ZIP de la release GitHub et le bundle CDN servi depuis la branche `gh-pages`
(voir `export-formats.md`).

Pour activer une publication plus tard, il faudrait d'abord renommer le paquet dans un scope
réellement possédé (par exemple `@nobellagent/sqljob`), puis créer un jeton npm de publication et
l'enregistrer comme secret `NPM_TOKEN`.

## Vérifications après publication

- `gh release view vX.Y.Z` : l'archive `dist-cdn.zip` est attachée.
- Le site déployé sert bien la nouvelle version : `sqljob.js?v=<sha>` dans `index.html`.
- `dist-cdn/integrity.json` est présent et correspond aux fichiers servis.
