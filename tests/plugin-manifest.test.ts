import {describe, expect, it} from 'vitest'
import {
    PluginError,
    assertTypeAvailable,
    compareVersions,
    meetsMinVersion,
    parseManifest,
    parseRegistry,
    resolveEntry,
} from '../src/core/plugins/manifest'

const valid = {
    id: 'hello-cell',
    version: '1.0.0',
    sqljobMinVersion: '0.4.0',
    types: ['hello'],
    permissions: ['ui:render'],
    entry: 'hello-cell.mjs',
    integrity: 'sha256-LPJNul+wow4m6DsqxbninhsWHlwfp0JecwQzYpOLmCQ=',
}

const registry = {
    schema: 1,
    blocklist: ['bad-plugin'],
    plugins: [valid, {...valid, id: 'autre-plugin', types: ['autre']}],
}

describe('parseManifest', () => {
    it('accepte un manifeste valide et ne garde que les champs connus', () => {
        const parsed = parseManifest({...valid, license: 'MIT'})
        expect(parsed.id).toBe('hello-cell')
        expect(parsed.types).toEqual(['hello'])
        expect(parsed).not.toHaveProperty('license')
    })

    it('refuse un identifiant invalide', () => {
        expect(() => parseManifest({...valid, id: 'Hello Cell'})).toThrow(PluginError)
        try {
            parseManifest({...valid, id: 'Hello Cell'})
        } catch (err) {
            expect((err as PluginError).code).toBe('invalid_manifest')
            expect((err as Error).message).toContain('identifiant invalide')
        }
    })

    it('refuse une version qui ne suit pas SemVer', () => {
        expect(() => parseManifest({...valid, version: '1.0'})).toThrow(/version invalide/)
    })

    it('refuse une entrée absolue ou qui remonte l’arborescence', () => {
        expect(() => parseManifest({...valid, entry: '/abs/plugin.js'})).toThrow(/entrée invalide/)
        expect(() => parseManifest({...valid, entry: '../plugin.js'})).toThrow(/entrée invalide/)
        expect(() => parseManifest({...valid, entry: 'x.json'})).toThrow(/entrée invalide/)
    })

    it('refuse une empreinte mal formée', () => {
        expect(() => parseManifest({...valid, integrity: 'sha256-abc'})).toThrow(/integrity/)
        expect(() => parseManifest({...valid, integrity: 'md5-abc'})).toThrow(/integrity/)
    })

    it('refuse un type fourni par l’application', () => {
        expect(() => parseManifest({...valid, types: ['sql']})).toThrow(/fourni par l'application/)
    })

    it('refuse un type déclaré deux fois', () => {
        expect(() => parseManifest({...valid, types: ['hello', 'hello']})).toThrow(/deux fois/)
    })

    it('valide les permissions connues et les hôtes réseau', () => {
        const parsed = parseManifest({...valid, permissions: ['duckdb:read', 'network:api.example.org']})
        expect(parsed.permissions).toEqual(['duckdb:read', 'network:api.example.org'])
    })

    it('refuse une permission inconnue ou un hôte invalide', () => {
        expect(() => parseManifest({...valid, permissions: ['filesystem:all']})).toThrow(/permission inconnue/)
        expect(() => parseManifest({...valid, permissions: ['network:http://x']})).toThrow(/hôte de réseau invalide/)
    })

    it('refuse un manifeste qui n’est pas un objet', () => {
        expect(() => parseManifest('hello')).toThrow(/objet/)
        expect(() => parseManifest([])).toThrow(/objet/)
    })
})

describe('parseRegistry', () => {
    it('accepte un registre valide', () => {
        const parsed = parseRegistry(registry)
        expect(parsed.plugins).toHaveLength(2)
        expect(parsed.blocklist).toEqual(['bad-plugin'])
    })

    it('refuse un schéma inconnu', () => {
        expect(() => parseRegistry({...registry, schema: 2})).toThrow(/schéma de registre inconnu/)
    })

    it('signale la première entrée invalide', () => {
        const broken = {...registry, plugins: [valid, {...valid, id: 'X Y', types: ['x']}]}
        expect(() => parseRegistry(broken)).toThrow(/entrée 1/)
    })

    it('refuse un identifiant présent deux fois', () => {
        const dup = {...registry, plugins: [valid, {...valid, types: ['autre']}]}
        expect(() => parseRegistry(dup)).toThrow(/deux fois/)
    })

    it('accepte withdrawn et size', () => {
        const parsed = parseRegistry({...registry, plugins: [{...valid, withdrawn: true, size: 128}]})
        expect(parsed.plugins[0].withdrawn).toBe(true)
        expect(parsed.plugins[0].size).toBe(128)
    })
})

describe('versions', () => {
    it('compare les versions numériquement, pas lexicographiquement', () => {
        expect(compareVersions('0.10.0', '0.9.0')).toBeGreaterThan(0)
        expect(compareVersions('1.0.0', '1.0.0')).toBe(0)
        expect(compareVersions('0.4.0', '0.4.1')).toBeLessThan(0)
    })

    it('ignore le suffixe de pré-version', () => {
        expect(compareVersions('1.0.0-beta.2', '1.0.0')).toBe(0)
    })

    it('vérifie la version minimale', () => {
        expect(meetsMinVersion('0.4.1', '0.4.0')).toBe(true)
        expect(meetsMinVersion('0.3.9', '0.4.0')).toBe(false)
    })
})

describe('resolveEntry', () => {
    const parsed = parseRegistry(registry)

    it('trouve une entrée', () => {
        expect(resolveEntry(parsed, 'hello-cell', '0.4.1').version).toBe('1.0.0')
    })

    it('refuse un plugin absent', () => {
        expect(() => resolveEntry(parsed, 'inconnu', '0.4.1')).toThrow(/introuvable/)
    })

    it('refuse un plugin bloqué', () => {
        const blocked = parseRegistry({
            ...registry,
            plugins: [{...valid, id: 'bad-plugin'}],
        })
        expect(() => resolveEntry(blocked, 'bad-plugin', '0.4.1')).toThrow(/bloqué/)
    })

    it('refuse une version bloquée nommément', () => {
        const blocked = parseRegistry({...registry, blocklist: ['hello-cell@1.0.0']})
        expect(() => resolveEntry(blocked, 'hello-cell', '0.4.1')).toThrow(/version 1.0.0/)
    })

    it('refuse un plugin retiré', () => {
        const withdrawn = parseRegistry({...registry, plugins: [{...valid, withdrawn: true}]})
        expect(() => resolveEntry(withdrawn, 'hello-cell', '0.4.1')).toThrow(/retiré/)
    })

    it('refuse une version d’application trop ancienne', () => {
        expect(() => resolveEntry(parsed, 'hello-cell', '0.3.0')).toThrow(/exige sqljob 0.4.0/)
    })
})

describe('assertTypeAvailable', () => {
    it('refuse un type du cœur', () => {
        expect(() => assertTypeAvailable('sql', [])).toThrow(/fourni par l'application/)
    })

    it('refuse un type déjà enregistré', () => {
        expect(() => assertTypeAvailable('hello', ['hello'])).toThrow(/déjà enregistré/)
    })

    it('accepte un type libre', () => {
        expect(() => assertTypeAvailable('hello', ['autre'])).not.toThrow()
    })
})
