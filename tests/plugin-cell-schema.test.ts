import {describe, expect, it} from 'vitest'
import {parseManifest} from '../src/core/plugins/manifest'
import {buildCellSchema} from '../src/core/plugins/cellSchema'
import {CELL_TYPE_SCHEMAS} from '../src/lib/cellTypeSchemas'
import {deletePluginType, getPluginType, listPluginTypes, setPluginType} from '../src/app/plugins/pluginTypes'

const base = {
    id: 'demo',
    version: '1.0.0',
    sqljobMinVersion: '0.4.0',
    types: ['demo'],
    permissions: ['ui:render'],
    entry: 'demo.mjs',
    integrity: 'sha256-LPJNul+wow4m6DsqxbninhsWHlwfp0JecwQzYpOLmCQ=',
}

const decl = {
    type: 'demo',
    title: 'Démo',
    icon: 'puzzle',
    queries: [
        {key: 'data', label: 'Données'},
        {key: 'fileName', label: 'Nom du fichier'},
    ],
    schema: {
        seuil: {label: 'Seuil', inputType: 'number' as const, default: 10, min: 0},
        mode: {label: 'Mode', inputType: 'select' as const, options: [{value: 'a', label: 'A'}]},
        actif: {label: 'Actif', inputType: 'checkbox' as const, default: true},
    },
}

describe('validation des descriptions de type', () => {
    it('accepte une description complète', () => {
        const manifest = parseManifest({...base, cellTypes: [decl]})
        expect(manifest.cellTypes?.[0].queries).toHaveLength(2)
        expect(manifest.cellTypes?.[0].schema?.seuil.inputType).toBe('number')
    })

    it('refuse un type décrit mais non déclaré', () => {
        expect(() => parseManifest({...base, cellTypes: [{type: 'autre'}]})).toThrow(/n'est pas déclaré dans types/)
    })

    it('refuse un inputType inconnu', () => {
        expect(() => parseManifest({
            ...base,
            cellTypes: [{type: 'demo', schema: {x: {label: 'X', inputType: 'color'}}}],
        })).toThrow(/inputType inconnu/)
    })

    it('refuse une clé de requête dupliquée', () => {
        expect(() => parseManifest({
            ...base,
            cellTypes: [{type: 'demo', queries: [{key: 'a', label: 'A'}, {key: 'a', label: 'B'}]}],
        })).toThrow(/dupliquée/)
    })

    it('refuse un select sans options', () => {
        expect(() => parseManifest({
            ...base,
            cellTypes: [{type: 'demo', schema: {mode: {label: 'Mode', inputType: 'select'}}}],
        })).toThrow(/options/)
    })

    it('refuse un nom de champ invalide', () => {
        expect(() => parseManifest({
            ...base,
            cellTypes: [{type: 'demo', schema: {'1x': {label: 'X', inputType: 'text'}}}],
        })).toThrow(/nom de champ invalide/)
    })

    it('reste compatible avec un manifeste sans cellTypes', () => {
        const manifest = parseManifest(base)
        expect(manifest.cellTypes).toBeUndefined()
    })
})

describe('buildCellSchema', () => {
    it('produit un schéma compatible avec les types natifs', () => {
        const schema = buildCellSchema(decl)
        expect(schema.executeHandler).toBe('executePluginCell')
        expect(schema.queryCount).toBe(2)
        expect(schema.queryNames).toEqual(['data', 'fileName'])
        expect(schema.queryLabels.fileName).toBe('Nom du fichier')
        expect(schema.specificParams.map(p => p.key)).toEqual(['seuil', 'mode', 'actif'])
        expect(schema.defaults.queries.map(q => q.name)).toEqual(['data', 'fileName'])
        expect(schema.exportFields).toEqual(['queries', 'seuil', 'mode', 'actif'])
    })

    it('supporte un type sans requête ni champ', () => {
        const schema = buildCellSchema({type: 'vide'})
        expect(schema.queryCount).toBe(0)
        expect(schema.specificParams).toEqual([])
        expect(schema.exportFields).toEqual(['queries'])
    })
})

describe('enregistrement dans CELL_TYPE_SCHEMAS', () => {
    it('rend le type visible comme un type natif, puis le retire', () => {
        expect(CELL_TYPE_SCHEMAS.types.demo).toBeUndefined()

        setPluginType({type: 'demo', title: 'Démo', pluginId: 'demo', entryUrl: 'https://x/demo.mjs', decl})
        expect(CELL_TYPE_SCHEMAS.types.demo).toBeDefined()
        expect(getPluginType('demo')?.decl?.queries).toHaveLength(2)
        expect(listPluginTypes().some(t => t.type === 'demo')).toBe(true)

        deletePluginType('demo')
        expect(CELL_TYPE_SCHEMAS.types.demo).toBeUndefined()
        expect(getPluginType('demo')).toBeUndefined()
    })
})
