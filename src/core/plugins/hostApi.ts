/**
 * API hôte offerte aux plugins, et contrôles qui l'accompagnent.
 *
 * Une permission déclarée dans le manifeste n'est pas une autorisation : c'est
 * ici que chaque appel est vérifié avant d'être exécuté. Ce module ne contient
 * que des fonctions pures, testables sans navigateur.
 */
import type {PluginManifest, PluginPermission} from './manifest'

export type HostMethod = 'query' | 'download' | 'storage.get' | 'storage.set' | 'storage.remove'

const METHOD_PERMISSION: Record<HostMethod, PluginPermission> = {
    query: 'duckdb:read',
    download: 'ui:download',
    'storage.get': 'storage:local',
    'storage.set': 'storage:local',
    'storage.remove': 'storage:local',
}

export class HostError extends Error {
    readonly method: HostMethod

    constructor(method: HostMethod, message: string) {
        super(message)
        this.name = 'HostError'
        this.method = method
    }
}

/** Refuse l'appel si le manifeste ne déclare pas la permission correspondante. */
export function assertHostPermission(manifest: PluginManifest, method: HostMethod): void {
    const needed = METHOD_PERMISSION[method]
    if (!needed) throw new HostError(method, `méthode hôte inconnue : « ${method} »`)
    if (!manifest.permissions.includes(needed)) {
        throw new HostError(method, `permission refusée : « ${needed} » non déclarée dans le manifeste`)
    }
}

const FORBIDDEN_KEYWORDS =
    /\b(insert|update|delete|drop|create|alter|attach|detach|copy|export|import|install|load|pragma|call|vacuum|checkpoint|set)\b/i

/**
 * Vrai si la requête peut être exécutée par un plugin.
 *
 * On accepte un seul `SELECT` ou `WITH`. Le but n'est pas de valider la syntaxe
 * (DuckDB le fait), mais d'empêcher une écriture ou un effet de bord.
 */
export function isReadOnlyQuery(sql: string): boolean {
    const trimmed = sql.trim()
    if (!trimmed) return false

    // Un point-virgule suivi d'autre chose = plusieurs instructions.
    const withoutTrailing = trimmed.replace(/;\s*$/, '')
    if (withoutTrailing.includes(';')) return false

    const stripped = withoutTrailing
        .replace(/--[^\n]*/g, ' ')
        .replace(/\/\*[\s\S]*?\*\//g, ' ')
        .trim()

    if (!/^(select|with)\b/i.test(stripped)) return false
    return !FORBIDDEN_KEYWORDS.test(stripped)
}

/** Nom de fichier sûr pour un téléchargement déclenché par un plugin. */
export function sanitizeDownloadName(name: unknown): string {
    if (typeof name !== 'string') return 'export.bin'
    const cleaned = Array.from(name)
        .filter(char => char.charCodeAt(0) > 31 && char.charCodeAt(0) !== 127)
        .join('')
        .replace(/[\\/]/g, '_')
        .replace(/^\.+/, '')
        .trim()
        .slice(0, 120)
    return cleaned || 'export.bin'
}

/** Clé de stockage local, préfixée par le plugin : pas de collision entre plugins. */
export function storageKeyFor(pluginId: string, key: unknown): string {
    const safe = typeof key === 'string' && /^[A-Za-z0-9._-]{1,64}$/.test(key) ? key : null
    if (!safe) throw new HostError('storage.get', `clé de stockage invalide : « ${String(key)} »`)
    return `sqljob.plugin.${pluginId}.${safe}`
}
