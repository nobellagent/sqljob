// Module extrait de SqlBlockService.ts — matérialisation.

import type {SqlBlockMaterialize} from '../SqlBlockTypes'

export function generateMaterializeQuery(_name: string, sql: string, materialize: SqlBlockMaterialize): string {
    if (materialize === 'ephemeral') return sql;
    // {{ _name }} est substitué à l'exécution avec le nom réel de la cellule.
    // Le DROP de l'opposé est géré à l'exécution (executionSlice), pas affiché ici.
    return materialize === 'table'
        ? `CREATE OR REPLACE TABLE {{ _name }} AS (\n${sql}\n)`
        : `CREATE OR REPLACE VIEW {{ _name }} AS (\n${sql}\n)`;
}

/** Construit le SQL affiché dans l'éditeur : avec CREATE OR REPLACE pour VIEW/TABLE, SQL brut pour SELECT. */
export function buildDisplaySql(name: string | null | undefined, selectSql: string, materialize: SqlBlockMaterialize): string {
    if (!name?.trim() || materialize === 'ephemeral') return selectSql;
    return generateMaterializeQuery(name, selectSql, materialize);
}

/** Retire le préfixe DROP + CREATE OR REPLACE VIEW/TABLE d'un SQL pour extraire le SELECT interne.
 *  Gère les noms quotés ("id"), les templates {{ _name }} et les identifiants bruts. */
export function stripMaterializePrefix(sql: string): string {
    const anyName = `(?:"[^"]*"|\\{\\{[^}]+\\}\\}|\\S+)`;
    const m = sql.trim().match(new RegExp(
        `^(?:DROP\\s+(?:VIEW|TABLE)\\s+IF\\s+EXISTS\\s+${anyName}\\s*;\\s*)?` +
        `CREATE\\s+OR\\s+REPLACE\\s+(?:VIEW|TABLE)\\s+${anyName}\\s+AS\\s*\\(\\s*([\\s\\S]*?)\\s*\\)\\s*;?\\s*$`,
        'i'
    ));
    if (m) return m[1].trim();
    return sql.trim();
}

