/* eslint-disable @typescript-eslint/no-explicit-any -- store et cellules simulés volontairement, les types réels tireraient DuckDB et Univer */
// @vitest-environment jsdom
/**
 * Un test par type de cellule : chaque corps du registre doit se rendre
 * sans lever d'exception sur une cellule minimale.
 *
 * Le store et les composants lourds (Univer, pivot, éditeur SQL) sont simulés :
 * on vérifie le câblage du registre, pas le moteur DuckDB.
 */
import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

/** État de store factice : tout champ est soit vide, soit une fonction inerte. */
const fakeState = new Proxy({} as Record<string, any>, {
    get: (_t, key: string) => {
        if (key === 'devMode' || key === 'isLoading') return false
        if (key === '_duckdbTables') return {}
        if (key === '_rev') return 0
        if (key === 'hasCellHeight') return () => false
        if (key === 'getCellHeightVars') return () => ''
        if (key === 'bodyDisplayShouldShowSkeleton') return () => false
        if (key === 'bodyDisplayShouldShowContent') return () => true
        if (key === 'getGroups') return () => []
        if (key === 'getCellAtPath') return () => undefined
        return () => undefined
    },
})

vi.mock('../src/app/store/notebookStore', () => ({
    useNotebookStore: (selector?: (s: any) => any) => (selector ? selector(fakeState) : fakeState),
    notebookStore: { getState: () => fakeState, setState: () => undefined, subscribe: () => () => undefined },
}))

vi.mock('../src/app/components/UniverSheetElement', () => ({}))
vi.mock('../src/app/components/sqlblock/SqlBlockEditor', () => ({
    SqlBlockEditor: () => null,
    dropSqlblockSchema: () => undefined,
    openSqlblockSession: () => undefined,
}))
vi.mock('../src/app/components/SqlEditorWidget', () => ({ SqlEditorWidget: () => null }))
vi.mock('../src/app/components/SqlDataTable', () => ({ SqlDataTable: () => null }))
// PivotEditor.Results est utilisé dans PivotBody : on l'attache à la fonction.
vi.mock('@sqlrooms/pivot', () => {
    const PivotEditor: any = () => null
    PivotEditor.Results = () => null
    return { PivotEditor, default: PivotEditor }
})
vi.mock('@sqlrooms/data-table', () => ({ DataTablePaginated: () => null }))
// Proxy de composants : `then` doit rester undefined, sinon le module devient
// « thenable » et l'import dynamique ne se résout jamais.
vi.mock('@sqlrooms/ui', () => new Proxy({}, {
    get: (_t, key) => (key === 'then' || key === '__esModule') ? undefined : () => null,
}))

const { getCellBody, CELL_BODIES } = await import('../src/app/components/cellTypes/registry')

/** Cellule minimale commune aux 13 types. */
function makeCell(type: string) {
    return {
        id: `cell-${type}`,
        type,
        json: {},
        _status: 'idle',
        _order: 0,
    } as any
}

describe('registre des corps de cellule', () => {
    it('couvre tous les types déclarés dans les schémas', async () => {
        const { CELL_TYPE_SCHEMAS } = await import('../src/lib/cellTypeSchemas')
        const types = Object.keys(CELL_TYPE_SCHEMAS.types)
        expect(types.length).toBeGreaterThanOrEqual(12)
        for (const type of types) {
            expect(CELL_BODIES[type], `type non couvert par le registre : ${type}`).toBeTruthy()
        }
    })

    it('ne déclare aucun type absent des schémas', async () => {
        const { CELL_TYPE_SCHEMAS } = await import('../src/lib/cellTypeSchemas')
        const declared = new Set(Object.keys(CELL_TYPE_SCHEMAS.types))
        for (const type of Object.keys(CELL_BODIES)) {
            expect(declared.has(type), `type du registre inconnu des schémas : ${type}`).toBe(true)
        }
    })

    it('retourne null pour un type inconnu', () => {
        expect(getCellBody('type-qui-nexiste-pas')).toBeNull()
    })

    for (const type of [
        'markdown', 'source', 'buttonRunNextCells', 'sql', 'iframe', 'sqlStat',
        'pivot', 'uiParameter', 'publipostageWord', 'pdfme', 'perspective', 'univerSheet',
    ]) {
        it(`rend une cellule « ${type} » sans erreur`, () => {
            const Body = getCellBody(type)!
            expect(Body).toBeTruthy()
            const html = renderToStaticMarkup(
                // @ts-expect-error — props minimales volontairement incomplètes
                <Body cell={makeCell(type)} path={[0]} cellIndex={0} showTextResult />
            )
            expect(typeof html).toBe('string')
        })
    }
})
