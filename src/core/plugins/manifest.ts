/**
 * Manifeste de plugin de cellule (`cell-plugin.json`) et registre (`registry.json`).
 *
 * Un plugin ajoute un ou plusieurs types de cellule sans toucher au cœur. Le
 * manifeste est la seule chose que l'application lit avant de charger du code :
 * il doit donc être validé strictement, et refusé en bloc au moindre écart.
 */

/** Types fournis par l'application : un plugin ne peut pas les redéfinir. */
const BUILTIN_CELL_TYPES = [
    'markdown', 'source', 'buttonRunNextCells', 'sql', 'iframe', 'sqlStat', 'pivot',
    'uiParameter', 'publipostageWord', 'pdfme', 'perspective', 'univerSheet',
] as const

export type PluginPermission =
    | 'duckdb:read'
    | 'duckdb:write'
    | 'ui:render'
    | 'storage:local'
    | `network:${string}`

export interface PluginManifest {
    id: string
    name?: string
    description?: string
    homepage?: string
    version: string
    sqljobMinVersion: string
    types: string[]
    permissions: PluginPermission[]
    entry: string
    integrity: string
}

export interface RegistryEntry extends PluginManifest {
    size?: number
    withdrawn?: boolean
}

export interface PluginRegistry {
    schema: 1
    updatedAt?: string
    blocklist?: string[]
    plugins: RegistryEntry[]
}

type PluginErrorCode =
    | 'invalid_manifest'
    | 'invalid_registry'
    | 'not_found'
    | 'blocked'
    | 'withdrawn'
    | 'incompatible'
    | 'integrity_mismatch'
    | 'size_mismatch'
    | 'type_conflict'

export class PluginError extends Error {
    readonly code: PluginErrorCode

    constructor(code: PluginErrorCode, message: string) {
        super(message)
        this.name = 'PluginError'
        this.code = code
    }
}

const ID_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*$/
const VERSION_RE = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/
const TYPE_RE = /^[a-zA-Z][a-zA-Z0-9_-]{1,40}$/
const ENTRY_RE = /^(?!\/)(?!.*\.\.)[A-Za-z0-9._/-]+\.m?js$/
const INTEGRITY_RE = /^sha256-[A-Za-z0-9+/]{43}=$/
const HOST_RE = /^[a-z0-9.-]+(?::\d+)?$/i

const PERMISSIONS = new Set(['duckdb:read', 'duckdb:write', 'ui:render', 'storage:local'])

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function checkPermissions(value: unknown, errors: string[]): PluginPermission[] {
    if (!Array.isArray(value)) {
        errors.push('permissions doit être un tableau')
        return []
    }
    const out: PluginPermission[] = []
    for (const raw of value) {
        if (typeof raw !== 'string') {
            errors.push('permission non textuelle')
            continue
        }
        if (PERMISSIONS.has(raw)) {
            out.push(raw as PluginPermission)
            continue
        }
        if (raw.startsWith('network:')) {
            const host = raw.slice('network:'.length)
            if (!HOST_RE.test(host)) errors.push(`hôte de réseau invalide : « ${host} »`)
            else out.push(raw as PluginPermission)
            continue
        }
        errors.push(`permission inconnue : « ${raw} »`)
    }
    return out
}

function checkTypes(value: unknown, errors: string[]): string[] {
    if (!Array.isArray(value) || value.length === 0) {
        errors.push('types doit être un tableau non vide')
        return []
    }
    if (value.length > 8) errors.push('un plugin déclare au plus 8 types de cellule')
    const out: string[] = []
    for (const raw of value) {
        if (typeof raw !== 'string' || !TYPE_RE.test(raw)) {
            errors.push(`type de cellule invalide : « ${String(raw)} »`)
            continue
        }
        if ((BUILTIN_CELL_TYPES as readonly string[]).includes(raw)) {
            errors.push(`le type « ${raw} » est fourni par l'application`)
            continue
        }
        if (out.includes(raw)) {
            errors.push(`type déclaré deux fois : « ${raw} »`)
            continue
        }
        out.push(raw)
    }
    return out
}

/** Valide un manifeste et renvoie une copie normalisée (sans champ inconnu). */
export function parseManifest(raw: unknown): PluginManifest {
    const errors: string[] = []
    if (!isRecord(raw)) throw new PluginError('invalid_manifest', 'le manifeste doit être un objet')

    const id = typeof raw.id === 'string' ? raw.id.trim() : ''
    if (!id || id.length > 64 || !ID_RE.test(id)) {
        errors.push(`identifiant invalide : « ${id} »`)
    }

    const version = typeof raw.version === 'string' ? raw.version.trim() : ''
    if (!VERSION_RE.test(version)) errors.push(`version invalide : « ${version} »`)

    const sqljobMinVersion = typeof raw.sqljobMinVersion === 'string' ? raw.sqljobMinVersion.trim() : ''
    if (!VERSION_RE.test(sqljobMinVersion)) {
        errors.push(`sqljobMinVersion invalide : « ${sqljobMinVersion} »`)
    }

    const entry = typeof raw.entry === 'string' ? raw.entry.trim() : ''
    if (!ENTRY_RE.test(entry)) errors.push(`entrée invalide : « ${entry} »`)

    const integrity = typeof raw.integrity === 'string' ? raw.integrity.trim() : ''
    if (!INTEGRITY_RE.test(integrity)) errors.push('integrity doit valoir « sha256-<base64> »')

    const types = checkTypes(raw.types, errors)
    const permissions = checkPermissions(raw.permissions ?? [], errors)

    for (const key of ['name', 'description', 'homepage'] as const) {
        if (raw[key] !== undefined && typeof raw[key] !== 'string') {
            errors.push(`${key} doit être une chaîne`)
        }
    }

    if (errors.length > 0) {
        throw new PluginError('invalid_manifest', errors.join(' ; '))
    }

    return {
        id,
        version,
        sqljobMinVersion,
        types,
        permissions,
        entry,
        integrity,
        ...(raw.name ? { name: raw.name as string } : {}),
        ...(raw.description ? { description: raw.description as string } : {}),
        ...(raw.homepage ? { homepage: raw.homepage as string } : {}),
    }
}

