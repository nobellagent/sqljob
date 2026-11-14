import {beforeEach, describe, expect, it, vi} from 'vitest'
import {ConfigManager, exportConfigToJson} from '../src/lib/ConfigManager'

describe('ConfigManager — normalisation', () => {
    it('normalise un ordre manquant en index', () => {
        expect(ConfigManager.normalizeOrder(undefined, 3)).toBe(3)
        expect(ConfigManager.normalizeOrder('2.5', 0)).toBe(2.5)
        expect(ConfigManager.normalizeOrder('abc', 4)).toBe(4)
    })

    it('applique les alias de type historiques', () => {
        const cell = ConfigManager.normalizeCell({type: 'sqlRecursiveParse', query: 'SELECT 1'})
        expect(cell.type).toBe('sql')
        expect(cell.query).toBe('SELECT 1')
    })

    it('sérialise le json pdfme en chaîne', () => {
        const cell = ConfigManager.normalizeCell({type: 'pdfme', json: {a: 1}})
        expect(typeof cell.json).toBe('string')
        expect(JSON.parse(cell.json)).toEqual({a: 1})
    })

    it('migre materialize=select vers ephemeral', () => {
        const cell = ConfigManager.normalizeCell({type: 'sql', materialize: 'select'})
        expect(cell.materialized).toBe('ephemeral')
        expect(cell.materialize).toBeUndefined()
    })

    it('garde le type et l’id d’un groupe', () => {
        const group = ConfigManager.normalizeGroup({id: 'g1', type: 'core', cells: []})
        expect(group.id).toBe('g1')
        expect(group.type).toBe('core')
        expect(Array.isArray(group.cells)).toBe(true)
    })

    it('génère des identifiants uniques', () => {
        const ids = new Set(Array.from({length: 50}, () => ConfigManager.generateGroupId()))
        expect(ids.size).toBe(50)
    })
})

describe('ConfigManager — deepMerge', () => {
    it('fusionne récursivement les objets', () => {
        const merged = ConfigManager.deepMerge(
            {a: 1, nested: {x: 1, y: 2}, list: [1, 2]},
            {b: 2, nested: {y: 3}, list: [3]},
        )
        expect(merged).toEqual({a: 1, b: 2, nested: {x: 1, y: 3}, list: [3]})
    })

    it('ne mute pas la cible', () => {
        const target = {a: 1, nested: {x: 1}}
        ConfigManager.deepMerge(target, {nested: {x: 2}})
        expect(target.nested.x).toBe(1)
    })

    it('remplace les tableaux au lieu de les concaténer', () => {
        expect(ConfigManager.deepMerge({list: [1, 2, 3]}, {list: [9]}).list).toEqual([9])
    })
})

describe('ConfigManager — base64', () => {
    it('encode et décode de l’UTF-8', () => {
        const source = 'Données — été 2026 ☀️'
        const encoded = ConfigManager.encodeUTF8ToBase64(source)
        expect(encoded).not.toContain('Données')
        expect(atob(encoded)).not.toBe('')
        const bytes = Uint8Array.from(atob(encoded), c => c.charCodeAt(0))
        expect(new TextDecoder().decode(bytes)).toBe(source)
    })
})

describe('ConfigManager — config par défaut', () => {
    it('renvoie un fallback minimal sans script de config dans le DOM', () => {
        const config = ConfigManager.getDefaultConfig()
        expect(config).toEqual({job: {cells: []}})
    })

    it('exporte un JSON valide', () => {
        const json = exportConfigToJson({pages: []})
        expect(() => JSON.parse(json)).not.toThrow()
    })
})

describe('ConfigManager — paramètres d’URL', () => {
    beforeEach(() => {
        vi.stubGlobal('window', {
            ...globalThis.window,
            location: {search: '?embed=1&devMode=true'},
        })
    })

    it('applique embed et devMode', () => {
        const config = {pages: [], ui: {}}
        const result = ConfigManager.applyURLParamsToConfig(config)
        expect(result.ui.devMode).toBe(true)
    })
})
