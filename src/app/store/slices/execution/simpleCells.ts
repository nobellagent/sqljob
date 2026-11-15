import {commitCellInState} from '../../mutations'
import {safeEvalJs} from '../../../../lib/safeEval'
import {DuckDBManager} from '../../../../lib/DuckDBManager'
import {ConfigManager} from '../../../../lib/ConfigManager'
import {formatValueForInputType} from '../../../../lib/utils'
import type {StoreApi} from 'zustand'
import type {NotebookStoreState} from '../../types'

export function createSimpleCells(
    set: StoreApi<NotebookStoreState>['setState'],
    get: StoreApi<NotebookStoreState>['getState'],
) {
    return {
    async executeMarkdownCell(cell) {
        const languageType = ConfigManager.getCellEngine(cell, 'main')
        if (languageType === 'text') {
            cell._markdownContent = ConfigManager.getCellEditableContent(cell)
            return
        }
        const cellQuery = ConfigManager.getCellQuery(cell, 'main')
        if (!cellQuery?.trim()) return

        get().setStatus('Chargement Markdown...', 'loading')

        try {
            let mdContent
            if (languageType === 'js') {
                let jsCode = get().parseQueryWithParameters(cellQuery || '', { _name: cell.name || '' })
                try {
                    const result = safeEvalJs(jsCode)
                    mdContent = typeof result === 'string' ? result : String(result)
                } catch (jsError) {
                    throw new Error(`Erreur JS: ${jsError.message}`)
                }
            } else {
                const finalQuery = get().parseQueryWithParameters(cellQuery || '', { _name: cell.name || '' })
                get().setStatus('Exécution de la requête...', 'loading')
                const results = await DuckDBManager.executeQuery(finalQuery)
                mdContent = results.map(row => Object.values(row).join('')).join('\n')
            }
            cell._markdownContent = mdContent
            get().setStatus('Markdown chargé', 'success')
        } catch (error) {
            throw error
        }
    },

    async executeIframeCell(cell) {
        const cellQuery = ConfigManager.getCellQuery(cell, 0)
        if (!cellQuery?.trim()) return

        const languageType = ConfigManager.getCellEngine(cell, 0)
        get().setStatus('Chargement HTML...', 'loading')

        try {
            let htmlContent

            if (languageType === 'text') {
                htmlContent = (cellQuery || '').trim()
                cell._resultInfo = ''
            } else if (languageType === 'js') {
                let jsCode = get().parseQueryWithParameters(cellQuery || '', { _name: cell.name || '' })
                try {
                    const result = safeEvalJs(jsCode)
                    htmlContent = typeof result === 'string' ? result : String(result)
                } catch (jsError) {
                    throw new Error(`Erreur JS: ${jsError.message}`)
                }
                cell._resultInfo = '✅ HTML généré (JavaScript)'
            } else {
                const finalQuery = get().parseQueryWithParameters(ConfigManager.getCellQuery(cell, 0) || '', { _name: cell.name || '' })
                get().setStatus('Exécution de la requête...', 'loading')
                const results = await DuckDBManager.executeQuery(finalQuery)
                htmlContent = results.map(row => Object.values(row).join('')).join('\n')
                cell._resultInfo = '✅ HTML généré'
            }

            cell._htmlContent = htmlContent
            set((state: any) => commitCellInState(state, cell) as any)
            get().setStatus('HTML chargé', 'success')
        } catch (error) {
            throw error
        }
    },

    renderIframeInContainer(cell: any) {
        const iframe = document.getElementById('iframe-' + cell._id) as HTMLIFrameElement | null
        if (iframe && cell._htmlContent) {
            const doc = iframe.contentDocument || iframe.contentWindow!.document
            doc.open()
            doc.write(cell._htmlContent)
            doc.close()
        }
    },

    async executeSqlStatCell(cell) {
        if (!ConfigManager.getCellQuery(cell, 0)?.trim()) return

        get().setStatus('Exécution de la stat SQL...', 'loading')

        try {
            const finalQuery = get().parseQueryWithParameters(ConfigManager.getCellQuery(cell, 0) || '', { _name: cell.name || '' })

            get().setStatus('Exécution de la requête...', 'loading')
            const results = await DuckDBManager.executeQuery(finalQuery)

            if (!results || results.length === 0) {
                cell._results = []
                cell._statValue = '-'
                cell._resultInfo = 'Aucun résultat'
                return
            }

            const firstRow = results[0]
            const statValue = Object.values(firstRow)[0]

            cell._results = results
            cell._statValue = statValue !== null && statValue !== undefined ? String(statValue) : '-'
            cell._resultInfo = ''

            get().setStatus('Stat SQL exécutée', 'success')
        } catch (error) {
            throw error
        }
    },

    async executePivotCell(cell) {
        const selectedTable = cell.json?.selectedTable
        if (selectedTable) {
            const tables = get()._duckdbTables || {}
            if (tables[selectedTable]) {
                cell._resultInfo = `Table: ${selectedTable} — ${tables[selectedTable].columns?.length ?? 0} colonnes`
            } else {
                throw new Error(`Table "${selectedTable}" introuvable dans DuckDB`)
            }
        }
    },

    async executeUiParameterCell(cell) {
        cell._paramError = null

        if (cell.preserveUserValue && cell._userModified) {
            get().setStatus(`${ConfigManager.getCellReferenceName(cell)} : valeur utilisateur préservée`, 'success')
            return
        }

        try {
            const languageType = ConfigManager.getCellEngine(cell, 0)
            let results

            if (languageType === 'text') {
                get().setStatus(`${ConfigManager.getCellReferenceName(cell)} : texte utilisé tel quel`, 'success')
                const textValue = (ConfigManager.getCellQuery(cell, 0) || '').trim()
                if (cell.paramType === 'dropdown') {
                    const lines = textValue.split('\n').filter(Boolean)
                    results = lines.map(line => ({ col1: line, col2: line }))
                } else {
                    results = [{ value: textValue }]
                }
            } else if (languageType === 'js') {
                get().setStatus('Exécution du code JavaScript...', 'loading')

                let jsCode = ConfigManager.getCellQuery(cell, 0) || ''
                jsCode = get().parseQueryWithParameters(jsCode, { _name: cell.name || '' })

                try {
                    const jsResult = safeEvalJs(jsCode)

                    if (cell.paramType === 'dropdown') {
                        if (Array.isArray(jsResult)) {
                            results = jsResult.map(item => {
                                if (Array.isArray(item)) {
                                    return {
                                        col1: String(item[0] || ''),
                                        col2: item.length > 1 ? String(item[1]) : String(item[0] || '')
                                    }
                                } else {
                                    return { col1: String(item) }
                                }
                            })
                        } else {
                            throw new Error('Le code JS doit retourner un tableau pour un dropdown')
                        }
                    } else {
                        results = [{ value: jsResult }]
                    }
                } catch (jsError) {
                    throw new Error(`Erreur JS: ${jsError.message}`)
                }
            } else {
                const rawQuery = ConfigManager.getCellQuery(cell, 0) || ''
                const referencedParams = get().findReferencedParams(rawQuery)
                const allParams = get().getParameters()
                const DATE_CAST_RE = /::(DATE|TIMESTAMP|TIME)\b/i
                if (DATE_CAST_RE.test(rawQuery) && referencedParams.some(p => !allParams[p])) {
                    // Paramètre date référencé encore vide → skip silencieux
                    return
                }
                const finalQuery = get().parseQueryWithParameters(rawQuery, { _name: cell.name || '' })
                get().setStatus('Exécution de la requête...', 'loading')
                results = await DuckDBManager.executeQuery(finalQuery)
            }

            if (cell.paramType === 'dropdown') {
                if (results.length === 0) {
                    cell._options = []
                    cell._value = ''
                    cell._paramError = 'La requête n\'a retourné aucun résultat'
                    return
                }

                const columnKeys = Object.keys(results[0])
                const firstColumnKey = columnKeys[0]
                const secondColumnKey = columnKeys.length > 1 ? columnKeys[1] : null

                cell._options = results.map(row => {
                    const value = String(row[firstColumnKey])
                    const label = secondColumnKey ? String(row[secondColumnKey]) : value
                    return { value, label }
                })

                const currentValues = cell._options.map(opt => opt.value)
                if (!cell._value || !currentValues.includes(cell._value)) {
                    cell._value = cell._options[0]?.value || ''
                }

                cell._initialized = true
                get().setStatus(`Options ${ConfigManager.getCellReferenceName(cell)} chargées`, 'success')

            } else if (cell.paramType === 'input') {
                if (results.length > 0) {
                    const firstColumnKey = Object.keys(results[0])[0]
                    const rawValue = results[0][firstColumnKey]
                    cell._value = formatValueForInputType(rawValue, cell.inputType)
                }

                cell._initialized = true
                get().setStatus(`${ConfigManager.getCellReferenceName(cell)} initialisé`, 'success')

            } else if (cell.paramType === 'range') {
                if (results.length > 0) {
                    const firstColumnKey = Object.keys(results[0])[0]
                    const rawValue = results[0][firstColumnKey]
                    const numValue = Number(rawValue)
                    const min = cell.rangeMin ?? 0
                    const max = cell.rangeMax ?? 100
                    cell._value = Math.min(max, Math.max(min, isNaN(numValue) ? min : numValue))
                } else if (cell._value === '' || cell._value === undefined) {
                    cell._value = cell.rangeMin ?? 0
                }

                cell._initialized = true
                get().setStatus(`${ConfigManager.getCellReferenceName(cell)} initialisé`, 'success')
            }

            cell._userModified = false
        } catch (error) {
            console.error('[uiParameter]', ConfigManager.getCellReferenceName(cell), error.message)
            if (get().devMode) get().setStatus('Erreur: ' + error.message, 'error')
        }
    },

    }
}
