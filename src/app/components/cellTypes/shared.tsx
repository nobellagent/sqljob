import {useEffect, useMemo, useRef, useState} from 'react'
import {DataTablePaginated} from '@sqlrooms/data-table'
import {DuckDBManager} from '../../../lib/DuckDBManager'
import {Dialog, DialogContent, DialogHeader, DialogTitle} from '@sqlrooms/ui'
// Éléments d'interface partagés par les corps de cellule.
import { useNotebookStore } from '../../store/notebookStore'
import {useShallow} from 'zustand/react/shallow'
import {CDNManager} from '../../../lib/CDNManager'
import type { ResultInfoProps } from './types'

/** Message d'erreur d'exécution d'une cellule (préfixe ❌). */
export const ResultInfo: React.FC<ResultInfoProps> = ({ cell, devOnly = false }) => {
    const devMode = useNotebookStore(s => s.devMode)
    if (!cell._resultInfo) return null
    if (!String(cell._resultInfo).startsWith('❌')) return null
    if (devOnly && !devMode) return null
    return <div className="mt-2 p-2 bg-muted rounded text-sm text-muted-foreground">{String(cell._resultInfo)}</div>
}

export function CellBodySkeleton() {
    return (
        <div className="flex min-w-0 w-full flex-col mt-2 gap-4">
            <div className="animate-pulse rounded-md bg-muted h-8 w-full"></div>
            <div className="animate-pulse rounded-md bg-muted h-2 w-28"></div>
            <div className="animate-pulse rounded-md bg-muted h-2 w-full"></div>
            <div className="animate-pulse rounded-md bg-muted h-2 w-full"></div>
        </div>
    )
}

export function TableSkeleton() {
    return (
        <div className="flex flex-col gap-2 p-4">
            <div className="animate-pulse rounded-md bg-muted h-6 w-full"></div>
            <div className="animate-pulse rounded-md bg-muted h-4 w-full"></div>
            <div className="animate-pulse rounded-md bg-muted h-4 w-full"></div>
            <div className="animate-pulse rounded-md bg-muted h-4 w-3/4"></div>
        </div>
    )
}

export function EChartRenderer({ cell, hasHeight }: { cell: any; hasHeight: boolean }) {
    const chartRef = useRef<HTMLDivElement>(null)
    const lastRenderedOption = useRef<any>(null)

    useEffect(() => {
        if (!chartRef.current || !cell._echartsOption) return
        if (cell._echartsOption === lastRenderedOption.current) return
        lastRenderedOption.current = cell._echartsOption
        CDNManager.loadECharts?.().then(() => {
            const echarts = (window as any).echarts
            if (!echarts || !chartRef.current) return
            let chart = echarts.getInstanceByDom(chartRef.current) || echarts.init(chartRef.current, null, { renderer: 'svg' })
            chart.clear()
            chart.setOption(cell._echartsOption)
        })
    }, [cell._echartsOption])

    // Resize ECharts quand le conteneur change de dimensions (responsive)
    useEffect(() => {
        const el = chartRef.current
        if (!el) return
        const ro = new ResizeObserver(() => {
            const echarts = (window as any).echarts
            const chart = echarts?.getInstanceByDom(el)
            chart?.resize()
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    if (cell._kpiHtml) return <div className="w-full" dangerouslySetInnerHTML={{ __html: cell._kpiHtml }} />
    return <div ref={chartRef} className={`w-full ${hasHeight ? 'flex-1 min-h-0' : 'min-h-[300px]'}`} />
}

export function RejectErrorsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    const [rows, setRows] = useState<any[]>([])
    const [cols, setCols] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 })
    const [sorting, setSorting] = useState([])

    useEffect(() => {
        if (!open) return
        setLoading(true)
        DuckDBManager.executeQuery('SELECT * FROM reject_errors')
            .then(result => {
                const data = result ?? []
                setRows(data)
                setCols(data.length ? Object.keys(data[0]) : [])
            })
            .catch(() => { setRows([]); setCols([]) })
            .finally(() => setLoading(false))
    }, [open])

    const columns = useMemo(() =>
        cols.map(key => ({
            id: key, accessorKey: key, header: key,
            cell: ({ getValue }: any) => { const v = getValue(); return v == null ? '' : String(v) }
        })), [cols])

    const pageData = useMemo(() => {
        const start = pagination.pageIndex * pagination.pageSize
        return rows.slice(start, start + pagination.pageSize)
    }, [rows, pagination])

    return (
        <Dialog open={open} onOpenChange={o => !o && onClose()}>
            <DialogContent className="max-w-5xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Lignes rejetées — reject_errors ({rows.length})</DialogTitle>
                </DialogHeader>
                <div className="flex-1 min-h-0 overflow-auto">
                    {loading ? (
                        <div className="p-4 text-sm text-muted-foreground">Chargement…</div>
                    ) : rows.length === 0 ? (
                        <div className="p-4 text-sm text-muted-foreground">Aucune ligne rejetée.</div>
                    ) : (
                        <DataTablePaginated
                            data={pageData}
                            columns={columns}
                            numRows={rows.length}
                            pagination={pagination}
                            sorting={sorting}
                            onPaginationChange={setPagination}
                            onSortingChange={setSorting}
                            fontSize="text-xs"
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

