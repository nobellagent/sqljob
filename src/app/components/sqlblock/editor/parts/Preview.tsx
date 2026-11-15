import {useState, useRef, useEffect} from 'react'
import {SqlMonacoEditor} from '@sqlrooms/sql-editor'
import {CDNManager} from '../../../../../lib/CDNManager'

export function SqlPreview({ sql, editable, onEdit, tableSchemas, cellId }: {
    sql: string; editable: boolean; onEdit?: (sql: string) => void
    tableSchemas: any[]; cellId: string
}) {
    const [editMode, setEditMode] = useState(false)
    const [draft, setDraft] = useState(sql)

    // Sync en lecture seule
    useEffect(() => { if (!editMode) setDraft(sql) }, [sql, editMode])

    function handleApply() { onEdit?.(draft); setEditMode(false) }
    function handleCancel() { setDraft(sql); setEditMode(false) }

    return (
        <div className="flex flex-col gap-1 flex-1 min-h-0">
            <div className="flex items-center justify-between h-5 shrink-0">
                {editable && !editMode && (
                    <button onClick={() => { setDraft(sql); setEditMode(true) }}
                        className="text-xs text-muted-foreground hover:text-foreground underline">
                        Éditer manuellement…
                    </button>
                )}
                {editMode && (
                    <div className="flex gap-2">
                        <button onClick={handleApply} className="text-xs text-primary underline">Appliquer</button>
                        <button onClick={handleCancel} className="text-xs text-muted-foreground underline">Annuler</button>
                    </div>
                )}
            </div>
            <div className="flex-1 min-h-0">
                <SqlMonacoEditor
                    key={`${cellId}-sql-${editMode ? 'edit' : 'view'}`}
                    value={editMode ? draft : sql}
                    onChange={editMode ? (v) => setDraft(v ?? '') : undefined}
                    tableSchemas={tableSchemas}
                    className="border border-border rounded overflow-hidden h-full"
                    options={{
                        readOnly: !editMode,
                        minimap: { enabled: false },
                        lineNumbers: 'on',
                        scrollBeyondLastLine: false,
                        wordWrap: 'on',
                        fontSize: 12,
                        renderLineHighlight: 'none',
                        overviewRulerLanes: 0,
                        scrollbar: { vertical: 'auto', alwaysConsumeMouseWheel: false },
                    }}
                    height="100%"
                />
            </div>
        </div>
    )
}

// ─── DegradedBanner ───────────────────────────────────────────────────────────



export function DegradedBanner({ onRestore }: { onRestore: () => void }) {
    return (
        <div className="flex items-start gap-2 px-3 py-2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs mb-2">
            <span className="shrink-0 text-base">⚠️</span>
            <div className="flex-1">
                <strong>Mode dégradé</strong> — Le SQL a été édité manuellement et n'est plus compatible avec l'interface visuelle.
            </div>
            <button onClick={onRestore} className="shrink-0 underline hover:no-underline ml-2">
                Tenter la restauration
            </button>
        </div>
    )
}

// ─── IncompatibleConfirmModal ─────────────────────────────────────────────────



export function IncompatibleConfirmModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-background border border-border rounded-lg shadow-xl max-w-md w-full mx-4 p-5">
                <h3 className="text-sm font-semibold mb-2">SQL non compatible avec ce bloc</h3>
                <p className="text-xs text-muted-foreground mb-4">
                    Le SQL saisi ne correspond à aucun des patterns reconnus.
                    Voulez-vous continuer en <strong>mode dégradé</strong> (SQL libre, UI désactivée) ?
                </p>
                <div className="flex justify-end gap-2">
                    <button onClick={onCancel} className="px-3 py-1.5 text-xs rounded border border-border hover:bg-muted">Annuler</button>
                    <button onClick={onConfirm} className="px-3 py-1.5 text-xs rounded bg-amber-500 text-white hover:bg-amber-600">Continuer en mode dégradé</button>
                </div>
            </div>
        </div>
    )
}

// ─── ChartPreviewInEditor — aperçu ECharts/KPI dans le panel dtSection ────────



export function ChartPreviewInEditor({ cell }: { cell: any }) {
    const chartRef = useRef<HTMLDivElement>(null)
    // Ne re-rendre le graphique que si _echartsOption a changé (nouvelle référence produite par runCellAt).
    const lastRenderedOption = useRef<any>(null)

    useEffect(() => {
        if (!chartRef.current || !cell._echartsOption) return
        if (cell._echartsOption === lastRenderedOption.current) return  // aucun changement réel
        lastRenderedOption.current = cell._echartsOption
        CDNManager.loadECharts?.().then(() => {
            const echarts = (window as any).echarts
            if (!echarts || !chartRef.current) return
            let chart = echarts.getInstanceByDom(chartRef.current) || echarts.init(chartRef.current)
            chart.clear()
            chart.setOption(cell._echartsOption)
        })
    }, [cell._echartsOption])

    if (cell._kpiHtml) return (
        <div className="overflow-auto text-center">
            {cell._kpiLabel && <div style={{fontSize:'clamp(1.1rem,3vw,1.5rem)'}} className="font-semibold text-foreground mb-0.5">{cell._kpiLabel}</div>}
            <div dangerouslySetInnerHTML={{ __html: cell._kpiHtml }} />
            {cell._sublabel && <div style={{fontSize:'clamp(0.8rem,2vw,1rem)'}} className="text-muted-foreground text-center mt-1">{cell._sublabel}</div>}
        </div>
    )
    return (
        <div className="flex flex-col min-h-0">
            {cell._kpiLabel && <div style={{fontSize:'clamp(1.1rem,3vw,1.5rem)'}} className="font-semibold text-foreground mb-0.5 text-center shrink-0">{cell._kpiLabel}</div>}
            <div ref={chartRef} className="flex-1 min-h-[200px]" />
            {cell._sublabel && <div style={{fontSize:'clamp(0.8rem,2vw,1rem)'}} className="text-muted-foreground text-center mt-1 shrink-0">{cell._sublabel}</div>}
        </div>
    )
}

// ─── SqlBlockEditor (composant principal) ─────────────────────────────────────

