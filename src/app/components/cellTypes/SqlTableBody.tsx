import {useCallback, useEffect, useRef, useState} from 'react'
import {useShallow} from 'zustand/react/shallow'
import {useNotebookStore} from '../../store/notebookStore'
import {ConfigManager} from '../../../lib/ConfigManager'
import {dropSqlblockSchema, openSqlblockSession} from '../sqlblock/SqlBlockEditor'
import {SqlEditorWidget} from '../SqlEditorWidget'
import {SqlDataTable} from '../SqlDataTable'
import {Icon} from '../../../lib/icons'
import {SqlBlockEditor} from '../sqlblock/SqlBlockEditor'
import {ResultInfo, TableSkeleton, EChartRenderer} from './shared'
import type {SqlTableBodyProps} from './types'

export const SqlTableBody: React.FC<SqlTableBodyProps> = ({ cell, path, cellIndex, showTextResult = false }) => {
    const {
        devMode, hasCellHeight,
        showSqlEditorVisible, isSqlResultTabular, isSqlResultText,
        getSqlResultAsText, runCellAt, refreshDuckdbTables,
    } = useNotebookStore(useShallow(s => ({
        devMode: s.devMode,
        hasCellHeight: s.hasCellHeight,
        showSqlEditorVisible: s.showSqlEditorVisible,
        isSqlResultTabular: s.isSqlResultTabular,
        isSqlResultText: s.isSqlResultText,
        getSqlResultAsText: s.getSqlResultAsText,
        runCellAt: s.runCellAt,
        refreshDuckdbTables: s.refreshDuckdbTables,
    })))

    // Lu directement depuis la cellule (pas via store) pour éviter les problèmes de ref stale.
    // undefined → true (rétrocompat : les anciennes cellules sans ce champ affichent leurs résultats)
    const showResult = devMode || (cell.queries?.[0]?.showQueryResult !== false)

    const [sqlBlockUiMode, setSqlBlockUiMode] = useState(false)
    const [vizConfigTrigger, setVizConfigTrigger] = useState(0)
    const sqlAtOpenRef = useRef<string>('')

    /** Ferme la modale : rafraîchit seulement si le SQL a changé, puis nettoie les subcells. */
    const handleCloseModal = useCallback(() => {
        const currentSql = ConfigManager.getCellQuery(cell, 'main') || ''
        const modified = currentSql !== sqlAtOpenRef.current
        setSqlBlockUiMode(false)
        if (modified) runCellAt(path, cellIndex)
        // Drop du schéma _sqlblock entier puis rafraîchit l'arborescence DuckDB
        dropSqlblockSchema().then(() => refreshDuckdbTables())
    }, [cell, path, cellIndex, runCellAt, refreshDuckdbTables])

    const hasHeight = hasCellHeight(cell)
    const isRunning = cell._status === 'running'
    const searchable = cell.type === 'table'
    const hasChart = !!(cell._echartsOption || cell._kpiHtml)

    const [vizMode, setVizMode] = useState<'table' | 'chart'>('table')

    // Synchronise vizMode : graphique dès qu'un chart est disponible, table sinon
    useEffect(() => {
        if (hasChart) setVizMode('chart')
        else setVizMode('table')
    }, [hasChart]) // eslint-disable-line react-hooks/exhaustive-deps

    // Mode UI visuel (sqlBlock) pour les cellules sql.
    // IMPORTANT: on utilise display:none au lieu de démontage conditionnel pour éviter
    // le bug React "removeChild not a child" (portals Radix déjà retirés du DOM avant cleanup).
    // L'overlay fixed plein-écran est toujours monté, juste caché quand inactif.
    const showSqlBlockEditor = devMode && cell.type === 'sql'
    const isKpi = !!cell._kpiHtml

    return (
        <div className={`group/sqlbody flex flex-col ${(hasHeight || isKpi) ? 'flex-1 min-h-0' : ''} ${isKpi ? 'justify-center' : ''}`}>
            {/* SqlBlockEditor — modale centrée, toujours montée, cachée via display:none */}
            {showSqlBlockEditor && (
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
                                onExitUiMode={handleCloseModal}
                                openVizConfigTrigger={vizConfigTrigger}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Contenu normal — caché quand en mode UI */}
            <div style={sqlBlockUiMode ? { display: 'none' } : undefined}
                className={hasHeight ? 'flex-1 min-h-0 flex flex-col' : ''}>
            {showSqlEditorVisible?.(cell) && (
                <SqlEditorWidget cell={cell} path={path} cellIndex={cellIndex}
                    placeholder="SELECT * FROM source1 LIMIT 100"
                    onEnterUiMode={cell.type === 'sql' ? () => {
                        sqlAtOpenRef.current = ConfigManager.getCellQuery(cell, 'main') || ''
                        openSqlblockSession()
                        setSqlBlockUiMode(true)
                        runCellAt(path, cellIndex)
                    } : null}
                />
            )}
            {showResult && (<>
            {/* Toggle Tableau/Graphique + bouton config visualisation — visible au hover */}
            {cell.type === 'sql' && (cell._echartsOption || cell._kpiHtml) && (
                <div className="opacity-0 group-hover/sqlbody:opacity-100 transition-opacity flex items-center gap-2 mb-1 shrink-0">
                    {cell._echartsOption && (
                        <div className="flex rounded border border-border overflow-hidden text-xs">
                            <button onClick={() => setVizMode('chart')}
                                className={`px-2 py-0.5 transition-colors ${vizMode === 'chart' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}>
                                Graphique
                            </button>
                            <button onClick={() => setVizMode('table')}
                                className={`px-2 py-0.5 transition-colors ${vizMode === 'table' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}>
                                Tableau
                            </button>
                        </div>
                    )}
                    {devMode && (
                        <button
                            onClick={() => {
                                sqlAtOpenRef.current = ConfigManager.getCellQuery(cell, 'main') || ''
                                openSqlblockSession()
                                setSqlBlockUiMode(true)
                                setVizConfigTrigger(v => v + 1)
                                runCellAt(path, cellIndex)
                            }}
                            className="inline-flex items-center justify-center h-5 w-5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors ml-auto"
                            title="Configurer la visualisation"
                        >
                            <Icon name="settings" size={13} />
                        </button>
                    )}
                </div>
            )}
            {/* Titre dynamique — centré, sous les boutons */}
            {cell._kpiLabel && (
                <div style={{fontSize:'clamp(1.1rem,3vw,1.5rem)'}} className="font-semibold text-foreground mb-0.5 shrink-0 text-center w-full">{cell._kpiLabel}</div>
            )}
            {/* Mode graphique */}
            {vizMode === 'chart' && hasChart && (
                <div className={`flex flex-col ${hasHeight ? 'flex-1 min-h-0' : ''}`}>
                    <EChartRenderer cell={cell} hasHeight={hasHeight} />
                </div>
            )}
            {/* Mode tableau */}
            {vizMode === 'table' && (showTextResult ? (
                <>
                    {isSqlResultTabular?.(cell) && (
                        <div className={`relative rounded-lg mt-2 ${hasHeight ? 'flex-1 min-h-0 overflow-auto' : ''}`}>
                            {isRunning
                                ? <div className="bg-background rounded-lg overflow-x-auto"><TableSkeleton /></div>
                                : <div className="bg-background rounded-lg overflow-x-auto"><SqlDataTable cell={cell} searchable={searchable} /></div>
                            }
                        </div>
                    )}
                    {isSqlResultText?.(cell) && (
                        <textarea className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono mt-2 min-h-[120px]" readOnly value={getSqlResultAsText?.(cell) || ''} />
                    )}
                </>
            ) : (
                <div className={hasHeight ? 'flex-1 min-h-0 overflow-auto' : ''}>
                    {isRunning
                        ? <div className="bg-background rounded-lg overflow-x-auto"><TableSkeleton /></div>
                        : <div className="bg-background rounded-lg overflow-x-auto"><SqlDataTable cell={cell} searchable={searchable} /></div>
                    }
                </div>
            ))}
            </>)}
            {/* Sous-titre — centré sous la visualisation */}
            {cell._sublabel && (
                <div style={{fontSize:'clamp(0.8rem,2vw,1rem)'}} className="text-muted-foreground text-center w-full mt-1 shrink-0">{cell._sublabel}</div>
            )}
            <ResultInfo cell={cell} devOnly />
            </div>
        </div>
    )
}

