import {describe, expect, it} from 'vitest'
import {toJsonSafe} from '../src/core/plugins/jsonSafe'

describe('toJsonSafe', () => {
    it('convertit les BigInt renvoyés par DuckDB', () => {
        const safe = toJsonSafe({n: 3n, big: 9007199254740993n}) as any
        expect(safe.n).toBe(3)
        expect(safe.big).toBe('9007199254740993')
        expect(() => JSON.stringify(safe)).not.toThrow()
    })

    it('laisse passer les valeurs simples', () => {
        expect(toJsonSafe({a: 1, b: 'x', c: true, d: null})).toEqual({a: 1, b: 'x', c: true, d: null})
    })

    it('convertit les dates en ISO', () => {
        expect(toJsonSafe(new Date('2026-11-16T10:00:00Z'))).toBe('2026-11-16T10:00:00.000Z')
    })

    it('coupe les cycles au lieu de boucler', () => {
        const node: any = {name: 'a'}
        node.self = node
        expect(() => JSON.stringify(toJsonSafe(node))).not.toThrow()
        expect((toJsonSafe(node) as any).name).toBe('a')
    })

    it('remplace les fonctions et symboles par leur absence', () => {
        const safe = toJsonSafe({f() {}, s: Symbol('x'), ok: 1}) as any
        expect(safe).toEqual({ok: 1})
    })

    it('sérialise une valeur partagée par deux clés (lignes et queries.data)', () => {
        const rows = [{a: 1}]
        const safe = toJsonSafe({rows, queries: {data: rows}}) as any
        expect(safe.rows).toEqual([{a: 1}])
        expect(safe.queries.data).toEqual([{a: 1}])
    })

    it('préserve null dans les tableaux', () => {
        const safe = toJsonSafe([1, undefined, () => 1]) as any[]
        expect(safe).toEqual([1, null, null])
    })
})
