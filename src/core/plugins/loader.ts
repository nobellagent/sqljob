/**
 * Installation et activation d'un plugin.
 *
 * Installation : résolution dans le registre, téléchargement, vérification de
 * la taille et de l'empreinte, écriture dans le stockage local.
 * Activation : `import()` du module, appel de son `register(api)`, et
 * enregistrement des types de cellule dans le registre de l'application.
 *
 * Les entrées/sorties sont injectées (`fetchBytes`, `importModule`,
 * `storage`) : rien ici ne dépend du DOM, donc tout est testable en Node.
 */
import {verifyIntegrity, verifySize} from './integrity'
import {MAX_PLUGIN_BYTES} from './limits'
import {
    PluginError,
    assertTypeAvailable,
    resolveEntry,
    type PluginManifest,
    type PluginRegistry,
    type RegistryEntry,
} from './manifest'
import type {InstalledPlugin, PluginStore} from './store'

/** Contexte passé au `render` d'un type de cellule fourni par un plugin. */
export interface PluginRenderContext {
    type: string
    cell: unknown
    /** Lignes de résultat, si la cellule en a. */
    rows?: Record<string, unknown>[]
    theme?: 'light' | 'dark'
}

/**
 * Métadonnées d'un type de cellule, côté application.
 *
 * Le rendu n'est pas ici : il a lieu dans une iframe sandboxée qui importe le
 * module du plugin et appelle son export `render`. Cette séparation est ce qui
 * empêche le plugin de s'exécuter dans le contexte de l'application.
 */
interface PluginCellType {
    type: string
    title: string
}

export interface PluginApi {
    /** Version de l'application hôte. */
    readonly appVersion: string
    readonly plugin: Readonly<PluginManifest>
    registerCellType(definition: PluginCellType): void
    log(...args: unknown[]): void
}

/**
 * Forme attendue du module ES d'un plugin.
 *
 * `register` est facultatif : il ne sert qu'à déclarer les titres des types.
 * `render(context)` est requis et s'exécute dans l'iframe sandboxée.
 */
export interface PluginModule {
    register?(api: PluginApi): void | Promise<void>
    render?(context: PluginRenderContext): string | Promise<string>
}

interface InstallOptions {
    registry: PluginRegistry
    id: string
    currentVersion: string
    store: PluginStore
    /** Télécharge le module ; reçoit l'URL absolue. */
    fetchBytes(url: string): Promise<Uint8Array>
    /** Base des URL d'entrée (celle du `registry.json`). */
    baseUrl: string
    now?: () => Date
}

/** Résout l'URL absolue d'une entrée relative à la base du registre. */
export function resolveEntryUrl(baseUrl: string, entry: string): string {
    return new URL(entry, baseUrl).toString()
}

function alreadyInstalled(store: PluginStore, entry: RegistryEntry): InstalledPlugin | undefined {
    return store
        .list()
        .find(p => p.manifest.id === entry.id && p.manifest.version === entry.version)
}

/**
 * Installe un plugin depuis un registre déjà validé.
 * Lève une `PluginError` : `not_found`, `blocked`, `withdrawn`, `incompatible`,
 * `size_mismatch`, `integrity_mismatch`.
 */
export async function installPlugin(options: InstallOptions): Promise<InstalledPlugin> {
    const {registry, id, currentVersion, store, fetchBytes, baseUrl} = options
    const entry = resolveEntry(registry, id, currentVersion)

    const existing = alreadyInstalled(store, entry)
    if (existing) return existing

    const entryUrl = resolveEntryUrl(baseUrl, entry.entry)
    const bytes = await fetchBytes(entryUrl)
    if (bytes.byteLength > MAX_PLUGIN_BYTES) {
        throw new PluginError(
            'size_mismatch',
            `module trop volumineux : ${bytes.byteLength} octets (maximum ${MAX_PLUGIN_BYTES})`,
        )
    }
    verifySize(bytes, entry.size)
    await verifyIntegrity(bytes, entry.integrity)

    const record: InstalledPlugin = {
        manifest: entry,
        entryUrl,
        installedAt: (options.now?.() ?? new Date()).toISOString(),
        enabled: true,
    }
    store.add(record)
    return record
}

interface ActivateOptions {
    /** Types déjà pris (cœur + plugins déjà activés). */
    takenTypes: Iterable<string>
    importModule(url: string): Promise<PluginModule>
    registerCellType(definition: PluginCellType): void
    appVersion: string
}

/**
 * Active un plugin installé et renvoie les types qu'il a enregistrés.
 * Un conflit de type annule l'activation (aucun type partiel n'est conservé).
 */
export async function activatePlugin(
    plugin: InstalledPlugin,
    options: ActivateOptions,
): Promise<string[]> {
    const taken = new Set(options.takenTypes)
    for (const type of plugin.manifest.types) {
        assertTypeAvailable(type, taken)
    }

    const module = await options.importModule(plugin.entryUrl)
    if (typeof module.register !== 'function' && typeof module.render !== 'function') {
        throw new PluginError(
            'invalid_manifest',
            `le module de « ${plugin.manifest.id} » n'exporte ni register ni render`,
        )
    }

    const declared = new Set(plugin.manifest.types)
    const registered: string[] = []

    const api: PluginApi = {
        appVersion: options.appVersion,
        plugin: Object.freeze(plugin.manifest),
        registerCellType(definition) {
            if (!declared.has(definition.type)) {
                throw new PluginError(
                    'type_conflict',
                    `le plugin enregistre « ${definition.type} », absent du manifeste`,
                )
            }
            if (registered.includes(definition.type)) {
                throw new PluginError('type_conflict', `type déjà enregistré par ce plugin : « ${definition.type} »`)
            }
            options.registerCellType(definition)
            registered.push(definition.type)
        },
        log: (...args: unknown[]) => console.log(`[plugin:${plugin.manifest.id}]`, ...args),
    }

    if (typeof module.register === 'function') {
        await module.register(api)
    }

    // Les types déclarés mais non enregistrés par `register` gardent un titre par défaut.
    for (const type of plugin.manifest.types) {
        if (!registered.includes(type)) {
            options.registerCellType({type, title: type})
            registered.push(type)
        }
    }

    return registered
}
