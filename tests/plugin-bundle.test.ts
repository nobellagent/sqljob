import {describe, expect, it, vi} from 'vitest'
import {
    collectDocumentCellTypes,
    parsePluginBundle,
    serializePluginBundle,
    type EmbeddedPlugin,
} from '../src/core/plugins/bundle'
import {buildEmbeddedPlugins, MAX_EMBEDDED_SOURCE_BYTES} from '../src/app/plugins/pluginBundle'

const manifest = {
    id: 'hello-cell',
    version: '1.0.0',
    sqljobMinVersion: '0.4.0',
    types: ['hello'],
    permissions: ['ui:render'] as const,
    entry: 'hello.mjs',
    integrity: 'sha256-LPJNul+wow4m6DsqxbninhsWHlwfp0JecwQzYpOLmCQ=',
}

const plugin = (over: Partial<typeof manifest> = {}, extra: Record<string, unknown> = {}) => ({
    manifest: {...manifest, ...over},
    entryUrl: 'https://example.org/hello.mjs',
    source: 'export function render(){return ""}',
    ...extra,
})

describe('collectDocumentCellTypes', () => {
    it('parcourt groupes, sous-groupes et groupes liés', () => {
        const pages = [{
            groups: [
                {cells: [{type: 'sql'}, {type: 'hello'}]},
                {cells: [], children: [{cells: [{type: 'markdown'}, {type: 'hello'}]}]},
            ],
            linkGroups: [{cells: [{type: 'chart'}]}],
        }]
        expect(collectDocumentCellTypes(pages)).toEqual(['chart', 'hello', 'markdown', 'sql'])
    })

    it('ignore les formes inattendues', () => {
        expect(collectDocumentCellTypes(null)).toEqual([])
        expect(collectDocumentCellTypes([{groups: 'nope'}])).toEqual([])
        expect(collectDocumentCellTypes([{groups: [{cells: [null, {type: 42}]}]}])).toEqual([])
    })
})

describe('parsePluginBundle', () => {
    it('lit un bundle valide', () => {
        const parsed = parsePluginBundle([plugin()])
        expect(parsed).toHaveLength(1)
        expect(parsed[0].manifest.id).toBe('hello-cell')
        expect(parsed[0].source).toContain('render')
    })

    it('ignore les entrées invalides sans perdre les autres', () => {
        const parsed = parsePluginBundle([
            plugin(),
            {manifest: {id: 'cassé'}, entryUrl: 'x'},
            'pas un objet',
            plugin({id: 'autre-cell', types: ['autre']}),
        ])
        expect(parsed.map(p => p.manifest.id)).toEqual(['hello-cell', 'autre-cell'])
    })

    it('accepte un bundle absent de source', () => {
        const parsed = parsePluginBundle([plugin({}, {source: undefined})])
        expect(parsed[0].source).toBeUndefined()
    })

    it('refuse ce qui n’est pas un tableau', () => {
        expect(parsePluginBundle({})).toEqual([])
        expect(parsePluginBundle(null)).toEqual([])
    })
})

describe('serializePluginBundle', () => {
    it('neutralise les chevrons pour rester dans la balise script', () => {
        const plugins: EmbeddedPlugin[] = [{
            manifest: manifest as never,
            entryUrl: 'https://example.org/hello.mjs',
            source: 'const x = "</script><script>alert(1)</script>"',
        }]
        const serialized = serializePluginBundle(plugins)
        expect(serialized).not.toContain('</script>')
        expect(JSON.parse(serialized)[0].source).toContain('</script>')
    })
})

describe('buildEmbeddedPlugins', () => {
    const installed = [
        {manifest: {...manifest}, entryUrl: 'https://example.org/hello.mjs', installedAt: '', enabled: true},
        {
            manifest: {...manifest, id: 'autre', types: ['autre']},
            entryUrl: 'https://example.org/autre.mjs',
            installedAt: '',
            enabled: true,
        },
        {
            manifest: {...manifest, id: 'désactivé', types: ['hello']},
            entryUrl: 'https://example.org/off.mjs',
            installedAt: '',
            enabled: false,
        },
    ]

    it('n’embarque que les plugins dont un type est utilisé', async () => {
        const embedded = await buildEmbeddedPlugins({
            pages: [{groups: [{cells: [{type: 'hello'}]}]}],
            installed: installed as never,
            fetchSource: async () => 'export function render(){return ""}',
        })
        expect(embedded.map(p => p.manifest.id)).toEqual(['hello-cell'])
        expect(embedded[0].source).toContain('render')
    })

    it('garde l’URL quand le téléchargement échoue', async () => {
        const embedded = await buildEmbeddedPlugins({
            pages: [{groups: [{cells: [{type: 'hello'}]}]}],
            installed: installed as never,
            fetchSource: async () => {
                throw new Error('offline')
            },
        })
        expect(embedded[0].source).toBeUndefined()
        expect(embedded[0].entryUrl).toContain('hello.mjs')
    })

    it('n’embarque pas une source trop volumineuse', async () => {
        const embedded = await buildEmbeddedPlugins({
            pages: [{groups: [{cells: [{type: 'hello'}]}]}],
            installed: installed as never,
            fetchSource: async () => 'x'.repeat(MAX_EMBEDDED_SOURCE_BYTES + 1),
        })
        expect(embedded[0].source).toBeUndefined()
    })

    it('n’appelle pas le réseau pour un document sans cellule de plugin', async () => {
        const fetchSource = vi.fn()
        const embedded = await buildEmbeddedPlugins({
            pages: [{groups: [{cells: [{type: 'sql'}]}]}],
            installed: installed as never,
            fetchSource,
        })
        expect(embedded).toEqual([])
        expect(fetchSource).not.toHaveBeenCalled()
    })
})
