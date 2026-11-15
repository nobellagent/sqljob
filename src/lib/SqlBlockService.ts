/**
 * Façade de conversion AST ⇄ SQL pour les blocs SQL.
 *
 * L'implémentation est découpée dans `./sqlblock/` :
 *  - `constants`  : préfixes de CTE, slugs de type d'étape, rôles de graphique ;
 *  - `helpers`    : échappement, quoting, littéraux ;
 *  - `chart`      : SELECT final d'un graphique et sa relecture ;
 *  - `ast-to-sql` : génération de SQL depuis l'AST ;
 *  - `filters`    : filtres et primitives de parsing ;
 *  - `sql-to-ast` : parsers simples (SELECT, CTE linéaire) ;
 *  - `parse-cte`  : parser par CTE, y compris le mode « smart ».
 *
 * Ce fichier conserve la surface publique historique : les imports
 * `from '../lib/SqlBlockService'` continuent de fonctionner sans modification.
 */
export * from './sqlblock/constants'
export * from './sqlblock/helpers'
export * from './sqlblock/chart'
export * from './sqlblock/ast-to-sql'
export * from './sqlblock/materialize'
export * from './sqlblock/filters'
export * from './sqlblock/sql-to-ast'
export * from './sqlblock/parse-cte'
export * from './sqlblock/parse-smart'
