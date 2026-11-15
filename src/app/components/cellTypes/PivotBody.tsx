import {useMemo} from 'react'
import {useShallow} from 'zustand/react/shallow'
import {useNotebookStore} from '../../store/notebookStore'
import {quoteParsedRawSqlTableReference} from '@sqlrooms/duckdb'
import {PivotEditor} from '@sqlrooms/pivot'
import {PivotConfig, PivotQuerySource, PivotSource} from '@sqlrooms/pivot'
import {produce} from 'immer'
import {DuckdbTableInfo} from '../../store/types'
import type {PivotBodyProps, PivotCellJson} from './types'

export const PivotBody: React.FC<PivotBodyProps> = ({ cell }) => {
    const { _duckdbTables, forceUpdate, devMode } = useNotebookStore(useShallow((s: {
        _duckdbTables: Record<string, DuckdbTableInfo>
        forceUpdate: () => void
        devMode: boolean
    }) => ({
        _duckdbTables: s._duckdbTables,
        forceUpdate: s.forceUpdate,
        devMode: s.devMode,
    })))

    const availableTables = useMemo(() => Object.keys(_duckdbTables), [_duckdbTables])

    const selectedTable = (cell.json?.selectedTable as string | undefined) ?? ''

    const querySource = useMemo((): PivotQuerySource | undefined => {
        if (!selectedTable || !_duckdbTables[selectedTable]) return undefined
        const columns = _duckdbTables[selectedTable].columns
        return { tableRef: quoteParsedRawSqlTableReference(`"${selectedTable}"`), columns }
    }, [selectedTable, _duckdbTables])

    const source = useMemo((): PivotSource | undefined =>
        selectedTable ? { kind: 'table', tableName: selectedTable } : undefined,
        [selectedTable]
    )

    const callbacks = useMemo(() => ({
        setSource: (src: PivotSource | undefined) => {
            cell.json = produce(
                (cell.json as PivotCellJson | undefined) ?? {},
                (draft: PivotCellJson) => {
                    draft.selectedTable = src?.kind === 'table' ? src.tableName : ''
                    draft.pivotConfig = undefined
                }
            ) as Record<string, unknown>
            forceUpdate()
        },
        setConfig: (config: PivotConfig) => {
            cell.json = produce(
                (cell.json as PivotCellJson | undefined) ?? {},
                (draft: PivotCellJson) => {
                    draft.pivotConfig = config
                }
            ) as Record<string, unknown>
            forceUpdate()
        },
    }), [cell, forceUpdate])

    if (!selectedTable && !devMode) {
        return <div className="text-xs text-muted-foreground p-4 text-center">Aucune table sélectionnée.</div>
    }

    return (
        <div className="flex flex-col h-full">
            {availableTables.length === 0 ? (
                <div className="text-xs text-muted-foreground p-4 text-center">
                    Aucune table disponible. Chargez d'abord des données.
                </div>
            ) : (
                <PivotEditor
                    key={selectedTable || '__no_table'}
                    source={source}
                    querySource={querySource}
                    config={cell.json?.pivotConfig}
                    availableTables={availableTables}
                    callbacks={callbacks}
                    autoRun
                    className="h-full"
                >
                    {devMode ? undefined : <PivotEditor.Results />}
                </PivotEditor>
            )}
        </div>
    )
}

