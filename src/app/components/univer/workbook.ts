// Construction et lecture des classeurs Univer (hors composant Lit).

import { ConfigManager } from '../../../lib/ConfigManager'



export function _buildWorkbookFromRows(rows: any[], cellId: string, evalFormulas = false, cellTypes?: number[]): any {
    const sheetId = 'sheet-' + cellId
    const cellData: Record<number, Record<number, { v?: any; t?: number; f?: string }>> = {}
    if (!rows || rows.length === 0) {
        return { id: 'wb-' + cellId, name: 'Sheet', sheets: { [sheetId]: { id: sheetId, name: 'Feuille1', cellData } } }
    }
    const columns = Object.keys(rows[0])
    cellData[0] = {}
    columns.forEach((col, ci) => { cellData[0][ci] = { v: col, t: 1 } })
    rows.forEach((row, ri) => {
        cellData[ri + 1] = {}
        columns.forEach((col, ci) => {
            const val = row[col]
            const v = val === null || val === undefined ? '' : val
            if (evalFormulas && typeof v === 'string' && v.startsWith('=')) {
                cellData[ri + 1][ci] = { f: v }
            } else if (v === '') {
                cellData[ri + 1][ci] = { v }
            } else {
                const t = cellTypes?.[ci] ?? (typeof v === 'boolean' ? 4 : typeof v === 'number' ? 2 : 1)
                cellData[ri + 1][ci] = { v, t }
            }
        })
    })
    return {
        id: 'wb-' + cellId,
        name: 'Sheet',
        sheets: { [sheetId]: { id: sheetId, name: 'Feuille1', cellData } },
    }
}

// ─── Parseur tolérant pour la syntaxe des docs Univer ─────────────────────────
// Extrait les clés simples + reconnaît LocaleType.XX_XX.
// La clé `locales` est ignorée (gérée en interne via le champ `locale`).

const _LOCALE_TYPE_MAP: Record<string, string> = {
    EN_US: 'en-US', FR_FR: 'fr-FR', ZH_CN: 'zh-CN', ZH_TW: 'zh-TW',
    RU_RU: 'ru-RU', JA_JP: 'ja-JP', ES_ES: 'es-ES', CA_ES: 'ca-ES',
    SK_SK: 'sk-SK', FA_IR: 'fa-IR', VI_VN: 'vi-VN', KO_KR: 'ko-KR',
}

