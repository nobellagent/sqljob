import {describe, expect, it} from 'vitest'
import {sanitizeForStorage, serializeForStorage} from '../src/app/store/serializeProject'

describe('préparation du document avant stockage', () => {
    it('sérialise un document simple', () => {
        const pages = [{_id: 'p1', name: 'Feuille 1', groups: [{_id: 'g1', cells: [{type: 'sql'}]}]}]
        expect(JSON.parse(serializeForStorage(pages))).toEqual(pages)
    })

    it('supprime les références circulaires au lieu de lever', () => {
        const cell: Record<string, unknown> = {type: 'sql'}
        cell.self = cell
        const pages = [{groups: [{cells: [cell]}]}]

        expect(() => JSON.stringify(pages)).toThrow()
        const clean = sanitizeForStorage(pages) as Array<{groups: Array<{cells: Array<Record<string, unknown>>}>}>
        expect(clean[0].groups[0].cells[0].type).toBe('sql')
        expect(clean[0].groups[0].cells[0].self).toBeUndefined()
        expect(() => JSON.stringify(clean)).not.toThrow()
    })

    it('retire les fonctions et les caches d’exécution', () => {
        const cell = {
            type: 'sql',
            onRun: () => undefined,
            element: {nodeType: 1},
            editor: {monaco: true},
            query: 'SELECT 1',
        }
        const clean = sanitizeForStorage(cell) as Record<string, unknown>
        expect(clean.query).toBe('SELECT 1')
        expect(clean.onRun).toBeUndefined()
        expect(clean.element).toBeUndefined()
        expect(clean.editor).toBeUndefined()
    })

    it('conserve les valeurs binaires et les dates', () => {
        const date = new Date('2026-01-01T00:00:00Z')
        const clean = sanitizeForStorage({date, buffer: new ArrayBuffer(4)}) as Record<string, unknown>
        expect(clean.date).toBe(date)
        expect(clean.buffer).toBeInstanceOf(ArrayBuffer)
    })

    it('ne partage pas les objets répétés (pas de cycle artificiel)', () => {
        const shared = {name: 'partagé'}
        const clean = sanitizeForStorage({a: shared, b: shared}) as Record<string, unknown>
        expect(clean.a).toEqual({name: 'partagé'})
        // Le second passage est traité comme un doublon : il ne doit pas faire échouer la sérialisation.
        expect(() => JSON.stringify(clean)).not.toThrow()
    })
})
