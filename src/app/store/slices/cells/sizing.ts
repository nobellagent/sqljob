import type {StoreApi} from 'zustand'
import type {NotebookStoreState} from '../../types'
import { ConfigManager } from '../../../../lib/ConfigManager'
import { CELL_TYPE_SCHEMAS } from '../../../../lib/cellTypeSchemas'

/** Tailles, hauteurs et visibilité des cellules (extrait de cellsSlice). */
export function createCellSizingActions(
    set: StoreApi<NotebookStoreState>['setState'],
    get: StoreApi<NotebookStoreState>['getState'],
) {
    return {
        hasCellMinSize(cell: any) {
            const v = (x: any) => (x !== undefined && x !== null && String(x).trim() !== '')
            return cell && (v(cell.minSizePx) || v(cell.minSizePercent))
        },

        hasCellMaxSize(cell: any) {
            const v = (x: any) => (x !== undefined && x !== null && String(x).trim() !== '')
            return cell && (v(cell.maxSizePx) || v(cell.maxSizePercent))
        },

        hasCellHeight(cell: any) {
            const v = (x: any) => (x !== undefined && x !== null && String(x).trim() !== '')
            return cell && (v(cell.minHeightPx) || v(cell.minHeightPercent) || v(cell.maxHeightPx) || v(cell.maxHeightPercent))
        },

        isSqlCellWithEditor(type: string) {
            return ['sql', 'iframe', 'sqlStat', 'perspective', 'pdfme', 'publipostageWord'].includes(type)
        },

        bodyDisplayShouldShowSkeleton(cell: any) {
            if (!cell) return false
            if (cell.type === 'markdown' && ConfigManager.getCellEngine(cell, 'main') === 'text') return false
            const schema = CELL_TYPE_SCHEMAS.types[cell.type]
            const disp = schema?.bodyDisplay?.showSkeleton ?? { when: 'running', excludeTypes: ['uiParameter'] }
            if (disp.when === 'never') return false
            if (disp.excludeTypes?.includes(cell.type)) return false
            if (disp.excludeWhenSqlEditor && get().isSqlCellWithEditor(cell.type) && get().showSqlEditorVisible(cell)) return false
            if (cell._status === 'running') return true
            if (disp.sourceLoading && cell.type === 'source' && cell._fileName && !cell._loaded) return true
            return false
        },

        bodyDisplayShouldShowContent(cell: any) {
            if (!cell) return false
            return !get().bodyDisplayShouldShowSkeleton(cell)
        },

        getCellHeightVars(cell: any) {
            if (!cell) return ''
            const toPx = (v: any) => {
                if (v == null || String(v).trim() === '') return ''
                const s = String(v).trim()
                return /^\d+(\.\d+)?$/.test(s) ? s + 'px' : s
            }
            const toPct = (v: any) => {
                if (v == null || String(v).trim() === '') return ''
                const s = String(v).trim()
                return /^\d+(\.\d+)?$/.test(s) ? s + '%' : s
            }
            const parts: string[] = []
            const mhp = toPx(cell.minHeightPx); const mhc = toPct(cell.minHeightPercent)
            if (mhp) parts.push(`--cell-min-h-px:${mhp}`)
            if (mhc) parts.push(`--cell-min-h-pct:${mhc}`)
            const mxp = toPx(cell.maxHeightPx); const mxc = toPct(cell.maxHeightPercent)
            if (mxp) parts.push(`--cell-max-h-px:${mxp}`)
            if (mxc) parts.push(`--cell-max-h-pct:${mxc}`)
            return parts.length ? parts.join(';') : ''
        },

        getCellSizeOuterClass(cell: any, isColumn: boolean) {
            if (isColumn) return 'flex-col w-full'
            return get().hasCellMinSize(cell) ? '' : 'min-w-[200px]'
        },

        getCellWrapperStyle(cell: any, isColumn: boolean, order: number) {
            const s: any = { order: order ?? 0 }
            const toPx = (v: any) => {
                if (v === undefined || v === null) return null
                const str = String(v).trim()
                if (str === '') return null
                return /^\d+(\.\d+)?$/.test(str) ? str + 'px' : str
            }
            const toPct = (v: any) => {
                if (v === undefined || v === null) return null
                const str = String(v).trim()
                if (str === '') return null
                return /^\d+(\.\d+)?$/.test(str) ? str + '%' : str
            }
            if (!isColumn) {
                const minPx = toPx(cell?.minSizePx) ?? toPx(cell?.minSize)
                const minPct = toPct(cell?.minSizePercent)
                if (minPx && minPct) s.minWidth = `max(${minPx}, ${minPct})`
                else if (minPx) s.minWidth = minPx
                else if (minPct) s.minWidth = minPct
                const maxPx = toPx(cell?.maxSizePx) ?? toPx(cell?.maxSize)
                const maxPct = toPct(cell?.maxSizePercent)
                if (maxPx && maxPct) s.maxWidth = `min(${maxPx}, ${maxPct})`
                else if (maxPx) s.maxWidth = maxPx
                else if (maxPct) s.maxWidth = maxPct
            }
            return s
        },

        getCellSizeInnerClass() {
            return 'w-full'
        },

    }
}
