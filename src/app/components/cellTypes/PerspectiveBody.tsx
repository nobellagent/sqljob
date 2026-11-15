import {useCallback, useEffect, useRef, useState} from 'react'
import {useShallow} from 'zustand/react/shallow'
import {useNotebookStore} from '../../store/notebookStore'
import {ConfigManager} from '../../../lib/ConfigManager'
import {dropSqlblockSchema, openSqlblockSession} from '../sqlblock/SqlBlockEditor'
import {SqlEditorWidget} from '../SqlEditorWidget'
import {SqlBlockEditor} from '../sqlblock/SqlBlockEditor'
import { ResultInfo } from './shared'
import type {CellBodyBaseProps} from './types'

export const PerspectiveBody: React.FC<CellBodyBaseProps> = ({ cell, path, cellIndex }) => {
    const { devMode, showSqlEditorVisible, hasCellHeight, renderPerspectiveInContainer, runCellAt, refreshDuckdbTables, _rev } = useNotebookStore(useShallow(s => ({
        devMode: s.devMode,
        showSqlEditorVisible: s.showSqlEditorVisible,
        hasCellHeight: s.hasCellHeight,
        renderPerspectiveInContainer: s.renderPerspectiveInContainer,
        runCellAt: s.runCellAt,
        refreshDuckdbTables: s.refreshDuckdbTables,
        _rev: s._rev
    })))

    const [sqlBlockUiMode, setSqlBlockUiMode] = useState(false)
    const sqlAtOpenRef = useRef<string>('')

    /** Ferme la modale : rafraîchit seulement si le SQL a changé, puis nettoie les subcells. */
    const handleCloseModal = useCallback(() => {
        const currentSql = ConfigManager.getCellQuery(cell, 'main') || ''
        const modified = currentSql !== sqlAtOpenRef.current
        setSqlBlockUiMode(false)
        if (modified) runCellAt(path, cellIndex)
        dropSqlblockSchema().then(() => refreshDuckdbTables())
    }, [cell, path, cellIndex, runCellAt, refreshDuckdbTables])

    // Equivalent Alpine x-init: déclencher le rendu quand le viewer est monté et données prêtes
    // (cas rechargement de page où _arrowTable existe déjà, _perspectiveScheduled = false)
    useEffect(() => {
        if (!cell._perspectiveReady) return
        const viewer = document.getElementById('perspective-' + cell._id)
        if (!viewer) return
        if (cell._arrowTable && !cell._perspectiveScheduled && !cell._perspectiveRendering && !cell._perspectiveTable) {
            renderPerspectiveInContainer(cell).catch((e: any) => {
                cell._perspectiveReady = false
                cell._resultInfo = '❌ ' + e.message
            })
        }
    }, [_rev])

    const mh = '400px'
    const hasHeight = hasCellHeight?.(cell)

    return (
        <div className={hasHeight ? 'flex-1 min-h-0 flex flex-col' : 'flex flex-col gap-2'}>
            {/* SqlBlockEditor — modale centrée, toujours montée, cachée via display:none */}
            {devMode && (
                <div
                    style={sqlBlockUiMode ? undefined : { display: 'none' }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
                    onClick={e => { if (e.target === e.currentTarget) handleCloseModal() }}
                >
                    <div className="bg-background border border-border rounded-xl shadow-2xl flex flex-col w-full max-w-[95vw] max-h-[90dvh] overflow-hidden">
                        {/* Bouton fermer (×) */}
                        <div className="flex items-center justify-end px-3 pt-2 pb-0 shrink-0">
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                title="Fermer"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                        </div>
                        <div className="overflow-y-auto flex-1 min-h-0 px-4 pb-4">
                            <SqlBlockEditor
                                cell={cell}
                                path={path}
                                cellIndex={cellIndex}
                                fromSqlCell={true}
                                skipExecution={true}
                                modalOpen={sqlBlockUiMode}
                                allowedMaterializeModes={['ephemeral']}
                                onExitUiMode={handleCloseModal}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Contenu normal — caché quand en mode UI */}
            <div style={sqlBlockUiMode ? { display: 'none' } : undefined}
                className={hasHeight ? 'flex-1 min-h-0 flex flex-col' : 'flex flex-col gap-2'}>
                {showSqlEditorVisible?.(cell) && (
                    <SqlEditorWidget cell={cell} path={path} cellIndex={cellIndex}
                        queryType="query"
                        onEnterUiMode={devMode ? () => {
                            sqlAtOpenRef.current = ConfigManager.getCellQuery(cell, 'main') || ''
                            openSqlblockSession()
                            setSqlBlockUiMode(true)
                            runCellAt(path, cellIndex)
                        } : null} />
                )}
                {cell._status === 'running' && !cell._perspectiveReady && (
                    <div className={hasHeight ? 'flex-1 min-h-0 rounded-lg bg-background overflow-hidden' : 'rounded-lg bg-background overflow-hidden'}
                        style={hasHeight ? {} : { minHeight: mh }}>
                        <div className="animate-pulse h-full w-full bg-muted rounded-lg" style={{ minHeight: mh }}></div>
                    </div>
                )}
                {cell._perspectiveReady && (
                    <div className={hasHeight ? 'flex-1 min-h-0 flex flex-col perspective-fill-height' : ''}
                        style={hasHeight ? {} : { minHeight: mh }}>
                        <perspective-viewer
                            id={`perspective-${cell._id}`}
                            theme="Pro Light"
                            class={hasHeight ? 'flex-1 min-h-0 w-full rounded-lg' : 'w-full rounded-lg'}
                            style={hasHeight ? {} : { minHeight: mh }}
                        ></perspective-viewer>
                    </div>
                )}
                <ResultInfo cell={cell} devOnly />
            </div>
        </div>
    )
}

