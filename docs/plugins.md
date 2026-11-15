# Plugins de cellule

Un plugin ajoute un ou plusieurs types de cellule sans modifier le cœur. Il se
distribue comme un module ES + un manifeste, référencés par un registre statique.

## Ce que fait l'application

1. lit le registre (`registry.json`, surchargeable par la clé `sqljob.plugins.registryUrl`) ;
2. vérifie que le plugin n'est pas bloqué, retiré, ni incompatible avec la version courante ;
3. télécharge le module et vérifie **taille** puis **empreinte sha256** ;
4. enregistre le plugin, et lui confie le rendu de ses cellules dans une iframe
   `sandbox="allow-scripts"` (sans `allow-same-origin`).

Rien n'est chargé avant l'étape 3. Un module dont l'empreinte diffère est refusé,
et rien n'est écrit dans le stockage local.

## Manifeste `cell-plugin.json`

```json
{
  "id": "hello-cell",
  "name": "Hello Cell",
  "description": "Type de cellule d'exemple.",
  "version": "1.0.0",
  "sqljobMinVersion": "0.4.0",
  "types": ["hello"],
  "permissions": ["ui:render"],
  "entry": "hello-cell.mjs",
  "integrity": "sha256-zt+okTzJ5yo2MtC4YJ12GyMNfL0TdOFeIHRRAfGvcOA="
}
```

| Champ | Règle |
|---|---|
| `id` | minuscules, chiffres, `-` et `.` ; 64 caractères au plus |
| `version`, `sqljobMinVersion` | SemVer `x.y.z` |
| `types` | 1 à 8 types, jamais un type du cœur (`sql`, `markdown`, …) |
| `permissions` | `duckdb:read`, `duckdb:write`, `ui:render`, `storage:local`, `network:<hôte>` |
| `entry` | chemin relatif, `.js` ou `.mjs`, sans `..` |
| `integrity` | `sha256-<base64>` des octets du module |

Un manifeste invalide est refusé en bloc : l'application ne tente pas de réparer.

## Registre `registry.json`

```json
{
  "schema": 1,
  "updatedAt": "2026-11-15",
  "blocklist": ["plugin-malveillant", "autre@1.2.3"],
  "plugins": [ { "...": "manifeste + size + withdrawn" } ]
}
```

- `blocklist` accepte un identifiant seul ou `id@version` ; le contrôle a lieu
  avant tout téléchargement.
- `withdrawn: true` retire un plugin de l'installation sans le bloquer.
- `size` est vérifié en plus de l'empreinte (échec rapide sur un fichier tronqué).

Le registre du dépôt est `public/registry.json`, servi à la racine du site.
Il contient un plugin d'exemple, `hello-cell`, dont l'empreinte est vérifiée par
la CI (`tests/plugin-example.test.ts`).

## Contrat du module

```js
// facultatif : déclare les titres des types
export function register(api) {
    api.registerCellType({type: 'hello', title: 'Hello'})
}

// requis : renvoie du HTML, affiché dans l'iframe
export function render({type, cell, rows, theme}) {
    return `<p>${rows.length} ligne(s)</p>`
}
```

- `cell` contient `{id, title, json}` — `json` est la configuration libre de la cellule.
- `rows` contient les lignes de résultat si la cellule en a.
- `render` peut être asynchrone. Toute exception est affichée dans la cellule
  et signalée, sans casser le notebook.

Le module est importé **dans l'iframe**, pas dans la page : il n'accède ni au DOM
de l'application, ni à son `localStorage`, ni à son origine.

## Honnêteté sur la sécurité

Ce n'est **pas** une sandbox forte. Sans WASM, un plugin JavaScript reste du code
arbitraire :

- **Ce que l'iframe empêche** : lire le document de l'application, son stockage,
  ses cookies, ou remplacer l'interface.
- **Ce que l'iframe n'empêche pas** : émettre des requêtes réseau, consommer du
  CPU ou de la mémoire, exploiter une faille du navigateur.
- **Ce que les permissions garantissent** : elles sont affichées avant
  l'installation et relues à l'audit du code. Elles ne sont pas appliquées par le
  moteur — il n'y a pas de médiation des appels DuckDB ou réseau.
- **Fenêtre de substitution** : l'empreinte est vérifiée sur les octets
  téléchargés à l'installation ; l'iframe recharge ensuite le module depuis son
  URL. Un serveur compromis entre les deux pourrait servir autre chose. Pour un
  usage strict, héberger les plugins sur une origine contrôlée et épingler l'URL.

Conclusion pratique : n'installer que des plugins dont on a lu le code, ou dont
on fait confiance à l'auteur. Le registre et l'empreinte protègent contre une
altération en transit, pas contre un auteur malveillant.

## Ajouter un plugin

1. Écrire le module et le manifeste, calculer l'empreinte :
   ```bash
   openssl dgst -sha256 -binary hello-cell.mjs | openssl base64 -A
   ```
   (préfixer le résultat par `sha256-`).
2. Ajouter l'entrée au registre avec `size` (octets du module).
3. Ouvrir l'onglet **Plugins** (icône puzzle de la barre d'outils), charger le
   registre, vérifier les permissions affichées, installer.
4. Le type apparaît dans « Ajouter une cellule » ; les cellules existantes de ce
   type sont rendues à l'activation suivante.
