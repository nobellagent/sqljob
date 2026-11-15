/**
 * Câblage navigateur des plugins.
 *
 * - stockage : `localStorage` (`sqljob.plugins.v1`) ;
 * - registre : `registry.json` servi à côté de l'application, surchargeable par
 *   la clé `sqljob.plugins.registryUrl` ;
 * - activation : au démarrage pour les plugins activés, à l'installation sinon.
 *
 * L'état est exposé via `useSyncExternalStore` (voir `usePlugins`), pour que
 * l'onglet Plugins se rafraîchisse sans recharger la page.
 */
import {
    activatePlugin,
    createPluginStore,
    installPlugin,
    parseRegistry,
    type InstalledPlugin,
    type PluginModule,
    type PluginRegistry,
    type PluginStore,
} from '../../core/plugins'
import {APP_VERSION} from '../../core/plugins/version'
import {registerCellBody, unregisterCellBody, listCellBodyTypes} from '../components/cellTypes/registry'
import {PluginBody} from '../components/cellTypes/PluginBody'
import {deletePluginType, deletePluginTypesOf, listPluginTypes, setPluginType} from './pluginTypes'

const REGISTRY_URL_KEY = 'sqljob.plugins.registryUrl'

interface PluginsState {
    installed: InstalledPlugin[]
    registry: PluginRegistry | null
    active: string[]
    busy: boolean
    error: string | null
}

let state: PluginsState = {installed: [], registry: null, active: [], busy: false, error: null}
const listeners = new Set<() => void>()

function emit(): void {
    for (const listener of listeners) listener()
}

function setState(patch: Partial<PluginsState>): void {
    state = {...state, ...patch}
    emit()
}

export function subscribePlugins(listener: () => void): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
}

export function getPluginsState(): PluginsState {
    return state
}

function store(): PluginStore {
    return createPluginStore(window.localStorage)
}

/** URL du registre : surcharge locale, sinon `registry.json` à la racine du site. */
export function getRegistryUrl(): string {
    const override = window.localStorage.getItem(REGISTRY_URL_KEY)
    if (override) return override
    // Relatif à la page courante : fonctionne aussi sous un sous-chemin (/sqljob/).
    return new URL('registry.json', window.location.href).toString()
}

export function setRegistryUrl(url: string | null): void {
    if (url) window.localStorage.setItem(REGISTRY_URL_KEY, url)
    else window.localStorage.removeItem(REGISTRY_URL_KEY)
}

async function fetchBytes(url: string): Promise<Uint8Array> {
    const response = await fetch(url, {cache: 'no-cache'})
    if (!response.ok) throw new Error(`téléchargement impossible (${response.status}) : ${url}`)
    return new Uint8Array(await response.arrayBuffer())
}

async function loadModule(url: string): Promise<PluginModule> {
    return import(/* @vite-ignore */ url) as Promise<PluginModule>
}

/** Charge le registre distant et le valide. */
export async function loadRegistry(): Promise<PluginRegistry> {
    setState({busy: true, error: null})
    try {
        const url = getRegistryUrl()
        const response = await fetch(url, {cache: 'no-cache'})
        if (!response.ok) throw new Error(`registre inaccessible (${response.status}) : ${url}`)
        const registry = parseRegistry(await response.json())
        setState({registry, busy: false})
        return registry
    } catch (error) {
        setState({busy: false, error: (error as Error).message})
        throw error
    }
}

/** Active un plugin installé : enregistre ses types dans le registre de l'application. */
async function activate(record: InstalledPlugin): Promise<void> {
    const ownTypes = new Set(record.manifest.types)
    const taken = [
        ...listCellBodyTypes(),
        ...listPluginTypes().map(t => t.type),
    ].filter(type => !ownTypes.has(type))

    await activatePlugin(record, {
        takenTypes: taken,
        appVersion: APP_VERSION,
        importModule: loadModule,
        registerCellType({type, title}) {
            setPluginType({type, title, pluginId: record.manifest.id, entryUrl: record.entryUrl})
            registerCellBody(type, PluginBody)
        },
    })
    setState({active: [...new Set([...state.active, record.manifest.id])]})
}

/** Désactive un plugin : ses types disparaissent du rendu. */
function deactivate(pluginId: string): void {
    for (const info of listPluginTypes()) {
        if (info.pluginId === pluginId) {
            unregisterCellBody(info.type)
            deletePluginType(info.type)
        }
    }
    setState({active: state.active.filter(id => id !== pluginId)})
}

/** Installe un plugin depuis le registre puis l'active. */
export async function install(id: string): Promise<InstalledPlugin> {
    setState({busy: true, error: null})
    try {
        const registry = state.registry ?? (await loadRegistry())
        const record = await installPlugin({
            registry,
            id,
            currentVersion: APP_VERSION,
            store: store(),
            fetchBytes,
            baseUrl: getRegistryUrl(),
        })
        setState({installed: store().list(), busy: false})
        await activate(record)
        return record
    } catch (error) {
        setState({busy: false, error: (error as Error).message})
        throw error
    }
}

/** Désinstalle un plugin : désactivation puis retrait du stockage. */
export function uninstall(id: string): void {
    deactivate(id)
    deletePluginTypesOf(id)
    store().remove(id)
    setState({installed: store().list()})
}

/** Active ou désactive un plugin installé. */
export async function setEnabled(id: string, enabled: boolean): Promise<void> {
    store().setEnabled(id, enabled)
    setState({installed: store().list()})
    if (!enabled) {
        deactivate(id)
        return
    }
    const record = store().get(id)
    if (record) {
        try {
            await activate(record)
            setState({error: null})
        } catch (error) {
            setState({error: (error as Error).message})
        }
    }
}

/**
 * Au démarrage : charge les plugins installés et active ceux qui le sont.
 * Un plugin fautif est signalé, les autres continuent de fonctionner.
 */
export async function initPlugins(): Promise<void> {
    const installed = store().list()
    setState({installed})
    if (installed.length === 0) return

    const failures: string[] = []
    for (const record of installed) {
        if (!record.enabled) continue
        try {
            await activate(record)
        } catch (error) {
            failures.push(`${record.manifest.id} : ${(error as Error).message}`)
        }
    }
    setState({error: failures.length > 0 ? failures.join(' ; ') : null})
}
