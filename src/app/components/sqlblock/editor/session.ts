import {DuckDBManager} from '../../../../lib/DuckDBManager'

export const SQLBLOCK_SCHEMA = '_sqlblock'

export const SUBCELL_LIMIT = 50   // lignes dans les tables intermédiaires

export let sqlblockSchemaEnsured = false
/** Bloque ensureSqlblockSchema après un drop pour éviter la re-création par des opérations en vol. */

export let sqlblockDropped = false

/** Appelé à l'ouverture de la modale : autorise à nouveau la création du schéma _sqlblock. */

export function openSqlblockSession() {
    sqlblockDropped = false
}

/** Appelé à la fermeture de la modale UI SQL pour dropper tout le schéma _sqlblock. */

export async function dropSqlblockSchema() {
    sqlblockDropped = true   // bloque immédiatement toute re-création par les opérations en vol
    try {
        await DuckDBManager.executeQuery(`DROP SCHEMA IF EXISTS "${SQLBLOCK_SCHEMA}" CASCADE`)
    } catch { /* ignore */ }
    sqlblockSchemaEnsured = false
}


export async function ensureSqlblockSchema() {
    if (sqlblockDropped || sqlblockSchemaEnsured) return
    await DuckDBManager.executeQuery(`CREATE SCHEMA IF NOT EXISTS "${SQLBLOCK_SCHEMA}"`)
    sqlblockSchemaEnsured = true
}

/** Nom de la table temp DuckDB pour le step idx d'une cellule. */

export function makeTableRef(cellId: string, idx: number): string {
    const safeId = cellId.replace(/[^a-zA-Z0-9]/g, '_')
    const name = `sb_${safeId}_s${idx < 0 ? 'src' : idx}`
    return `"${SQLBLOCK_SCHEMA}"."${name}"`
}

