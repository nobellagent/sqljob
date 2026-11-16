/**
 * Types de cellule fournis par des plugins, côté application.
 *
 * Le rendu n'est pas un composant React importé : chaque type pointe vers
 * l'URL du module du plugin, chargé dans une iframe sandboxée par `PluginBody`.
 * Cette carte ne contient donc que des métadonnées.
 */
interface PluginTypeInfo {
    type: string
    title: string
    pluginId: string
    /** URL absolue du module ES du plugin. */
    entryUrl: string
    /** Source du module, quand elle est embarquée dans le document exporté. */
    source?: string
}

const types = new Map<string, PluginTypeInfo>()

export function setPluginType(info: PluginTypeInfo): void {
    types.set(info.type, info)
}

export function deletePluginType(type: string): void {
    types.delete(type)
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
        if (info.pluginId === pluginId) types.delete(type)
    }
}
