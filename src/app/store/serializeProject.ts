/**
 * Préparation du document avant stockage.
 *
 * Les cellules portent des références d'exécution (éléments DOM, refs React,
 * callbacks) qui rendent `JSON.stringify` et `structuredClone` impossibles :
 * `Converting circular structure to JSON`. Ces références ne doivent pas être
 * persistées — elles sont reconstruites au rendu.
 *
 * Ce module produit une copie profonde « stockable » : DOM, fonctions et cycles
 * sont retirés, `File`/`Blob`/`Date`/`ArrayBuffer` sont conservés tels quels.
 */

const SKIP_KEYS = new Set([
    'element',
    'elements',
    'container',
    'containerEl',
    'editor',
    'monaco',
    'instance',
    'chartInstance',
    'pivotInstance',
    'univerAPI',
    'view',
    '_pluginResults',
])

function isDomNode(value: unknown): boolean {
    return typeof Node !== 'undefined' && value instanceof Node
}

function isBinary(value: unknown): boolean {
    if (typeof File !== 'undefined' && value instanceof File) return true
    if (typeof Blob !== 'undefined' && value instanceof Blob) return true
    if (value instanceof Date) return true
    if (value instanceof ArrayBuffer) return true
    if (ArrayBuffer.isView(value)) return true
    return false
}

export function sanitizeForStorage<T>(value: T, seen: WeakSet<object> = new WeakSet()): unknown {
    if (value === null || typeof value !== 'object') {
        return typeof value === 'function' ? undefined : value
    }
    if (isDomNode(value)) return undefined
    if (isBinary(value)) return value
    if (seen.has(value as object)) return undefined
    seen.add(value as object)

    if (Array.isArray(value)) {
        return value.map(item => {
            const clean = sanitizeForStorage(item, seen)
            return clean === undefined ? null : clean
        })
    }

    const output: Record<string, unknown> = {}
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
        if (key.startsWith('__react') || key.startsWith('_react') || SKIP_KEYS.has(key)) continue
        const clean = sanitizeForStorage(item, seen)
        if (clean !== undefined) output[key] = clean
    }
    return output
}

/** Sérialisation stable, utilisable pour comparer deux versions du document. */
export function serializeForStorage(value: unknown): string {
    try {
        return JSON.stringify(sanitizeForStorage(value))
    } catch (err) {
        console.warn('[storage] sérialisation impossible :', err)
        return ''
    }
}
