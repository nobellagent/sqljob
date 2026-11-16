/**
 * Exécution des cellules fournies par un plugin.
 *
 * Un type de plugin déclare ses requêtes dans son manifeste (`queries`). Ce
 * handler les exécute comme n'importe quelle cellule native, stocke les
 * résultats par clé, et laisse le rendu au module du plugin dans son iframe.
 * Sans cette étape, une cellule de plugin serait un objet étranger au DAG.
 */
import {DuckDBManager} from '../../../../lib/DuckDBManager'
import {ConfigManager} from '../../../../lib/ConfigManager'
import {CELL_TYPE_SCHEMAS} from '../../../../lib/cellTypeSchemas'
import type {StoreApi} from 'zustand'
import type {NotebookStoreState} from '../../types'

interface PluginCellSchema {
    queryNames?: string[]
    queryCount?: number
}

export function createPluginCells(
    _set: StoreApi<NotebookStoreState>['setState'],
    get: StoreApi<NotebookStoreState>['getState'],
) {
    return {
        async executePluginCell(cell) {
            // Les requêtes viennent de la cellule elle-même : c'est la source de
            // vérité, et cela évite de dépendre de l'ordre d'enregistrement du
            // schéma du plugin. Le schéma ne sert que de repli.
            const schema = CELL_TYPE_SCHEMAS.types[cell.type] as unknown as PluginCellSchema | undefined
            const fromCell = Array.isArray(cell.queries)
                ? cell.queries.map((query: any) => query?.name).filter((name: unknown): name is string => typeof name === 'string' && name.length > 0)
                : []
            const names = fromCell.length > 0 ? fromCell : (schema?.queryNames ?? [])

            if (names.length === 0) {
                // Type sans requête : rien à exécuter, le rendu lit la configuration.
                cell._pluginResults = {}
                return
            }

            const results: Record<string, unknown[]> = {}
            let first: unknown[] | undefined

            for (const name of names) {
                const sql = ConfigManager.getCellQuery(cell, name)
                if (!sql?.trim()) continue

                get().setStatus(`Exécution de la requête « ${name} »...`, 'loading')
                const finalQuery = get().parseQueryWithParameters(sql, {_name: cell.name || ''})
                const rows = await DuckDBManager.executeQuery(finalQuery)
                results[name] = Array.isArray(rows) ? rows : []
                if (first === undefined) first = results[name]
            }

            cell._pluginResults = results
            if (first !== undefined) cell._results = first as never
            cell._resultInfo = `${Object.keys(results).length} requête(s) exécutée(s)`
        },
    }
}
