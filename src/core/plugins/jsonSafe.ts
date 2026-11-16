/**
 * Préparation des données envoyées à une iframe.
 *
 * Les résultats DuckDB contiennent des `BigInt` (colonnes BIGINT) que
 * `JSON.stringify` refuse : sans conversion, le rendu d'une cellule de plugin
 * casse dès qu'une requête renvoie une colonne entière. On convertit aussi les
 * dates et on coupe les cycles.
 */
export function toJsonSafe(value: unknown, seen: WeakSet<object> = new WeakSet()): unknown {
    if (typeof value === 'bigint') {
        const asNumber = Number(value)
        return Number.isSafeInteger(asNumber) ? asNumber : value.toString()
    }
    if (typeof value === 'function' || typeof value === 'symbol') return undefined
    if (value === null || typeof value !== 'object') return value

    if (value instanceof Date) return value.toISOString()
    if (seen.has(value)) return undefined
    seen.add(value)

    if (Array.isArray(value)) {
        return value.map(item => {
            const clean = toJsonSafe(item, seen)
            return clean === undefined ? null : clean
        })
    }

    const out: Record<string, unknown> = {}
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
        const clean = toJsonSafe(item, seen)
        if (clean !== undefined) out[key] = clean
    }
    return out
}
