# Formats d'export

Trois formats, trois usages. Le format par défaut est le **dossier ZIP**.

## 1. `.zip` portable — recommandé

Contenu : `index.html`, `dist-cdn/` complet, `sw.js`, `manifest.webmanifest`.

- Fonctionne **hors ligne** après ouverture via un serveur local (`python3 -m http.server`).
- Ne fonctionne **pas** ouvert par double-clic (`file://`) : les modules ES, les Workers et le
  chargement du `.wasm` y sont bloqués par le navigateur. Ce n'est pas un défaut de sqljob,
  c'est une règle des navigateurs.
- Les requêtes SQL restent exécutables dans le document exporté.

## 2. Export `lite` (embed CDN)

Page HTML de quelques lignes qui charge le web component depuis jsDelivr :

```html
<script type="module"
        src="https://cdn.jsdelivr.net/gh/nobellagent/sqljob@gh-pages/dist-cdn/sqljob.js"
        crossorigin="anonymous"></script>
<sqljob-app></sqljob-app>
```

- Nécessite un réseau au premier chargement.
- Taille minimale ; le bundle suit les déploiements de la branche `gh-pages`.
- Pour figer une version, remplacer `@gh-pages` par le SHA du commit de `gh-pages`
  (`git ls-remote origin gh-pages`) : jsDelivr sert alors un contenu immuable.
- Le paquet npm `@ihatexcel/sqljob` **n'est pas publié** (voir `docs/release.md`) : l'URL
  `cdn.jsdelivr.net/npm/...` ne fonctionne pas.

### SRI (intégrité)

Le bundle est découpé en chunks : `sqljob.js` ne fait que quelques octets et importe un chunk
haché. À chaque build, `tools/sri.mjs` calcule les empreintes sha384 de tous les fichiers et écrit
`dist-cdn/integrity.json` ; le manifeste est servi à côté du bundle.

```html
<script type="module"
        src="https://cdn.jsdelivr.net/gh/nobellagent/sqljob@gh-pages/dist-cdn/sqljob.js"
        integrity="sha384-…"
        crossorigin="anonymous"></script>
```

L'attribut `integrity` se lit dans le manifeste, clé `sqljob.js`. Il couvre l'entrée ; comme
l'entrée référence ses chunks par nom haché, une entrée vérifiée fixe le chunk chargé. Pour une
vérification complète (chaque chunk), comparer les empreintes du manifeste à celles des fichiers
téléchargés :

```bash
curl -s https://cdn.jsdelivr.net/gh/nobellagent/sqljob@gh-pages/dist-cdn/integrity.json
# puis, pour chaque fichier listé :
openssl dgst -sha384 -binary fichier.js | openssl base64 -A
```

## 3. JSON / Base64 / Gist

- **JSON** : le document complet (pages, groupes, cellules), relisible et versionnable.
- **Base64** : le même JSON encodé, pour transport dans une URL.
- **Gist** : JSON poussé sur GitHub, chiffré AES-GCM si l'option est active.

## Ce qui n'est pas promis

Un **fichier HTML unique** contenant tout (éditeur, tableur, wasm). Techniquement, cela suppose
d'inliner un wasm de 33 Mo et un éditeur de plusieurs Mo : le build dépasse la mémoire disponible
et le résultat n'ouvre pas en `file://`. Ne pas le proposer comme format.
