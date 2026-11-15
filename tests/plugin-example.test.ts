/**
 * Le plugin d'exemple est le contrat vivant : ce test vérifie, sur les fichiers
 * réellement publiés dans `public/`, que le registre, le manifeste et les octets
 * du module sont cohérents. Une empreinte périmée casse la CI, pas l'utilisateur.
 */
import {readFileSync} from 'node:fs'
import {resolve} from 'node:path'
import {pathToFileURL} from 'node:url'
import {describe, expect, it, vi} from 'vitest'
import {parseManifest, parseRegistry} from '../src/core/plugins/manifest'
import {sha256Integrity, verifySize} from '../src/core/plugins/integrity'
import {APP_VERSION} from '../src/core/plugins/version'

const root = process.cwd()
const registryRaw = JSON.parse(readFileSync(resolve(root, 'public/registry.json'), 'utf-8'))
const manifestRaw = JSON.parse(readFileSync(resolve(root, 'public/plugins/hello-cell/cell-plugin.json'), 'utf-8'))
const modulePath = resolve(root, 'public/plugins/hello-cell/hello-cell.mjs')
const moduleBytes = readFileSync(modulePath)
const moduleUrl = pathToFileURL(modulePath).href

describe('plugin d’exemple', () => {
    it('a un registre et un manifeste valides et cohérents', () => {
        const registry = parseRegistry(registryRaw)
        expect(registry.plugins).toHaveLength(1)
        expect(() => parseManifest(manifestRaw)).not.toThrow()
        expect(manifestRaw.id).toBe(registry.plugins[0].id)
        expect(manifestRaw.types).toEqual(registry.plugins[0].types)
    })

    it('a une empreinte et une taille qui correspondent aux octets publiés', async () => {
        const entry = parseRegistry(registryRaw).plugins[0]
        expect(await sha256Integrity(new Uint8Array(moduleBytes))).toBe(entry.integrity)
        expect(() => verifySize(new Uint8Array(moduleBytes), entry.size)).not.toThrow()
    })

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

describe('version de l’application', () => {
    it('reste alignée sur package.json', () => {
        const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf-8'))
        expect(APP_VERSION).toBe(pkg.version)
    })
})
