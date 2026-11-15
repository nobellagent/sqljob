import {useShallow} from 'zustand/react/shallow'
import {useNotebookStore} from '../../store/notebookStore'
import {CellHeader} from '../CellHeader'
import {CellBody} from '../CellBody'

export function CellItem({ cell, cellIndex, path, group }: { cell: any, cellIndex: number, path: number[], group: any }) {
    const {
        devMode, getCellSizeOuterClass, getCellWrapperStyle,
        getCellSizeInnerClass, shouldShowCell
    } = useNotebookStore(useShallow(s => ({
        devMode: s.devMode,
        getCellSizeOuterClass: s.getCellSizeOuterClass,
        getCellWrapperStyle: s.getCellWrapperStyle,
        getCellSizeInnerClass: s.getCellSizeInnerClass,
        shouldShowCell: s.shouldShowCell
    })))

    const isColumn = group.direction === 'column'
    if (!devMode && !shouldShowCell(cell)) return null

    const outerClass = getCellSizeOuterClass?.(cell, isColumn) || ''
    const wrapperStyle = getCellWrapperStyle?.(cell, isColumn, cell._order ?? 0) || {}
    const innerClass = getCellSizeInnerClass?.() || ''

    const statusBorder = cell._status === 'running'
        ? 'border-yellow-400 shadow-[0_0_10px_rgba(251,191,36,0.3)]'
        : cell._status === 'success' ? 'border-green-500'
            : cell._status === 'error' ? 'border-destructive' : ''

    const borderClass = cell.border !== false
        ? `border border-border shadow-sm hover:border-primary hover:shadow-lg ${statusBorder}`
        : 'border-0 shadow-none'

    return (
        <div className={`flex flex-1 ${outerClass}`} style={wrapperStyle}>
            <div className={`rounded-lg overflow-hidden bg-background cell-container ${innerClass} ${borderClass}`}>
                <CellHeader cell={cell} path={path} cellIndex={cellIndex} group={group} />
                <CellBody cell={cell} path={path} cellIndex={cellIndex} group={group} />
            </div>
        </div>
    )
}

