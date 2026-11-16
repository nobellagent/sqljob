/**
 * Traduction d'une description de type de cellule (manifeste) en schéma
 * compréhensible par le reste de l'application.
 *
 * Le but est qu'un type fourni par un plugin se comporte comme un type natif :
 * il apparaît dans « Ajouter une cellule », il a une fiche de configuration, il
 * participe au DAG par ses requêtes et il s'exporte avec les mêmes champs.
 */
import type {PluginCellTypeDecl, PluginFieldDecl} from './manifest'

interface PluginCellSchema {
    /** Handler générique du notebook : exécute les requêtes puis stocke les résultats. */
    executeHandler: 'executePluginCell'
    defaultNamePrefix: string
    queryCount: number
    queryNames: string[]
    queryLabels: Record<string, string>
    specificParams: ({key: string} & PluginFieldDecl)[]
    defaults: {
        queries: {name: string; sql: string; engine: string; showQueryEditor: boolean}[]
    }
    commonParams: string[]
    exportFields: string[]
    bodyFamily: 'plugin'
}

export function buildCellSchema(decl: PluginCellTypeDecl): PluginCellSchema {
    const queries = decl.queries ?? []
    const fields = Object.entries(decl.schema ?? {})

    return {
        executeHandler: 'executePluginCell',
        defaultNamePrefix: decl.type,
        queryCount: queries.length,
        queryNames: queries.map(query => query.key),
        queryLabels: Object.fromEntries(queries.map(query => [query.key, query.label])),
        specificParams: fields.map(([key, field]) => ({key, ...field})),
        defaults: {
            queries: queries.map(query => ({
                name: query.key,
                sql: '',
                engine: 'sql',
                showQueryEditor: false,
            })),
        },
        commonParams: ['name', 'queries'],
        exportFields: ['queries', ...fields.map(([key]) => key)],
        bodyFamily: 'plugin',
    }
}

