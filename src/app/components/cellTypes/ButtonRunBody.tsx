import {useShallow} from 'zustand/react/shallow'
import {useNotebookStore} from '../../store/notebookStore'
import type {CellBodyBaseProps} from './types'

export const ButtonRunBody: React.FC<CellBodyBaseProps> = ({ cell, path, cellIndex }) => {
    const { runCellsAfter, isLoading } = useNotebookStore(useShallow(s => ({ runCellsAfter: s.runCellsAfter, isLoading: s.isLoading })))
    return (
        <div className="flex justify-center p-0">
            <button className="inline-flex items-center justify-center px-4 py-1.5 rounded text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50" onClick={() => runCellsAfter(path, cellIndex)} disabled={isLoading}>
                <span>{cell.buttonLabel || 'Exécuter'}</span>
            </button>
        </div>
    )
}

