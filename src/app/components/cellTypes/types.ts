// Types partagés des corps de cellule.
import type {NotebookCell} from '../../store/types'
import type {PivotConfig} from '@sqlrooms/pivot'

export type CellBodyBaseProps = {
    cell: NotebookCell
    path: number[]
    cellIndex: number
}

export type ResultInfoProps = { cell: NotebookCell; devOnly?: boolean }

export type SqlTableBodyProps = CellBodyBaseProps & { showTextResult?: boolean }

export type PivotBodyProps = { cell: NotebookCell }

export type PivotCellJson = {
    selectedTable?: string
    pivotConfig?: PivotConfig
}
