import {DuckDBManager} from '../../../../lib/DuckDBManager'

const DDL_RE = /^\s*(CREATE|DROP|ALTER|INSERT|UPDATE|DELETE|TRUNCATE|RENAME|COMMENT)\b/im
export function sqlIsDdl(sql: string): boolean {
    // Vérifier chaque statement séparé par ';'
    return sql.split(';').some(s => DDL_RE.test(s))
}

/**
 * Extrait les statements ::LABEL, ::SUBLABEL et ::ICON placés avant la requête principale.
 * Retourne leur SQL (pour exécution dynamique) et le SQL nettoyé.
 */
export function extractLabelStatement(sql: string): { labelSql: string | null; sublabelSql: string | null; iconSql: string | null; sql: string } {
    const stmts = sql.split(/;[ \t]*(?=\r?\n|$)/)
    let labelSql: string | null = null
    let sublabelSql: string | null = null
    let iconSql: string | null = null
    const mainStmts: string[] = []
    for (const stmt of stmts) {
        const trimmed = stmt.trim()
        if (!trimmed) continue
        // Config statement: SELECT contenant uniquement des rôles LABEL/SUBLABEL/ICON
        // Supporte le format combiné : SELECT 'a'::LABEL, 'b'::SUBLABEL, 'c'::ICON
        if (/^\s*SELECT\s+.+?::(?:LABEL|SUBLABEL|ICON)\b/i.test(trimmed)) {
            // Extrait chaque rôle depuis le statement (individuel ou combiné)
            if (labelSql === null && /::LABEL\b/i.test(trimmed)) {
                const m = trimmed.match(/'([^']*)'\s*::LABEL\b/i)
                if (m) labelSql = `SELECT '${m[1]}'::LABEL`
            }
            if (sublabelSql === null && /::SUBLABEL\b/i.test(trimmed)) {
                const m = trimmed.match(/'([^']*)'\s*::SUBLABEL\b/i)
                if (m) sublabelSql = `SELECT '${m[1]}'::SUBLABEL`
            }
            if (iconSql === null && /::ICON\b/i.test(trimmed)) {
                const m = trimmed.match(/'([^']*)'\s*::ICON\b/i)
                if (m) iconSql = `SELECT '${m[1]}'::ICON`
            }
        } else {
            mainStmts.push(trimmed)
        }
    }
    return { labelSql, sublabelSql, iconSql, sql: mainStmts.join(';\n') }
}

/** Exécute un statement LABEL et retourne le titre (valeur de la 1ère colonne, 1ère ligne). */
export async function executeLabelStatement(labelSql: string): Promise<string | null> {
    try {
        const { rows } = await DuckDBManager.executeQueryWithSchema(labelSql)
        if (!rows.length) return null
        const firstVal = Object.values(rows[0])[0]
        return firstVal !== null && firstVal !== undefined ? String(firstVal) : null
    } catch {
        return null
    }
}

// ─── Arrow → Univer rows converter ───────────────────────────────────────────
// CellValueType : STRING=1, NUMBER=2, BOOLEAN=4
export function _arrowTableToUniverRows(table: any): { rows: any[]; cellTypes: number[]; columnFormats: (string | null)[] } {
    const fields: any[] = table.schema.fields
    const cellTypes = fields.map((f: any) => {
        const t = String(f.type)
        if (t.startsWith('Bool')) return 4
        if (/^(Int|Uint|Float|Decimal|Date|Time|Timestamp|Duration)/.test(t)) return 2
        return 1
    })
    const columnFormats: (string | null)[] = fields.map((f: any) => {
        const t = String(f.type)
        if (/^Date/.test(t)) return 'yyyy-MM-dd'
        if (/^Timestamp/.test(t)) return 'yyyy-MM-dd HH:mm:ss'
        if (/^Time/.test(t)) return 'HH:mm:ss'
        return null
    })
    const isDate = fields.map((f: any) => /^Date/.test(String(f.type)))
    const isTimestamp = fields.map((f: any) => /^(Timestamp|Time)/.test(String(f.type)))

    const rows = table.toArray().map((row: any) => {
        const jsRow: Record<string, any> = Object.fromEntries(row)
        const result: Record<string, any> = {}
        fields.forEach((f: any, i: number) => {
            const val = jsRow[f.name]
            if (val === null || val === undefined) {
                result[f.name] = null
            } else if (val instanceof Date) {
                // Date object → serial Excel
                result[f.name] = Math.floor(val.getTime() / 86_400_000) + 25569
            } else if (typeof val === 'number' && isDate[i]) {
                // DuckDB WASM renvoie Date32 en ms depuis l'epoch (number, pas Date)
                result[f.name] = Math.floor(val / 86_400_000) + 25569
            } else if (typeof val === 'number' && isTimestamp[i]) {
                // Timestamp en ms → serial Excel fractionnaire
                result[f.name] = val / 86_400_000 + 25569
            } else if (typeof val === 'bigint') {
                if (isTimestamp[i]) {
                    // Timestamp en µs → serial Excel fractionnaire
                    result[f.name] = Number(val) / 86_400_000_000 + 25569
                } else {
                    result[f.name] = Number(val)
                }
            } else {
                result[f.name] = val
            }
        })
        return result
    })
    return { rows, cellTypes, columnFormats }
}

