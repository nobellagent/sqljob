/**
 * Les plugins publiés sont le contrat vivant : ce test vérifie, sur les fichiers
 * réellement servis depuis `public/`, que le registre, les manifestes et les
 * octets des modules sont cohérents. Une empreinte périmée casse la CI, pas
 * l'utilisateur au moment de l'installation.
 */
import {readFileSync} from 'node:fs'
import {resolve} from 'node:path'
import {pathToFileURL} from 'node:url'
import {describe, expect, it, vi} from 'vitest'
import {parseManifest, parseRegistry} from '../src/core/plugins/manifest'
import {sha256Integrity, verifySize} from '../src/core/plugins/integrity'
import {APP_VERSION} from '../src/core/plugins/version'
import {MAX_PLUGIN_BYTES} from '../src/core/plugins/limits'

const root = process.cwd()
const registryRaw = JSON.parse(readFileSync(resolve(root, 'public/registry.json'), 'utf-8'))
const registry = parseRegistry(registryRaw)

describe('registre publié', () => {
    it('valide et contient au moins un plugin', () => {
        expect(registry.plugins.length).toBeGreaterThan(0)
    })

    for (const entry of registry.plugins) {
        describe(entry.id, () => {
            const modulePath = resolve(root, 'public', entry.entry)
            const bytes = readFileSync(modulePath)

            it('a un manifeste cohérent avec le registre', () => {
                const manifestPath = resolve(root, 'public/plugins', entry.id, 'cell-plugin.json')
                const raw = JSON.parse(readFileSync(manifestPath, 'utf-8'))
                expect(() => parseManifest(raw)).not.toThrow()
                expect(raw.id).toBe(entry.id)
                expect(raw.types).toEqual(entry.types)
                expect(raw.integrity).toBe(entry.integrity)
                expect(raw.version).toBe(entry.version)
            })

            it('a une empreinte et une taille qui correspondent aux octets publiés', async () => {
                expect(await sha256Integrity(new Uint8Array(bytes))).toBe(entry.integrity)
                expect(() => verifySize(new Uint8Array(bytes), entry.size)).not.toThrow()
            })

            it('reste sous la limite de taille', () => {
                expect(bytes.length).toBeLessThanOrEqual(MAX_PLUGIN_BYTES)
                expect(bytes.length).toBe(entry.size)
            })
        })
    }
})

describe('plugin hello-cell', () => {
    const manifestRaw = JSON.parse(readFileSync(resolve(root, 'public/plugins/hello-cell/cell-plugin.json'), 'utf-8'))
    const moduleUrl = pathToFileURL(resolve(root, 'public/plugins/hello-cell/hello-cell.mjs')).href

    it('expose un render qui produit du HTML échappé', async () => {
        const module = await import(moduleUrl)
        expect(typeof module.render).toBe('function')
        const html = await module.render({
            type: 'hello',
            cell: {title: 'Ventes <2026>'},
            rows: [{a: 1}, {a: 2}],
            theme: 'light',
        })
        expect(html).toContain('Ventes &lt;2026&gt;')
        expect(html).toContain('2 lignes')
    })

    it('expose un register qui déclare uniquement le type du manifeste', async () => {
        const module = await import(moduleUrl)
        const registerCellType = vi.fn()
        const log = vi.fn()
        await module.register({registerCellType, log, appVersion: APP_VERSION, plugin: manifestRaw})
        expect(registerCellType).toHaveBeenCalledWith({type: 'hello', title: 'Hello'})
        expect(log).toHaveBeenCalled()
    })
})

describe('plugin pdfme-plugin', () => {
    it('déclare deux requêtes et un template dans son manifeste', () => {
        const raw = JSON.parse(readFileSync(resolve(root, 'public/plugins/pdfme-plugin/cell-plugin.json'), 'utf-8'))
        const decl = raw.cellTypes[0]
        expect(decl.queries.map((q: any) => q.key)).toEqual(['data', 'filename'])
        expect(decl.schema.template.inputType).toBe('textarea')
        expect(raw.permissions).toContain('ui:download')
    })

    it('publie un module qui expose render et mount', () => {
        const source = readFileSync(resolve(root, 'public/plugins/pdfme-plugin/pdfme-plugin.mjs'), 'utf-8')
        expect(source).toMatch(/render/)
        expect(source).toMatch(/mount/)
    })
})

describe('version de l’application', () => {
    it('reste alignée sur package.json', () => {
        const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf-8'))
        expect(APP_VERSION).toBe(pkg.version)
    })
})