/** Valide un registre complet ; la moindre entrée invalide invalide le registre. */
export function parseRegistry(raw: unknown): PluginRegistry {
    if (!isRecord(raw)) throw new PluginError('invalid_registry', 'le registre doit être un objet')
    if (raw.schema !== 1) throw new PluginError('invalid_registry', 'schéma de registre inconnu (attendu : 1)')
    if (!Array.isArray(raw.plugins)) throw new PluginError('invalid_registry', 'plugins doit être un tableau')

    const errors: string[] = []
    const plugins: RegistryEntry[] = []
    const seen = new Set<string>()

    for (const [index, item] of raw.plugins.entries()) {
        let manifest: PluginManifest
        try {
            manifest = parseManifest(item)
        } catch (err) {
            errors.push(`entrée ${index} : ${(err as Error).message}`)
            continue
        }
        if (seen.has(manifest.id)) {
            errors.push(`identifiant présent deux fois : « ${manifest.id} »`)
            continue
        }
        seen.add(manifest.id)

        const entry: RegistryEntry = {...manifest}
        if (isRecord(item)) {
            if (item.size !== undefined) {
                if (typeof item.size !== 'number' || item.size <= 0) errors.push(`${manifest.id} : taille invalide`)
                else entry.size = item.size
            }
            if (item.withdrawn !== undefined) {
                if (typeof item.withdrawn !== 'boolean') errors.push(`${manifest.id} : withdrawn doit être un booléen`)
                else entry.withdrawn = item.withdrawn
            }
        }
        plugins.push(entry)
    }

    const blocklist: string[] = []
    if (raw.blocklist !== undefined) {
        if (!Array.isArray(raw.blocklist)) errors.push('blocklist doit être un tableau')
        else {
            for (const item of raw.blocklist) {
                if (typeof item !== 'string' || !/^[a-z0-9.@-]+$/i.test(item)) {
                    errors.push(`entrée de blocklist invalide : « ${String(item)} »`)
                } else blocklist.push(item)
            }
        }
    }

    if (errors.length > 0) throw new PluginError('invalid_registry', errors.join(' ; '))

    return {
        schema: 1,
        plugins,
        blocklist,
        ...(typeof raw.updatedAt === 'string' ? {updatedAt: raw.updatedAt} : {}),
    }
}

/** Compare deux versions `x.y.z` (sans tenir compte du suffixe de pré-version). */
export function compareVersions(a: string, b: string): number {
    const parse = (v: string) => v.split('-')[0].split('.').map(n => Number.parseInt(n, 10) || 0)
    const [a1, a2, a3] = parse(a)
    const [b1, b2, b3] = parse(b)
    return a1 - b1 || a2 - b2 || a3 - b3
}

/** Vrai si l'application (`current`) satisfait le minimum demandé par le plugin. */
export function meetsMinVersion(current: string, minimum: string): boolean {
    return compareVersions(current, minimum) >= 0
}

/** Cherche une entrée installable dans le registre, en refusant les cas limites. */
export function resolveEntry(
    registry: PluginRegistry,
    id: string,
    currentVersion: string,
): RegistryEntry {
    const blocklist = registry.blocklist ?? []
    if (blocklist.includes(id)) {
        throw new PluginError('blocked', `le plugin « ${id} » est bloqué par le registre`)
    }
    const entry = registry.plugins.find(p => p.id === id)
    if (!entry) throw new PluginError('not_found', `plugin introuvable : « ${id} »`)
    if (entry.withdrawn) {
        throw new PluginError('withdrawn', `le plugin « ${id} » a été retiré par son auteur`)
    }
    if (blocklist.includes(`${entry.id}@${entry.version}`)) {
        throw new PluginError('blocked', `la version ${entry.version} de « ${id} » est bloquée`)
    }
    if (!meetsMinVersion(currentVersion, entry.sqljobMinVersion)) {
        throw new PluginError(
            'incompatible',
            `« ${id} » exige sqljob ${entry.sqljobMinVersion} (version courante : ${currentVersion})`,
        )
    }
    return entry
}

/** Vrai si le type est déjà pris (cœur ou plugin installé). */
export function assertTypeAvailable(type: string, taken: Iterable<string>): void {
    if ((BUILTIN_CELL_TYPES as readonly string[]).includes(type)) {
        throw new PluginError('type_conflict', `le type « ${type} » est fourni par l'application`)
    }
    for (const existing of taken) {
        if (existing === type) throw new PluginError('type_conflict', `le type « ${type} » est déjà enregistré`)
    }
}
