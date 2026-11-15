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
<script type="module" src="https://cdn.jsdelivr.net/npm/@ihatexcel/sqljob/dist-cdn/sqljob.js"></script>
<sqljob-app></sqljob-app>
```

- Nécessite un réseau au premier chargement.
- Taille minimale, se met à jour avec la version du paquet.
- SRI (`integrity`, `crossorigin`) à ajouter au build pour figer la version.

## 3. JSON / Base64 / Gist

- **JSON** : le document complet (pages, groupes, cellules), relisible et versionnable.
- **Base64** : le même JSON encodé, pour transport dans une URL.
- **Gist** : JSON poussé sur GitHub, chiffré AES-GCM si l'option est active.

## Ce qui n'est pas promis

Un **fichier HTML unique** contenant tout (éditeur, tableur, wasm). Techniquement, cela suppose
d'inliner un wasm de 33 Mo et un éditeur de plusieurs Mo : le build dépasse la mémoire disponible
et le résultat n'ouvre pas en `file://`. Ne pas le proposer comme format.
