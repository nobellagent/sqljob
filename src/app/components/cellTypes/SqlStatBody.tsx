import {useState} from 'react'
import {useShallow} from 'zustand/react/shallow'
import {useNotebookStore} from '../../store/notebookStore'
import {SqlEditorWidget} from '../SqlEditorWidget'
import {SqlBlockEditor} from '../sqlblock/SqlBlockEditor'
import {ResultInfo} from './shared'
import type {CellBodyBaseProps} from './types'

export const SqlStatBody: React.FC<CellBodyBaseProps> = ({ cell, path, cellIndex }) => {
    const { devMode, showSqlEditorVisible } = useNotebookStore(useShallow(s => ({
        devMode: s.devMode,
        showSqlEditorVisible: s.showSqlEditorVisible
    })))

    const [sqlBlockUiMode, setSqlBlockUiMode] = useState(false)

    return (
        <div>
            {/* SqlBlockEditor — toujours monté, caché via display:none (évite removeChild portal bug) */}
            {devMode && (
                <div style={sqlBlockUiMode ? undefined : { display: 'none' }}>
                    <SqlBlockEditor cell={cell} path={path} cellIndex={cellIndex}
                        fromSqlCell={true} onExitUiMode={() => setSqlBlockUiMode(false)} />
                </div>
            )}
            <div style={sqlBlockUiMode ? { display: 'none' } : undefined}>
                {showSqlEditorVisible?.(cell) && (
                    <SqlEditorWidget cell={cell} path={path} cellIndex={cellIndex}
                        placeholder="SELECT 42 AS value, 'Titre' AS title, 'info' AS type"
                        onEnterUiMode={devMode ? () => setSqlBlockUiMode(true) : null} />
                )}
                {cell._results && (
                    <div className="flex flex-col items-center py-1">
                        {cell.icon && (
                            <div className="text-muted-foreground">
                                <span className="iconify inline-block h-8 w-8" data-icon={cell.icon}></span>
                            </div>
                        )}
                        <div className="text-sm text-muted-foreground">{cell.title || 'Stat'}</div>
                        <div className="text-4xl font-bold">{cell._statValue || '-'}</div>
                        <div className="text-xs text-muted-foreground">{cell.subtitle || ''}</div>
                    </div>
                )}
                <ResultInfo cell={cell} devOnly />
            </div>
        </div>
    )
}

