import {commitCellInState} from '../../mutations'
import {DuckDBManager} from '../../../../lib/DuckDBManager'
import {ConfigManager} from '../../../../lib/ConfigManager'
import {CDNManager} from '../../../../lib/CDNManager'
import {_arrowTableToUniverRows} from './helpers'
import type {StoreApi} from 'zustand'
import type {NotebookStoreState} from '../../types'

export function createRichCells(
    set: StoreApi<NotebookStoreState>['setState'],
    get: StoreApi<NotebookStoreState>['getState'],
) {
    return {
    async executePerspectiveCell(cell) {
        if (!ConfigManager.getCellQuery(cell, 0)?.trim()) {
            throw new Error('Requête SQL manquante')
        }
        if (DuckDBManager.currentEngine === 'ducklings') {
            throw new Error('Les cellules Perspective nécessitent le moteur DuckDB WASM. Changez le moteur dans les paramètres.')
        }

        get().setStatus('Chargement de Perspective...', 'loading')
        await CDNManager.loadPerspective()

        get().setStatus('Parsing de la requête SQL...', 'loading')

        try {
            const finalQuery = get().parseQueryWithParameters(ConfigManager.getCellQuery(cell, 0) || '', { _name: cell.name || '' })
            cell._perspectiveQuery = finalQuery

            get().setStatus('Exécution de la requête...', 'loading')

            const arrowTable = await DuckDBManager.executeQueryArrow(finalQuery)

            cell._arrowTable = arrowTable
            cell._perspectiveScheduled = true
            cell._perspectiveReady = true
            set((state: any) => commitCellInState(state, cell) as any)

            try {
                await new Promise(r => setTimeout(r, 0))
                const _containerId = 'perspective-' + cell._id
                let _waited = 0
                while (!document.getElementById(_containerId) && _waited < 2000) {
                    await new Promise(r => setTimeout(r, 50))
                    _waited += 50
                }

                await get().renderPerspectiveInContainer(cell)
            } catch (renderError) {
                cell._perspectiveScheduled = false
                throw renderError
            }

            const rowCount = arrowTable.numRows
            cell._resultInfo = `✅ ${rowCount} ligne(s)`
            get().setStatus('Perspective chargé', 'success')
        } catch (error) {
            cell._perspectiveReady = false
            throw error
        }
    },

    async renderPerspectiveInContainer(cell: any) {
        const containerId = 'perspective-' + cell._id
        const viewer = document.getElementById(containerId) as any

        if (!viewer || !cell._arrowTable) {
            // Viewer absent du DOM (ex: showContent=false pendant l'exécution).
            // Réinitialise le flag pour que le useEffect du composant relance le rendu
            // une fois que le statut passe à 'success' et que le viewer est monté.
            cell._perspectiveScheduled = false
            return
        }

        if (cell._perspectiveRendering) {
            cell._perspectiveScheduled = false
            return
        }
        cell._perspectiveRendering = true
        cell._perspectiveScheduled = false

        try {
            if (DuckDBManager.getEngine() !== 'duckdb-wasm') {
                throw new Error('Perspective nécessite le moteur DuckDB WASM. Veuillez changer de moteur dans les paramètres.')
            }

            const conn = DuckDBManager.getConnection()
            const perspective = window.perspectiveClient

            let config = { theme: 'Pro Light' }
            const perspectiveConfig = cell.json?.perspectiveConfig
            if (perspectiveConfig != null && perspectiveConfig !== '') {
                try {
                    const userConfig = typeof perspectiveConfig === 'string'
                        ? JSON.parse(perspectiveConfig.trim())
                        : perspectiveConfig
                    config = { ...config, ...userConfig }
                } catch (e) {
                    console.warn('Configuration Perspective invalide, utilisation des valeurs par défaut:', e)
                }
            }

            const finalQuery = cell._perspectiveQuery || get().parseQueryWithParameters(ConfigManager.getCellQuery(cell, 0) || '', { _name: cell.name || '' })

            const arrowResult = await conn.query(finalQuery)
            const batches = []
            for await (const batch of arrowResult) {
                batches.push(batch)
            }

            if (!cell._perspectiveWorker) {
                cell._perspectiveWorker = await perspective.worker()
            }
            const table = await cell._perspectiveWorker.table(batches)

            await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))

            if (typeof viewer.resetThemes === 'function') {
                await viewer.resetThemes(['Pro Light', 'Pro Dark'])
            }
            await viewer.load(table)
            await viewer.restore(config)

            cell._perspectiveTable = table

        } catch (error) {
            console.error('Erreur lors du rendu Perspective:', error)
            throw error
        } finally {
            cell._perspectiveRendering = false
        }
    },

    // ─── Univer Sheet ─────────────────────────────────────────────────────────
    // L'initialisation DOM est déléguée à UniverSheetElement (LitElement).
    // Ce slice se charge uniquement de la collecte des données.

    async executeUniverSheetCell(cell) {
        // Réinitialiser
        cell._univerReady = false
        cell._univerRows = null
        cell._univerCellTypes = null
        cell._univerColumnFormats = null
        cell._univerSnapshotPending = null

        // ── Collecter les données ──────────────────────────────────────────────
        if (cell.snapshot?.trim()) {
            cell._univerSnapshotPending = cell.snapshot.trim()
        } else {
            const sql = ConfigManager.getCellQuery(cell, 0)?.trim()
            cell._univerSnapshotPending = null
            if (sql) {
                get().setStatus('Exécution de la requête SQL...', 'loading')
                const finalSql = get().parseQueryWithParameters(sql, { _name: cell.name || '' })
                try {
                    const arrowTable = await DuckDBManager.executeQueryArrow(finalSql)
                    const { rows, cellTypes, columnFormats } = _arrowTableToUniverRows(arrowTable)
                    cell._univerRows = rows
                    cell._univerCellTypes = cellTypes
                    cell._univerColumnFormats = columnFormats
                } catch (_) {
                    // Fallback ducklings ou erreur Arrow
                    const { rows } = await DuckDBManager.executeQueryWithSchema(finalSql)
                    cell._univerRows = rows
                }
            }
        }

        // Signaler que les données sont prêtes → UniverSheetBody appellera initialize()
        cell._univerRunId = (cell._univerRunId || 0) + 1
        cell._univerReady = true
        set((state: any) => commitCellInState(state, cell) as any)
        cell._resultInfo = cell._univerSnapshotPending ? '✅ Sheet prête (snapshot)' : '✅ Sheet prête'
        get().setStatus('Univer Sheet prête', 'success')
    },

    async captureUniverSnapshot(cell, univerAPI) {
        if (!univerAPI) return
        try {
            const workbook = univerAPI.getActiveWorkbook?.()
            if (!workbook) return
            const snapshot = workbook.save?.()
            if (!snapshot) return
            const json = JSON.stringify(snapshot)
            cell.snapshot = await ConfigManager.compressToGzipBase64(json)
            // Effacer la query SQL : le snapshot prend le dessus à l'import
            const q = ConfigManager.ensureCellQueries(cell, 'main')
            if (q) q.sql = ''
            cell._univerModified = false
            set((state: any) => commitCellInState(state, cell) as any)
        } catch (e) {
            console.error('[univerSheet] Erreur capture snapshot:', e)
            throw e
        }
    },

    async exportUniverToXlsx(univerAPI, cellName) {
        if (!univerAPI) throw new Error('Univer non initialisé')
        get().setStatus('Export XLSX...', 'loading')
        try {
            const workbook = univerAPI.getActiveWorkbook?.()
            if (!workbook) throw new Error('Classeur actif introuvable')
            const snapshot = workbook.save?.()
            if (!snapshot) throw new Error('Impossible de récupérer les données du classeur')

            // Import dynamique → chunk Vite séparé, chargé à la demande
            const { default: LuckyExcel } = await import('@mertdeveci55/univer-import-export')

            await new Promise<void>((resolve, reject) => {
                LuckyExcel.transformUniverToExcel({
                    snapshot,
                    fileName: `${cellName || 'sheet'}.xlsx`,
                    success: () => resolve(),
                    error: (err: any) => reject(new Error(err?.message || String(err))),
                })
            })

            get().setStatus('Export XLSX terminé', 'success')
        } catch (e) {
            console.error('[univerSheet] Erreur export XLSX:', e)
            throw e
        }
    },

    }
}
