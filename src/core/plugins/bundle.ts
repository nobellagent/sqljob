/**
 * Plugins embarqués dans un document exporté.
 *
 * Un export HTML est un fichier autonome : s'il contient des cellules fournies
 * par un plugin, il doit pouvoir les rendre sans registre ni réseau. On embarque
 * donc le manifeste, l'URL d'origine et — quand c'est possible — la source du
 * module, que l'iframe transformera en URL `blob:` au moment du rendu.
 */
import {parseManifest, type PluginManifest} from './manifest'

export interface EmbeddedPlugin {
    manifest: PluginManifest
    /** URL d'origine, conservée pour l'affichage et le débogage. */
    entryUrl: string
    /** Source du module ES ; absente si le téléchargement a échoué. */
    source?: string
}

/** Identifiant du `<script type="application/json">` dans le HTML exporté. */
export const PLUGIN_BUNDLE_ELEMENT_ID = 'sqljobPluginBundle'

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Lit un bundle embarqué ; les entrées invalides sont ignorées, pas fatales. */
export function parsePluginBundle(raw: unknown): EmbeddedPlugin[] {
    if (!Array.isArray(raw)) return []
    const out: EmbeddedPlugin[] = []
    for (const item of raw) {
        if (!isRecord(item)) continue
        try {
            const manifest = parseManifest(item.manifest)
            if (typeof item.entryUrl !== 'string' || !item.entryUrl) continue
            out.push({
                manifest,
                entryUrl: item.entryUrl,
                ...(typeof item.source === 'string' && item.source ? {source: item.source} : {}),
            })
        } catch {
            // entrée invalide : ignorée
        }
    }
    return out
}

/** Sérialise pour insertion dans un `<script type="application/json">`. */
export function serializePluginBundle(plugins: EmbeddedPlugin[]): string {
    return JSON.stringify(plugins).replace(/</g, '\\u003c')
}

/** Types de cellule employés par un document (pages → groupes → cellules). */
export function collectDocumentCellTypes(pages: unknown): string[] {
    const types = new Set<string>()

    const visitGroup = (group: unknown): void => {
        if (!isRecord(group)) return
        const cells = Array.isArray(group.cells) ? group.cells : []
        for (const cell of cells) {
            if (isRecord(cell) && typeof cell.type === 'string') types.add(cell.type)
        }
        const children = Array.isArray(group.children) ? group.children : []
        for (const child of children) visitGroup(child)
    }

    if (Array.isArray(pages)) {
        for (const page of pages) {
            if (!isRecord(page)) continue
            for (const key of ['groups', 'linkGroups'] as const) {
                const groups = Array.isArray(page[key]) ? page[key] as unknown[] : []
                for (const group of groups) visitGroup(group)
            }
        }
    }

    return [...types].sort()
}
