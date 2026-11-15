import {describe, expect, it, vi} from 'vitest'
import {sha256Integrity, verifyIntegrity, verifySize} from '../src/core/plugins/integrity'
import {PluginError, parseRegistry} from '../src/core/plugins/manifest'
import {activatePlugin, installPlugin, resolveEntryUrl} from '../src/core/plugins/loader'
import {createPluginStore, type StorageLike} from '../src/core/plugins/store'

const enc = new TextEncoder()

/** SHA-256 de « hello » : sert de référence indépendante du code testé. */
const HELLO_INTEGRITY = 'sha256-LPJNul+wow4m6DsqxbninhsWHlwfp0JecwQzYpOLmCQ='

function memoryStorage(): StorageLike & {dump(): Record<string, string>} {
    const data: Record<string, string> = {}
    return {
        getItem: key => data[key] ?? null,
        setItem: (key, value) => {
            data[key] = value
        },
        removeItem: key => {
            delete data[key]
        },
        dump: () => ({...data}),
    }
}

const manifest = {
    id: 'hello-cell',
    version: '1.0.0',
    sqljobMinVersion: '0.4.0',
    types: ['hello'],
    permissions: ['ui:render'],
    entry: 'dist/hello-cell.mjs',
    integrity: HELLO_INTEGRITY,
    size: 5,
}

const registry = parseRegistry({schema: 1, plugins: [manifest]})

describe('intégrité', () => {
    it('calcule l’empreinte attendue pour « hello »', async () => {
        expect(await sha256Integrity(enc.encode('hello'))).toBe(HELLO_INTEGRITY)
    })

    it('accepte les octets conformes et refuse les autres', async () => {
        await expect(verifyIntegrity(enc.encode('hello'), HELLO_INTEGRITY)).resolves.toBeUndefined()
        await expect(verifyIntegrity(enc.encode('hello!'), HELLO_INTEGRITY)).rejects.toThrow(/empreinte incorrecte/)
    })

    it('vérifie la taille annoncée', () => {
        expect(() => verifySize(enc.encode('hello'), 5)).not.toThrow()
        expect(() => verifySize(enc.encode('hello'), 6)).toThrow(/taille incorrecte/)
        expect(() => verifySize(enc.encode('hello'))).not.toThrow()
    })
})

describe('installPlugin', () => {
    it('installe un plugin vérifié et le persiste', async () => {
        const store = createPluginStore(memoryStorage())
        const fetchBytes = vi.fn(async () => enc.encode('hello'))

        const plugin = await installPlugin({
            registry,
            id: 'hello-cell',
            currentVersion: '0.4.1',
            store,
            fetchBytes,
            baseUrl: 'https://example.org/registry.json',
        })

        expect(fetchBytes).toHaveBeenCalledWith('https://example.org/dist/hello-cell.mjs')
        expect(plugin.entryUrl).toBe('https://example.org/dist/hello-cell.mjs')
        expect(plugin.enabled).toBe(true)
        expect(store.list()).toHaveLength(1)
    })

    it('refuse des octets qui ne correspondent pas à l’empreinte', async () => {
        const store = createPluginStore(memoryStorage())
        await expect(
            installPlugin({
                registry,
                id: 'hello-cell',
                currentVersion: '0.4.1',
                store,
                fetchBytes: async () => enc.encode('bye!!'),
                baseUrl: 'https://example.org/registry.json',
            }),
        ).rejects.toThrow(/empreinte incorrecte/)
        expect(store.list()).toHaveLength(0)
    })

    it('refuse une taille différente de celle du registre', async () => {
        const store = createPluginStore(memoryStorage())
        await expect(
            installPlugin({
                registry,
                id: 'hello-cell',
                currentVersion: '0.4.1',
                store,
                fetchBytes: async () => enc.encode('hello!'),
                baseUrl: 'https://example.org/registry.json',
            }),
        ).rejects.toThrow(/taille incorrecte/)
    })

    it('ne retélécharge pas un plugin déjà installé dans la même version', async () => {
        const store = createPluginStore(memoryStorage())
        const fetchBytes = vi.fn(async () => enc.encode('hello'))
        const options = {
            registry,
            id: 'hello-cell',
            currentVersion: '0.4.1',
            store,
            fetchBytes,
            baseUrl: 'https://example.org/registry.json',
        }
        await installPlugin(options)
        await installPlugin(options)
        expect(fetchBytes).toHaveBeenCalledTimes(1)
    })

    it('refuse une application trop ancienne', async () => {
        const store = createPluginStore(memoryStorage())
        await expect(
            installPlugin({
                registry,
                id: 'hello-cell',
                currentVersion: '0.3.0',
                store,
                fetchBytes: async () => enc.encode('hello'),
                baseUrl: 'https://example.org/registry.json',
            }),
        ).rejects.toThrow(/exige sqljob 0.4.0/)
    })

    it('résout les URL relatives, absolues et de sous-dossier', () => {
        expect(resolveEntryUrl('https://a.org/registry.json', 'dist/x.js')).toBe('https://a.org/dist/x.js')
        expect(resolveEntryUrl('https://a.org/plugins/', 'x.js')).toBe('https://a.org/plugins/x.js')
    })
})

