import {useCallback, useEffect, useRef, useState} from 'react'
import {useShallow} from 'zustand/react/shallow'
import {useNotebookStore} from '../../store/notebookStore'
import {SqlEditorWidget} from '../SqlEditorWidget'
import {Icon} from '../../../lib/icons'
import {DuckDBManager} from '../../../lib/DuckDBManager'
import { ResultInfo } from './shared'
import type {CellBodyBaseProps} from './types'

export const UniverSheetBody: React.FC<CellBodyBaseProps> = ({ cell, path, cellIndex }) => {
    const {
        devMode, showSqlEditorVisible, hasCellHeight,
        captureUniverSnapshot, exportUniverToXlsx, updateCellById,
    } = useNotebookStore(useShallow(s => ({
        devMode: s.devMode,
        showSqlEditorVisible: s.showSqlEditorVisible,
        hasCellHeight: s.hasCellHeight,
        captureUniverSnapshot: s.captureUniverSnapshot,
        exportUniverToXlsx: s.exportUniverToXlsx,
        updateCellById: s.updateCellById,
    })))

    const hasHeight = hasCellHeight(cell)
    const mh = '400px'
    const elementRef = useRef(null)
    const lastInitRunId = useRef(-1)

    // Quand les données sont prêtes (_univerReady=true), appeler initialize()
    // sur le web component Lit qui gère l'initialisation Univer en interne.
    // Guard sur _univerRunId : n'initialise qu'une fois par exécution.
    useEffect(() => {
        if (!cell._univerReady || !elementRef.current) return
        if (cell._univerRunId === lastInitRunId.current) return
        lastInitRunId.current = cell._univerRunId ?? 0
        const _univerCfg = cell.json?.univerConfig as { materializeAsDuckDB?: boolean } | undefined
        const _materialize = _univerCfg && typeof _univerCfg === 'object' ? !!_univerCfg.materializeAsDuckDB : false
        elementRef.current.initialize({
            rows: cell._univerRows ?? null,
            rowCellTypes: cell._univerCellTypes ?? null,
            rowColumnFormats: cell._univerColumnFormats ?? null,
            snapshot: cell._univerSnapshotPending ?? null,
            cellId: cell._id,
            name: cell.name || undefined,
            readonly: !devMode && cell.readOnly !== false,
            config: cell.json?.univerConfig ?? null,
            onModified: () => { cell._univerModified = true },
            onMaterialize: _materialize ? async (csv: string, columnTypes: Record<string, string>) => {
                const tableName = cell.name || ('univer_' + cell._id)
                const csvFileName = `_univer_${cell._id}.csv`
                try {
                    const csvBlob = new Blob([csv], { type: 'text/csv' })
                    await DuckDBManager.registerFile(csvFileName, csvBlob)
                    const entries = Object.entries(columnTypes)
                    const columnsClause = entries.length > 0
                        ? `, columns={${entries.map(([col, type]) => `'${col.replace(/'/g, "''")}': '${type}'`).join(', ')}}`
                        : ', AUTO_DETECT = true'
                    const sql = `CREATE OR REPLACE TABLE "${tableName.replace(/"/g, '""')}" AS SELECT * FROM read_csv('${csvFileName}', HEADER = true${columnsClause})`
                    await DuckDBManager.executeQuery(sql)
                    const store = useNotebookStore.getState()
                    await store.refreshDuckdbSchema?.()
                    if (store.directedAcyclicGraph && cell.name) {
                        await store._executeDAGRefresh?.(cell.name)
                    }
                } catch (e) { console.error('[UniverSheet] DuckDB materialize error:', e) }
            } : undefined,
        }).catch((e: any) => {
            updateCellById(cell._id, (c: any) => {
                c._univerReady = false
                c._resultInfo = '❌ ' + e.message
            })
        })
    }, [cell._univerReady, cell._univerRunId])

    const [saving, setSaving] = useState(false)
    const [exporting, setExporting] = useState(false)

    const handleSaveSnapshot = useCallback(async () => {
        if (saving) return
        setSaving(true)
        try { await captureUniverSnapshot(cell, elementRef.current?.getAPI()) } catch (e) { console.error(e) } finally { setSaving(false) }
    }, [cell, captureUniverSnapshot, saving])

    const handleExportXlsx = useCallback(async () => {
        if (exporting) return
        setExporting(true)
        try { await exportUniverToXlsx(elementRef.current?.getAPI(), cell.name) } catch (e) { console.error(e) } finally { setExporting(false) }
    }, [cell, exportUniverToXlsx, exporting])

    const univerActions = cell._univerReady ? (
        <>
            {devMode && (
                <button
                    className="p-1 text-muted-foreground cursor-pointer transition-colors hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleSaveSnapshot}
                    disabled={saving}
                    title={saving ? 'Enregistrement...' : 'Enregistrer snapshot'}
                >
                    <Icon name={saving ? 'autorenew' : 'save'} size={14} className={saving ? 'animate-spin' : ''} />
                </button>
            )}
            <button
                className="p-1 text-muted-foreground cursor-pointer transition-colors hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleExportXlsx}
                disabled={exporting}
                title={exporting ? 'Export...' : 'Exporter XLSX'}
            >
                <Icon name={exporting ? 'autorenew' : 'download'} size={14} className={exporting ? 'animate-spin' : ''} />
            </button>
        </>
    ) : null

    return (
        <div className="flex flex-col gap-2">
            {/* Éditeur SQL (avec boutons Univer dans la toolbar) */}
            {showSqlEditorVisible?.(cell) && (
                <SqlEditorWidget cell={cell} path={path} cellIndex={cellIndex} placeholder="SELECT * FROM source1" extraActions={univerActions} />
            )}

            {/* Toolbar standalone quand l'éditeur SQL n'est pas affiché */}
            {!showSqlEditorVisible?.(cell) && cell._univerReady && (
                <div className="flex justify-end gap-1 items-center">
                    {univerActions}
                </div>
            )}

            {/* Skeleton pendant le chargement initial */}
            {cell._status === 'running' && !cell._univerReady && (
                <div
                    className="animate-pulse bg-muted rounded-lg"
                    style={{ minHeight: hasHeight ? undefined : mh, flex: hasHeight ? 1 : undefined }}
                />
            )}

            {/* Web component Lit — initialisation Univer déléguée via ref.initialize() */}
            <univer-sheet
                ref={elementRef}
                class={`rounded-lg border overflow-hidden${hasHeight ? ' flex-1 min-h-0' : ''}`}
                style={{
                    minHeight: hasHeight ? undefined : mh,
                    display: cell._univerReady ? 'block' : 'none',
                }}
            />

            <ResultInfo cell={cell} />
        </div>
    )
}

