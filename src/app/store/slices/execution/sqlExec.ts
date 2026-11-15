import { rawTableDataStore as _rawTableDataStore } from '../../../../lib/tableDataStore'
import {cloneCellForExecution, commitCellInState} from '../../mutations'
import {DuckDBManager} from '../../../../lib/DuckDBManager'
import {ConfigManager} from '../../../../lib/ConfigManager'
import {CDNManager} from '../../../../lib/CDNManager'
import {CELL_TYPE_SCHEMAS} from '../../../../lib/cellTypeSchemas'
import {EChartSqlParser} from '../../../../lib/EChartSqlParser'
import {sqlIsDdl, extractLabelStatement, executeLabelStatement} from './helpers'
import type {StoreApi} from 'zustand'
import type {NotebookStoreState} from '../../types'

export function createSqlExec(
    set: StoreApi<NotebookStoreState>['setState'],
    get: StoreApi<NotebookStoreState>['getState'],
) {
    return {
    async runCellAt(pathOrIndex, cellIndex) {
        const path = Array.isArray(pathOrIndex) ? pathOrIndex : [pathOrIndex]
        const cell = cloneCellForExecution(get().getCellAtPath(path, cellIndex))
        if (!cell?._id) return

        cell._status = 'running'
        set({ isLoading: true })
        get().setStatus(`Exécution de ${cell.name || cell.type}...`, 'loading')
        set((state: any) => commitCellInState(state, cell) as any)

        try {
            const schema = CELL_TYPE_SCHEMAS?.types[cell?.type]
            const handler = schema?.executeHandler
            if (handler && typeof (get() as any)[handler] === 'function') {
                await (get() as any)[handler](cell, path, cellIndex)
            }

            cell._status = 'success'
            get().setStatus(`${cell.name || cell.type} exécuté`, 'success')
        } catch (error) {
            cell._status = 'error'
            cell._resultInfo = 'Erreur: ' + error.message
            get().setStatus('Erreur: ' + error.message, 'error')
        } finally {
            set({ isLoading: false })
            set((state: any) => commitCellInState(state, cell) as any)
        }
    },

    async executeSqlRecursiveParseCell(cell) {
        // Si queries[0].sql est vide mais qu'un AST est disponible, reconstituer le SQL
        const q0 = cell.queries?.[0]

        if (q0?.ast && !q0.sql?.trim()) {
            const { astToSql } = await import('../../../../lib/SqlBlockService')
            const selectSql = q0.degraded && q0.manualSql ? q0.manualSql : astToSql(q0.ast)
            q0.sql = selectSql  // SELECT pur — le DDL est assemblé ci-dessous
        }

        if (!ConfigManager.getCellQuery(cell, 0)?.trim()) {
            console.warn('❌ cell.query est vide ou undefined!')
            return
        }

        try {
            const finalQuery = get().parseQueryWithParameters(ConfigManager.getCellQuery(cell, 0) || '', { _name: cell.name || '' })

            get().setStatus('Exécution de la requête...', 'loading')

            const copyRegex = /COPY\s+[\s\S]+\bTO\s+'([^']+)'/i
            const copyMatch = finalQuery.match(copyRegex)

            if (copyMatch) {
                get().setStatus('Export du fichier...', 'loading')

                const fileName = copyMatch[1]

                try {
                    await DuckDBManager.executeQuery(finalQuery)

                    const fileExt = fileName.toLowerCase().split('.').pop()
                    const isBinaryFormat = ['xlsx', 'xls', 'parquet', 'pq', 'arrow', 'ipc', 'avro'].includes(fileExt)

                    const maxRetries = isBinaryFormat ? 15 : 10
                    const delayMs = isBinaryFormat ? 300 : 200

                    const buffer = await DuckDBManager.waitForFile(fileName, maxRetries, delayMs)

                    const bufLen = buffer?.byteLength ?? 0
                    if (bufLen > 0) {
                        const view = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : new Uint8Array(buffer.buffer || buffer)
                        if (fileExt === 'xlsx' && (view[0] !== 0x50 || view[1] !== 0x4B)) {
                            console.warn(`⚠️ [EXPORT] XLSX invalide: doit commencer par PK (0x50 0x4B), trouvé: 0x${view[0]?.toString(16)} 0x${view[1]?.toString(16)}`)
                        }
                    }

                    let mime = 'text/csv;charset=utf-8;'

                    switch (fileExt) {
                        case 'parquet':
                        case 'pq':
                            mime = 'application/octet-stream'
                            break
                        case 'xlsx':
                            mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                            break
                        case 'xls':
                            mime = 'application/vnd.ms-excel'
                            break
                        case 'json':
                        case 'jsonl':
                        case 'ndjson':
                            mime = 'application/json;charset=utf-8;'
                            break
                        case 'txt':
                            mime = 'text/plain;charset=utf-8;'
                            break
                        case 'tsv':
                            mime = 'text/tab-separated-values;charset=utf-8;'
                            break
                        case 'csv':
                            mime = 'text/csv;charset=utf-8;'
                            break
                        case 'xml':
                            mime = 'application/xml;charset=utf-8;'
                            break
                        case 'bin':
                        case 'dat':
                        case 'blob':
                            mime = 'application/octet-stream'
                            break
                        case 'arrow':
                        case 'ipc':
                            mime = 'application/vnd.apache.arrow.stream'
                            break
                        case 'avro':
                            mime = 'application/avro'
                            break
                        case 'gz':
                        case 'gzip':
                            mime = 'application/gzip'
                            break
                        case 'zip':
                            mime = 'application/zip'
                            break
                        case 'zst':
                        case 'zstd':
                            mime = 'application/zstd'
                            break
                        default:
                            mime = 'application/octet-stream'
                            break
                    }

                    let view = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : new Uint8Array(buffer.buffer ?? buffer, buffer.byteOffset ?? 0, buffer.byteLength)
                    if (fileExt === 'xlsx' && view.length >= 3 && view[0] !== 0x50 && view[1] === 0x50 && view[2] === 0x4B) {
                        view = view.slice(1)
                    }
                    const dataForBlob = view.slice(0)
                    const blob = new Blob([dataForBlob], { type: mime })
                    const downloadFileName = fileName.split('/').pop()
                    get().downloadOrZipFile(downloadFileName, blob, mime)

                    cell._results = []
                    cell._resultInfo = `✅ Fichier exporté: ${fileName} (${buffer.byteLength} octets)`
                } catch (copyError) {
                    console.error('❌ Erreur lors de la récupération du fichier exporté:', copyError)

                    get().setStatus('Récupération alternative des résultats...', 'loading')

                    const copyContentMatch = finalQuery.match(/COPY\s+\(([\s\S]+)\)\s+TO\s+/i)

                    if (copyContentMatch) {
                        const selectQuery = copyContentMatch[1]
                        const results = await DuckDBManager.executeQuery(selectQuery)

                        if (results.length > 0) {
                            const headers = Object.keys(results[0])
                            const tsvContent = [
                                headers.join('\t'),
                                ...results.map(row => headers.map(h => row[h] ?? '').join('\t'))
                            ].join('\n')

                            const blob = new Blob([tsvContent], { type: 'text/plain;charset=utf-8;' })
                            const downloadFileName = fileName.split('/').pop()
                            get().downloadOrZipFile(downloadFileName, blob, 'text/plain;charset=utf-8;')

                            cell._results = []
                            cell._resultInfo = `✅ Fichier exporté (mode alternatif): ${fileName} - ${results.length} ligne(s)`
                        } else {
                            throw new Error('Aucun résultat à exporter')
                        }
                    } else {
                        throw copyError
                    }
                } finally {
                    await DuckDBManager.dropFile(fileName)
                }
            } else {
                const materialize = cell.materialized ?? 'ephemeral'

                if (materialize !== 'ephemeral' && cell.name?.trim()) {
                    const { quoteId, stripMaterializePrefix } = await import('../../../../lib/SqlBlockService')
                    const qid = quoteId(cell.name)
                    // stripMaterializePrefix extrait le SELECT pur si finalQuery contient un wrapper
                    // CREATE OR REPLACE VIEW/TABLE (généré par buildDisplaySql ou ancien format avec DROP).
                    const selectOnly = stripMaterializePrefix(finalQuery)
                    if (!sqlIsDdl(selectOnly)) {
                        // SELECT pur : DROP de l'opposé (silencieux, DuckDB rejette IF EXISTS sur mauvais type)
                        // puis CREATE OR REPLACE VIEW/TABLE
                        const oppositeType = materialize === 'view' ? 'TABLE' : 'VIEW'
                        try { await DuckDBManager.executeQuery(`DROP ${oppositeType} IF EXISTS ${qid}`) } catch (_) {}
                        await DuckDBManager.executeQuery(`CREATE OR REPLACE ${materialize.toUpperCase()} ${qid} AS (\n${selectOnly}\n)`)
                        const { rows: results, schemaTypes } = await DuckDBManager.executeQueryWithSchema(
                            `SELECT * FROM ${qid} LIMIT 1000`
                        )
                        cell._results = results
                        cell._schemaTypes = schemaTypes || {}
                        cell._resultInfo = `${results.length} ligne(s)${results.length === 1000 ? ' (limité à 1 000)' : ''} — ${materialize === 'table' ? 'TABLE' : 'VIEW'} "${cell.name}" créée`
                        await get().refreshDuckdbSchema?.()
                    } else {
                        // DDL pur (DROP, INSERT…) : exécuter tel quel sans wrapper VIEW/TABLE
                        cell._echartsOption = null
                        cell._kpiHtml = null
                        const { rows: finalResults, schemaTypes } = await DuckDBManager.executeQueryWithSchema(finalQuery)
                        cell._results = finalResults
                        cell._schemaTypes = schemaTypes || {}
                        cell._resultInfo = `✅ ${finalResults.length} ligne(s)`
                    }
                } else {
                    const chartConfig = q0?.ast?.chartConfig
                    if (chartConfig?.columns?.length) {
                        // Mode graphique AST : initChartTypes + strip des annotations + EChartSqlParser
                        // Extrait SELECT ...::LABEL; et ::SUBLABEL; et ::ICON; initiaux si présents
                        const { labelSql, sublabelSql, iconSql, sql: mainSql } = extractLabelStatement(finalQuery)
                        const stmtLabel = labelSql ? await executeLabelStatement(labelSql) : null
                        const stmtSublabel = sublabelSql ? await executeLabelStatement(sublabelSql) : null
                        const stmtIcon = iconSql ? await executeLabelStatement(iconSql) : null
                        const kpiLabel = stmtLabel ?? chartConfig.label ?? null
                        const kpiSublabel = stmtSublabel ?? (chartConfig as any).sublabel ?? null
                        const kpiIcon = stmtIcon ?? (chartConfig as any).icon ?? null
                        get().setStatus('Chargement ECharts...', 'loading')
                        await CDNManager.loadECharts()
                        await DuckDBManager.initChartTypes()
                        get().setStatus('Exécution de la requête...', 'loading')
                        const { rows, columnTypes, schemaTypes } = await DuckDBManager.executeQueryWithSchema(mainSql)
                        const maxRows = cell.maxRows || 100000
                        const rawResults = rows.slice(0, maxRows)
                        _rawTableDataStore.set(cell._id, rawResults)
                        cell._results = rawResults
                        cell._schemaTypes = schemaTypes || {}
                        cell._columnTypes = columnTypes
                        cell._resultInfo = `✅ ${rows.length} ligne(s)`
                        const parsed = EChartSqlParser.parseColumnRoles(rows, columnTypes)
                        cell._kpiLabel = kpiLabel
                        cell._sublabel = kpiSublabel
                        cell._kpiIcon = kpiIcon
                        if (parsed.chartType === 'kpi') {
                            cell._kpiHtml = EChartSqlParser.buildKpiHtml(rows, parsed, kpiLabel ?? undefined, kpiIcon ?? undefined)
                            cell._echartsOption = null
                        } else {
                            cell._echartsOption = EChartSqlParser.buildEChartsOption(rows, parsed) ?? null
                            cell._kpiHtml = null
                        }
                    } else {
                        // Pas de ast.chartConfig : exécuter et détecter automatiquement les rôles ::ROLE
                        // Extrait SELECT ...::LABEL; et ::SUBLABEL; et ::ICON; si présents en tête du SQL
                        const { labelSql, sublabelSql, iconSql, sql: mainSql } = extractLabelStatement(finalQuery)
                        const stmtLabel = labelSql ? await executeLabelStatement(labelSql) : null
                        const stmtSublabel = sublabelSql ? await executeLabelStatement(sublabelSql) : null
                        const stmtIcon = iconSql ? await executeLabelStatement(iconSql) : null
                        const { rows: finalResults, columnTypes, schemaTypes } = await DuckDBManager.executeQueryWithSchema(mainSql)
                        const maxRows = cell.maxRows || 100000
                        cell._schemaTypes = schemaTypes || {}
                        cell._columnTypes = columnTypes

                        const parsed = EChartSqlParser.parseColumnRoles(finalResults, columnTypes)

                        cell._kpiLabel = stmtLabel
                        cell._sublabel = stmtSublabel
                        cell._kpiIcon = stmtIcon
                        if (parsed.chartType !== 'unknown') {
                            // Rôles chart détectés dans le SQL → rendu EChart
                            get().setStatus('Chargement ECharts...', 'loading')
                            await CDNManager.loadECharts()
                            await DuckDBManager.initChartTypes()
                            const rawResults = finalResults.slice(0, maxRows)
                            _rawTableDataStore.set(cell._id, rawResults)
                            cell._results = rawResults
                            cell._resultInfo = `✅ ${finalResults.length} ligne(s)`
                            if (parsed.chartType === 'kpi') {
                                cell._kpiHtml = EChartSqlParser.buildKpiHtml(finalResults, parsed, stmtLabel ?? undefined, stmtIcon ?? undefined)
                                cell._echartsOption = null
                            } else {
                                cell._echartsOption = EChartSqlParser.buildEChartsOption(finalResults, parsed) ?? null
                                cell._kpiHtml = null
                            }
                        } else {
                            cell._echartsOption = null
                            cell._kpiHtml = null
                            cell._results = finalResults
                            cell._resultInfo = `✅ ${finalResults.length} ligne(s)`
                            if (get().isSqlResultTabular(cell)) {
                                const truncated = finalResults.length > maxRows
                                const rawResults = finalResults.slice(0, maxRows)
                                _rawTableDataStore.set(cell._id, rawResults)
                                cell._results = rawResults
                                if (truncated) cell._resultInfo = `✅ ${finalResults.length} ligne(s) (limité à ${maxRows})`
                            }
                        }
                    }
                }
            }

            get().setStatus('SQL Recursive Parse exécuté', 'success')
            if (sqlIsDdl(finalQuery)) await get().refreshDuckdbSchema?.()
        } catch (error) {
            throw error
        }
    },

    showSqlEditorVisible(cell) {
        return get().devMode || ConfigManager.getCellQueryShowQueryEditor(cell, 0)
    },

    showQueryResult(cell) {
        return get().devMode || ConfigManager.getCellQueryShowResult(cell, 0)
    },

    isSqlResultTabular(cell) {
        const r = cell?._results
        if (!r || !Array.isArray(r) || r.length === 0) return false
        const row = r[0]
        const keys = Object.keys(row)
        if (keys.length > 1) return true
        if (r.length > 1) return true
        const val = row[keys[0]]
        return typeof val !== 'string'
    },

    isSqlResultText(cell) {
        const r = cell?._results
        if (!r || !Array.isArray(r) || r.length !== 1) return false
        const keys = Object.keys(r[0])
        return keys.length === 1 && typeof r[0][keys[0]] === 'string'
    },

    getSqlResultAsText(cell) {
        if (!get().isSqlResultText(cell)) return ''
        const keys = Object.keys(cell._results[0])
        return cell._results[0][keys[0]] ?? ''
    },

    }
}