describe('activatePlugin', () => {
    const installed = {
        manifest: {
            id: 'hello-cell',
            version: '1.0.0',
            sqljobMinVersion: '0.4.0',
            types: ['hello'],
            permissions: ['ui:render'] as const,
            entry: 'hello.mjs',
            integrity: HELLO_INTEGRITY,
        },
        entryUrl: 'https://example.org/hello.mjs',
        installedAt: '2026-11-15T00:00:00.000Z',
        enabled: true,
    }

    it('enregistre les types déclarés', async () => {
        const registerCellType = vi.fn()
        const types = await activatePlugin(installed as never, {
            takenTypes: [],
            appVersion: '0.4.1',
            registerCellType,
            importModule: async () => ({
                register(api) {
                    expect(api.plugin.id).toBe('hello-cell')
                    api.registerCellType({type: 'hello', title: 'Hello', render: () => '<p>hi</p>'})
                },
            }),
        })
        expect(types).toEqual(['hello'])
        expect(registerCellType).toHaveBeenCalledTimes(1)
    })

    it('refuse un type qui n’est pas dans le manifeste', async () => {
        await expect(
            activatePlugin(installed as never, {
                takenTypes: [],
                appVersion: '0.4.1',
                registerCellType: vi.fn(),
                importModule: async () => ({
                    register(api) {
                        api.registerCellType({type: 'autre', title: 'Autre'})
                    },
                }),
            }),
        ).rejects.toThrow(/absent du manifeste/)
    })

    it('refuse un type déjà pris avant même de charger le module', async () => {
        const importModule = vi.fn()
        await expect(
            activatePlugin(installed as never, {
                takenTypes: ['hello'],
                appVersion: '0.4.1',
                registerCellType: vi.fn(),
                importModule,
            }),
        ).rejects.toBeInstanceOf(PluginError)
        expect(importModule).not.toHaveBeenCalled()
    })

    it('refuse un module qui n’exporte ni register ni render', async () => {
        await expect(
            activatePlugin(installed as never, {
                takenTypes: [],
                appVersion: '0.4.1',
                registerCellType: vi.fn(),
                importModule: async () => ({}) as never,
            }),
        ).rejects.toThrow(/n'exporte ni register ni render/)
    })

    it('enregistre les types déclarés quand le module n’a qu’un render', async () => {
        const registerCellType = vi.fn()
        const types = await activatePlugin(installed as never, {
            takenTypes: [],
            appVersion: '0.4.1',
            registerCellType,
            importModule: async () => ({render: () => '<p>ok</p>'}),
        })
        expect(types).toEqual(['hello'])
        expect(registerCellType).toHaveBeenCalledWith({type: 'hello', title: 'hello'})
    })
})

describe('createPluginStore', () => {
    it('ignore un enregistrement corrompu sans casser le reste', () => {
        const storage = memoryStorage()
        storage.setItem(
            'sqljob.plugins.v1',
            JSON.stringify([
                {manifest: {...manifest}, entryUrl: 'https://x/y.js', installedAt: '', enabled: true},
                {manifest: {id: 'cassé'}, entryUrl: 'x'},
                'pas un objet',
            ]),
        )
        const store = createPluginStore(storage)
        expect(store.list()).toHaveLength(1)
        expect(store.list()[0].manifest.id).toBe('hello-cell')
    })

    it('active, désactive et retire un plugin', () => {
        const store = createPluginStore(memoryStorage())
        store.add({
            manifest: manifest as never,
            entryUrl: 'https://x/y.js',
            installedAt: '2026-11-15T00:00:00.000Z',
            enabled: true,
        })
        store.setEnabled('hello-cell', false)
        expect(store.get('hello-cell')?.enabled).toBe(false)
        store.remove('hello-cell')
        expect(store.list()).toHaveLength(0)
    })

    it('remplace un plugin réinstallé au lieu de le dupliquer', () => {
        const store = createPluginStore(memoryStorage())
        const record = {
            manifest: manifest as never,
            entryUrl: 'https://x/y.js',
            installedAt: '',
            enabled: true,
        }
        store.add(record)
        store.add({...record, entryUrl: 'https://x/z.js'})
        expect(store.list()).toHaveLength(1)
        expect(store.get('hello-cell')?.entryUrl).toBe('https://x/z.js')
    })
})