export function _parseUniverDocsSyntax(raw: string): Record<string, any> {
    const result: Record<string, any> = {}

    // locale: LocaleType.XX_XX
    const localeMatch = raw.match(/\blocale\s*:\s*LocaleType\.(\w+)/)
    if (localeMatch && _LOCALE_TYPE_MAP[localeMatch[1]]) {
        result.locale = _LOCALE_TYPE_MAP[localeMatch[1]]
    }

    // Clés simples : key: true|false|number|"string"|'string'
    // Exclut `locales` (objet complexe géré en interne)
    const simpleRe = /\b(\w+)\s*:\s*(true|false|-?\d+(?:\.\d+)?|"[^"]*"|'[^']*')/g
    let m: RegExpExecArray | null
    while ((m = simpleRe.exec(raw)) !== null) {
        const key = m[1]
        if (key === 'locale' && result.locale) continue
        if (key === 'locales') continue
        try { result[key] = JSON.parse(m[2].replace(/'/g, '"')) } catch (_) {}
    }

    return result
}

// ─── CSV helpers ───────────────────────────────────────────────────────────────

export function _escapeCSV(val: any): string {
    if (val === null || val === undefined) return ''
    const s = String(val)
    if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
        return '"' + s.replace(/"/g, '""') + '"'
    }
    return s
}

type _ColKind = 'DATE' | 'TIMESTAMP' | 'DOUBLE' | 'BOOLEAN' | 'VARCHAR'

export function _excelSerialToISO(serial: number, kind: 'DATE' | 'TIMESTAMP'): string {
    const date = new Date((serial - 25569) * 86_400_000)
    const y = date.getUTCFullYear()
    const m = String(date.getUTCMonth() + 1).padStart(2, '0')
    const d = String(date.getUTCDate()).padStart(2, '0')
    if (kind === 'DATE') return `${y}-${m}-${d}`
    const hh = String(date.getUTCHours()).padStart(2, '0')
    const mm = String(date.getUTCMinutes()).padStart(2, '0')
    const ss = String(date.getUTCSeconds()).padStart(2, '0')
    return `${y}-${m}-${d} ${hh}:${mm}:${ss}`
}

export function _detectColKind(
    snapshot: any,
    cellData: Record<number, Record<number, any>>,
    ci: number,
    maxRow: number,
): _ColKind {
    for (let r = 1; r <= maxRow; r++) {
        const cell = cellData[r]?.[ci]
        if (cell == null) continue
        const t = cell.t ?? 1
        if (t === 4) return 'BOOLEAN'
        if (t === 1 || t === 3) return 'VARCHAR'
        if (t === 2) {
            const pattern: string | undefined = snapshot.styles?.[cell.s]?.n?.pattern
            if (pattern) {
                const hasDate = /[yYdD]/.test(pattern)
                const hasTime = /[Hh]:[mM]/.test(pattern)
                if (hasDate && hasTime) return 'TIMESTAMP'
                if (hasDate) return 'DATE'
            }
            return 'DOUBLE'
        }
        break
    }
    return 'VARCHAR'
}

export function _extractSheetData(univerAPI: any): { csv: string; columnTypes: Record<string, string> } | null {
    try {
        const fWorkbook = univerAPI.getActiveWorkbook()
        if (!fWorkbook) return null
        const snapshot = fWorkbook.save()
        const sheetId = snapshot.sheetOrder?.[0] ?? Object.keys(snapshot.sheets ?? {})[0]
        const sheet = snapshot.sheets?.[sheetId]
        if (!sheet?.cellData) return null
        const cellData: Record<number, Record<number, any>> = sheet.cellData
        const rowKeys = Object.keys(cellData).map(Number)
        if (rowKeys.length === 0) return null
        const maxRow = Math.max(...rowKeys)
        const allColKeys = rowKeys.flatMap(r => Object.keys(cellData[r] ?? {}).map(Number))
        const maxCol = allColKeys.length > 0 ? Math.max(...allColKeys) : 0

        const headerRow = cellData[0] ?? {}
        const colKinds: _ColKind[] = []
        const columnTypes: Record<string, string> = {}
        for (let c = 0; c <= maxCol; c++) {
            const kind = _detectColKind(snapshot, cellData, c, maxRow)
            colKinds[c] = kind
            const header = String(headerRow[c]?.v ?? `col${c}`)
            columnTypes[header] = kind
        }

        const csvRows: string[] = []
        for (let r = 0; r <= maxRow; r++) {
            const cols: string[] = []
            for (let c = 0; c <= maxCol; c++) {
                const val = cellData[r]?.[c]?.v
                if (r === 0) { cols.push(_escapeCSV(val)); continue }
                if (val === null || val === undefined) { cols.push(''); continue }
                const kind = colKinds[c]
                if ((kind === 'DATE' || kind === 'TIMESTAMP') && typeof val === 'number') {
                    cols.push(_excelSerialToISO(val, kind))
                } else if (kind === 'BOOLEAN') {
                    cols.push(val ? 'true' : 'false')
                } else {
                    cols.push(_escapeCSV(val))
                }
            }
            csvRows.push(cols.join(','))
        }
        return { csv: csvRows.join('\n'), columnTypes }
    } catch {
        return null
    }
}

// ─── Web Component ─────────────────────────────────────────────────────────────

export interface UniverInitParams {
    rows: any[] | null
    rowCellTypes?: number[] | null          // CellValueType par colonne issu d'Arrow (1=STRING, 2=NUMBER, 4=BOOLEAN)
    rowColumnFormats?: (string | null)[] | null  // numFmt par colonne (ex. 'yyyy-mm-dd') — appliqué via columnData
    snapshot: string | null
    cellId: string
    name?: string
    readonly: boolean
    config?: any   // Objet ou string JSON → options UniverSheetsCorePreset
    onModified?: () => void
    onMaterialize?: (csv: string, columnTypes: Record<string, string>) => Promise<void>
}

/** Construit le classeur Univer à partir des paramètres de la cellule. */
export async function buildWorkbookData(params: UniverInitParams, rawWorkbookJson: any): Promise<any> {
    const {evalFormulas, showGridlines, showRowHeader, showColumnHeader} = params as any
            let workbookData: any
            if (params.snapshot) {
                try {
                    const json = await ConfigManager.decompressFromGzipBase64(params.snapshot)
                    workbookData = JSON.parse(json)
                } catch (e: any) {
                    throw new Error('Snapshot Univer invalide : ' + e.message)
                }
            } else if (rawWorkbookJson && params.rows?.length) {
                // La première cellule du résultat SQL contient un objet { cellData, styles? }
                // styles est une table de styles IWorkbookData.styles (clé → IStyleData)
                const firstRow = params.rows[0]
                const raw = firstRow[Object.keys(firstRow)[0]]
                let parsed: any
                try {
                    parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
                    if (!parsed || typeof parsed !== 'object') throw new Error('valeur non-objet')
                } catch (e: any) {
                    throw new Error('rawWorkbookJson: JSON invalide — ' + e.message)
                }
                const cellData = parsed.cellData ?? parsed
                const styles = parsed.styles ?? {}
                const sheetId = 'sheet-' + params.cellId
                workbookData = {
                    id: 'wb-' + params.cellId,
                    name: 'Sheet',
                    sheetOrder: [sheetId],
                    styles,
                    sheets: {
                        [sheetId]: { id: sheetId, name: 'Feuille1', cellData },
                    },
                }
            } else if (params.rows?.length) {
                workbookData = _buildWorkbookFromRows(params.rows, params.cellId, !!evalFormulas, params.rowCellTypes ?? undefined)
            } else {
                workbookData = { id: 'wb-' + params.cellId, name: 'Sheet', sheets: {} }
            }

            // Appliquer les paramètres d'affichage (quadrillage, en-têtes de lignes/colonnes)
            if (showGridlines === false || showRowHeader === false || showColumnHeader === false) {
                const sheets = workbookData.sheets || {}
                for (const sheetId of Object.keys(sheets)) {
                    const sheet = sheets[sheetId]
                    if (showGridlines === false) sheet.showGridlines = 0
                    if (showRowHeader === false) sheet.rowHeader = { ...(sheet.rowHeader || {}), hidden: 1 }
                    if (showColumnHeader === false) sheet.columnHeader = { ...(sheet.columnHeader || {}), hidden: 1 }
                }
            }
    return workbookData
}
