import {beforeEach, describe, expect, it, vi} from 'vitest'

const executeQuery = vi.fn()

vi.mock('../src/lib/DuckDBManager', () => ({
    DuckDBManager: {executeQuery: (...args: unknown[]) => executeQuery(...args)},
}))

vi.mock('../src/lib/ConfigManager', () => ({
    ConfigManager: {
        getCellQuery: (cell: any, key: string | number) => {
            if (typeof key === 'string') return cell.queries?.find((q: any) => q.name === key)?.sql ?? ''
            return cell.queries?.[key]?.sql ?? ''
        },
    },
}))

import {createPluginCells} from '../src/app/store/slices/execution/pluginCells'
import {CELL_TYPE_SCHEMAS} from '../src/lib/cellTypeSchemas'
import {buildCellSchema} from '../src/core/plugins/cellSchema'

function makeStore() {
    const status: string[] = []
    const get = () => ({
        setStatus: (message: string) => status.push(message),
        parseQueryWithParameters: (sql: string) => sql,
    })
    const set = (() => undefined) as never
    return {handlers: createPluginCells(set, get as never), status}
}

describe('executePluginCell', () => {
    beforeEach(() => {
        executeQuery.mockReset()
        ;(CELL_TYPE_SCHEMAS.types as any).demo = buildCellSchema({
            type: 'demo',
            queries: [{key: 'data', label: 'Données'}, {key: 'fileName', label: 'Fichier'}],
        })
    })

    it('exécute les requêtes déclarées et range les résultats par clé', async () => {
        executeQuery
            .mockResolvedValueOnce([{a: 1}, {a: 2}])
            .mockResolvedValueOnce([{name: 'x.pdf'}])

        const {handlers, status} = makeStore()
        const cell: any = {
            type: 'demo',
            name: 'démo',
            queries: [
                {name: 'data', sql: 'SELECT 1'},
                {name: 'fileName', sql: "SELECT 'x.pdf'"},
            ],
        }

        await handlers.executePluginCell(cell)

        expect(executeQuery).toHaveBeenCalledTimes(2)
        expect(cell._pluginResults.data).toHaveLength(2)
        expect(cell._pluginResults.fileName[0].name).toBe('x.pdf')
        expect(cell._results).toEqual([{a: 1}, {a: 2}])
        expect(cell._resultInfo).toBe('2 requête(s) exécutée(s)')
        expect(status.some(s => s.includes('data'))).toBe(true)
    })

    it('ignore une requête vide et ne casse pas le rendu', async () => {
        executeQuery.mockResolvedValue([{a: 1}])

        const {handlers} = makeStore()
        const cell: any = {
            type: 'demo',
            queries: [{name: 'data', sql: '   '}, {name: 'fileName', sql: 'SELECT 1'}],
        }

        await handlers.executePluginCell(cell)
        expect(executeQuery).toHaveBeenCalledTimes(1)
        expect(cell._pluginResults.fileName).toEqual([{a: 1}])
    })

    it('ne fait rien pour un type sans requête', async () => {
        const {handlers} = makeStore()
        const cell: any = {type: 'sansRequete'}

        await handlers.executePluginCell(cell)
        expect(executeQuery).not.toHaveBeenCalled()
        expect(cell._pluginResults).toEqual({})
    })

    it('se fie aux requêtes de la cellule même sans schéma enregistré', async () => {
        // Régression : le schéma d'un plugin peut ne pas être visible au moment
        // de l'exécution ; la cellule reste la source de vérité.
        delete (CELL_TYPE_SCHEMAS.types as any).demo
        executeQuery.mockResolvedValue([{a: 1}])

        const {handlers} = makeStore()
        const cell: any = {type: 'demo', queries: [{name: 'data', sql: 'SELECT 1'}]}

        await handlers.executePluginCell(cell)
        expect(executeQuery).toHaveBeenCalledTimes(1)
        expect(cell._pluginResults.data).toEqual([{a: 1}])
    })

    it('propage l’erreur SQL pour que la cellule passe en erreur', async () => {
        executeQuery.mockRejectedValue(new Error('Binder Error: table inconnue'))

        const {handlers} = makeStore()
        const cell: any = {type: 'demo', queries: [{name: 'data', sql: 'SELECT * FROM inconnue'}]}

        await expect(handlers.executePluginCell(cell)).rejects.toThrow(/Binder Error/)
    })
})
