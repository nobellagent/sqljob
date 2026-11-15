/**
 * Plugins installés : état persistant, sans dépendance au DOM.
 *
 * Le stockage est injecté (`localStorage` en production, un objet en mémoire
 * dans les tests). Un enregistrement corrompu est ignoré plutôt que de faire
 * échouer le démarrage : un plugin mal écrit ne doit pas bloquer l'application.
 */
import {parseManifest, type PluginManifest} from './manifest'

const PLUGINS_STORAGE_KEY = 'sqljob.plugins.v1'

export interface StorageLike {
    getItem(key: string): string | null
    setItem(key: string, value: string): void
    removeItem(key: string): void
}

export interface InstalledPlugin {
    manifest: PluginManifest
    /** URL absolue du module ES, résolue à l'installation. */
    entryUrl: string
    installedAt: string
    enabled: boolean
}

export interface PluginStore {
    list(): InstalledPlugin[]
    get(id: string): InstalledPlugin | undefined
    add(plugin: InstalledPlugin): void
    remove(id: string): void
    setEnabled(id: string, enabled: boolean): void
}

function read(storage: StorageLike, key: string): InstalledPlugin[] {
    const raw = storage.getItem(key)
    if (!raw) return []
    let parsed: unknown
    try {
        parsed = JSON.parse(raw)
    } catch {
        return []
    }
    if (!Array.isArray(parsed)) return []

    const out: InstalledPlugin[] = []
    for (const item of parsed) {
        if (typeof item !== 'object' || item === null) continue
        const record = item as Record<string, unknown>
        try {
            const manifest = parseManifest(record.manifest)
            if (typeof record.entryUrl !== 'string' || !record.entryUrl) continue
            out.push({
                manifest,
                entryUrl: record.entryUrl,
                installedAt: typeof record.installedAt === 'string' ? record.installedAt : '',
                enabled: record.enabled !== false,
            })
        } catch {
            // enregistrement invalide : ignoré
        }
    }
    return out
}

function write(storage: StorageLike, key: string, plugins: InstalledPlugin[]): void {
    storage.setItem(key, JSON.stringify(plugins))
}

export function createPluginStore(
    storage: StorageLike,
    key: string = PLUGINS_STORAGE_KEY,
): PluginStore {
    return {
        list: () => read(storage, key),
        get: id => read(storage, key).find(p => p.manifest.id === id),
        add(plugin) {
            const plugins = read(storage, key).filter(p => p.manifest.id !== plugin.manifest.id)
            plugins.push(plugin)
            write(storage, key, plugins)
        },
        remove(id) {
            write(storage, key, read(storage, key).filter(p => p.manifest.id !== id))
        },
        setEnabled(id, enabled) {
            const plugins = read(storage, key).map(p =>
                p.manifest.id === id ? {...p, enabled} : p,
            )
            write(storage, key, plugins)
        },
    }
}
