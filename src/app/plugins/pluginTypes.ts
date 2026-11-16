/**
 * Types de cellule fournis par des plugins, côté application.
 *
 * Le rendu n'est pas un composant React importé : chaque type pointe vers
 * l'URL du module du plugin, chargé dans une iframe sandboxée par `PluginBody`.
 * Cette carte ne contient donc que des métadonnées.
 *
 * L'enregistrement alimente aussi `CELL_TYPE_SCHEMAS.types` : le reste de
 * l'application (création, configuration, exécution, export) traite alors un
 * type de plugin exactement comme un type natif.
 */
import {CELL_TYPE_SCHEMAS} from '../../lib/cellTypeSchemas'
import {buildCellSchema} from '../../core/plugins/cellSchema'
import type {PluginCellTypeDecl, PluginPermission} from '../../core/plugins/manifest'

interface PluginTypeInfo {
    type: string
    title: string
    pluginId: string
    /** URL absolue du module ES du plugin. */
    entryUrl: string
    /** Source du module, quand elle est embarquée dans le document exporté. */
    source?: string
    /** Icône du cœur (nom d'icône), ou `puzzle` par défaut. */
    icon?: string
    /** Permissions déclarées : contrôlées à l'exécution par l'hôte. */
    permissions?: PluginPermission[]
    /** Description complète (requêtes + champs de configuration). */
    decl?: PluginCellTypeDecl
}

const types = new Map<string, PluginTypeInfo>()

const schemaRegistry = CELL_TYPE_SCHEMAS.types as unknown as Record<string, unknown>

export function setPluginType(info: PluginTypeInfo): void {
    types.set(info.type, info)
    if (info.decl) {
        schemaRegistry[info.type] = buildCellSchema(info.decl)
    }
}

export function deletePluginType(type: string): void {
    types.delete(type)
    delete schemaRegistry[type]
}

export function getPluginType(type: string): PluginTypeInfo | undefined {
    return types.get(type)
}

export function listPluginTypes(): PluginTypeInfo[] {
    return [...types.values()]
}

/** Retire tous les types d'un plugin (désinstallation). */
export function deletePluginTypesOf(pluginId: string): void {
    for (const [type, info] of types) {
        if (info.pluginId === pluginId) deletePluginType(type)
    }
}
