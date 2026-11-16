/**
 * Préparation des plugins à embarquer dans un export HTML.
 *
 * On n'embarque que les plugins réellement utilisés par le document : un export
 * ne doit pas transporter du code que ses cellules ne peuvent pas déclencher.
 */
import {
    collectDocumentCellTypes,
    type EmbeddedPlugin,
} from '../../core/plugins/bundle'
import type {InstalledPlugin} from '../../core/plugins/store'

/** Au-delà de cette taille, la source n'est pas embarquée (URL d'origine conservée). */
export const MAX_EMBEDDED_SOURCE_BYTES = 512 * 1024

interface BuildOptions {
    pages: unknown
    installed: InstalledPlugin[]
    /** Téléchargement de la source ; injectable pour les tests. */
    fetchSource?: (url: string) => Promise<string>
}

async function defaultFetchSource(url: string): Promise<string> {
    const response = await fetch(url, {cache: 'no-cache'})
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return response.text()
}

/** Sélectionne les plugins employés par le document et récupère leur source. */
export async function buildEmbeddedPlugins(options: BuildOptions): Promise<EmbeddedPlugin[]> {
    const usedTypes = new Set(collectDocumentCellTypes(options.pages))
    const fetchSource = options.fetchSource ?? defaultFetchSource
    const selected = options.installed.filter(
        plugin => plugin.enabled && plugin.manifest.types.some(type => usedTypes.has(type)),
    )

    const embedded: EmbeddedPlugin[] = []
    for (const plugin of selected) {
        let source: string | undefined
        try {
            const text = await fetchSource(plugin.entryUrl)
            if (text.length <= MAX_EMBEDDED_SOURCE_BYTES) source = text
        } catch {
            // hors ligne ou URL disparue : l'export gardera l'URL d'origine
            source = undefined
        }
        embedded.push({manifest: plugin.manifest, entryUrl: plugin.entryUrl, ...(source ? {source} : {})})
    }
    return embedded
}
