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
| `permissions` | `duckdb:read`, `duckdb:write`, `ui:render`, `ui:download`, `storage:local`, `network:<hôte>` |
| `entry` | chemin relatif, `.js` ou `.mjs`, sans `..` (module bundle ≤ 8 Mo) |
| `cellTypes` | description facultative de chaque type : titre, icône, requêtes, champs |
| `integrity` | `sha256-<base64>` des octets du module |

Un manifeste invalide est refusé en bloc : l'application ne tente pas de réparer.

## Types de cellule déclarés

Par défaut, un plugin ne fournit qu'un rendu : le type apparaît dans « Ajouter une cellule »
avec son titre, sans configuration. `cellTypes` va plus loin — le type se comporte alors comme
un type natif, sans code d'interface supplémentaire.

```json
"cellTypes": [{
  "type": "hello",
  "title": "Hello",
  "icon": "puzzle",
  "queries": [
    {"key": "data", "label": "Requête de données"},
    {"key": "filename", "label": "Nom du fichier"}
  ],
  "schema": {
    "salutation": {"label": "Salutation", "inputType": "text", "default": "Bonjour"},
    "seuil":      {"label": "Seuil", "inputType": "number", "min": 0},
    "mode":       {"label": "Mode", "inputType": "select", "options": [{"value": "a", "label": "A"}]},
    "compact":    {"label": "Compact", "inputType": "checkbox", "default": false}
  }
}]
```

- **`schema`** alimente la fiche de configuration de la cellule (champs `text`, `textarea`,
  `number`, `select`, `checkbox`). L'application les rend elle-même : le plugin n'écrit aucune UI.
  Les valeurs arrivent dans `render` par `cell.json`.
- **`queries`** (1 à 4) fait entrer la cellule dans le DAG : le notebook exécute chaque requête
  dans l'ordre, avec les paramètres habituels (`{{_name}}`, conditions, boucles), et poste les
  résultats au plugin par clé, dans `queries`.

```js
export function render({cell, queries}) {
    return `<p>${queries.data?.length ?? 0} ligne(s)</p>`
}
```

Un type sans requête reçoit `queries = {}` : il ne coûte rien au moteur d'exécution.

### Interagir : `mount`

`render` renvoie du HTML ; pour un bouton, un formulaire ou un rendu progressif, exposez
`mount(root, contexte)`. Il est appelé **dans l'iframe** après l'insertion du HTML, avec le même
contexte que `render`, plus `host` (l'API hôte).

```js
export function mount(root, ctx) {
    root.querySelector('button')?.addEventListener('click', async () => {
        const rows = await ctx.host.query('SELECT count(*) AS n FROM source1')
        ctx.host.download('compte.csv', String(rows[0].n), {mime: 'text/csv'})
    })
}
```

C'est ce que fait `pdfme-plugin` (`public/plugins/pdfme-plugin/`) : le PDF est généré au clic, puis
téléchargé par `sqljobHost.download`, avec la permission `ui:download`.

## API hôte

Un plugin peut appeler l'application, mais chaque appel est **vérifié** côté hôte, dans
`src/core/plugins/hostApi.ts` — pas seulement affiché à l'installation.

| Appel (dans l'iframe) | Permission exigée | Contrôle |
|---|---|---|
| `sqljobHost.query(sql)` | `duckdb:read` | une seule instruction, `SELECT` ou `WITH`, refus si écriture ou `;` multiple, délai de 15 s |
| `sqljobHost.download(name, content, {mime, encoding})` | `ui:download` | nom assaini, contenu texte ou base64 |
| `sqljobHost.storage.get/set/remove(key, value)` | `storage:local` | clé préfixée par l'id du plugin, 100 Ko par valeur |

```js
const rows = await sqljobHost.query('SELECT * FROM source1 LIMIT 5')
sqljobHost.download('rapport.csv', csv, {mime: 'text/csv'})
await sqljobHost.storage.set('derniere-vue', JSON.stringify({page: 2}))
```

`duckdb:write` n'ouvre **aucun** appel : une cellule n'a pas à écrire dans la base pour afficher.
Une permission non déclarée fait échouer l'appel avec un message explicite, et le test
`tests/plugin-host-api.test.ts` le vérifie.

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
- **Ce que les permissions garantissent** : chaque appel de l'API hôte
  (`query`, `download`, stockage) est contrôlé avant exécution ; la requête SQL est
  en lecture seule et bornée dans le temps.
- **Ce qu'elles ne garantissent pas** : `duckdb:read` peut lire des fichiers ou des URL
  distantes via SQL (`read_csv('https://…')`), et l'iframe peut toujours faire du réseau.
  La permission limite les effets de bord, pas l'exfiltration.
- **Fenêtre de substitution** : l'empreinte est vérifiée sur les octets
  téléchargés à l'installation ; l'iframe recharge ensuite le module depuis son
  URL. Un serveur compromis entre les deux pourrait servir autre chose. Pour un
  usage strict, héberger les plugins sur une origine contrôlée et épingler l'URL.

Conclusion pratique : n'installer que des plugins dont on a lu le code, ou dont
on fait confiance à l'auteur. Le registre et l'empreinte protègent contre une
altération en transit, pas contre un auteur malveillant.

## Exports

L'export **HTML** embarque les plugins utilisés par le document — uniquement ceux-là :

- un `<script type="application/json" id="sqljobPluginBundle">` contient, pour chaque plugin dont un
  type apparaît dans une cellule, le manifeste, l'URL d'origine et la source du module (≤ 4 Mo) ;
- au démarrage, le document active ces plugins sans registre ni réseau ;
- le rendu se fait dans l'iframe à partir d'un `blob:` créé localement, donc il fonctionne même
  ouvert par `file://` ;
- l'onglet Plugins affiche « Embarqués dans le document » et explique que le registre n'est pas
  joignable hors ligne.

Deux limites à connaître :

- l'export **ZIP** n'embarque pas les plugins : les cellules de plugin y restent vides ;
- si le module dépasse 4 Mo, seule son URL est conservée : le rendu demandera alors le réseau.

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
