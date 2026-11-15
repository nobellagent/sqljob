import type {WindowStep, WindowColumn} from '../../../../../lib/SqlBlockTypes'
import {AddRowBtn, ColSelect, MoveBtns, RemoveBtn, TxtInput} from '../ui'
import {moveArr} from '../filters'

export const WINDOW_FNS = [
    'ROW_NUMBER', 'RANK', 'DENSE_RANK', 'PERCENT_RANK', 'CUME_DIST', 'NTILE',
    'SUM', 'AVG', 'COUNT', 'MIN', 'MAX', 'MEDIAN',
    'LAG', 'LEAD', 'FIRST_VALUE', 'LAST_VALUE', 'NTH_VALUE',
]

export const NO_COL_FNS = new Set(['ROW_NUMBER', 'RANK', 'DENSE_RANK', 'PERCENT_RANK', 'CUME_DIST'])


export function WindowStepUI({ step, availableCols, onChange }: { step: WindowStep; availableCols: string[]; onChange: (s: WindowStep) => void }) {
    function update(i: number, patch: Partial<WindowColumn>) {
        onChange({ ...step, columns: step.columns.map((w, idx) => idx === i ? { ...w, ...patch } : w) })
    }
    function addWin() {
        onChange({ ...step, columns: [...step.columns, { fn: 'ROW_NUMBER', partitionBy: [], orderBy: [], alias: 'rn' }] })
    }
    return (
        <div className="flex flex-col gap-2">
            {step.columns.map((w, i) => (
                <div key={i} className="flex flex-col gap-1 border border-border rounded p-1.5">
                    <div className="flex items-center gap-1 flex-wrap">
                        <select className="h-6 rounded border border-border bg-background px-1 text-xs w-32"
                            value={w.fn} onChange={e => update(i, { fn: e.target.value })}>
                            {WINDOW_FNS.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                        {!NO_COL_FNS.has(w.fn) && (
                            <ColSelect value={w.col ?? ''} cols={availableCols} onChange={v => update(i, { col: v })} placeholder="col" className="flex-1" />
                        )}
                        {(w.fn === 'LAG' || w.fn === 'LEAD') && (
                            <input type="number" min={1} className="w-12 h-6 rounded border border-border bg-background px-1 text-xs"
                                value={w.offset ?? 1} onChange={e => update(i, { offset: Number(e.target.value) })} title="décalage" />
                        )}
                        <span className="text-xs text-muted-foreground shrink-0">→</span>
                        <TxtInput value={w.alias} onChange={v => update(i, { alias: v })} placeholder="alias" className="w-24" />
                        <MoveBtns onUp={i > 0 ? () => onChange({ ...step, columns: moveArr(step.columns, i, -1) }) : undefined} onDown={i < step.columns.length - 1 ? () => onChange({ ...step, columns: moveArr(step.columns, i, 1) }) : undefined} />
                        <RemoveBtn onClick={() => onChange({ ...step, columns: step.columns.filter((_, idx) => idx !== i) })} />
                    </div>
                    <div className="flex items-center gap-1 flex-wrap text-xs text-muted-foreground">
                        <span className="shrink-0">PARTITION BY :</span>
                        <TxtInput value={w.partitionBy.join(', ')} onChange={v => update(i, { partitionBy: v.split(',').map(x => x.trim()).filter(Boolean) })} placeholder="col1, col2…" className="flex-1" />
                    </div>
                    <div className="flex items-center gap-1 flex-wrap text-xs text-muted-foreground">
                        <span className="shrink-0">ORDER BY :</span>
                        <TxtInput value={w.orderBy.map(k => `${k.column} ${k.direction.toUpperCase()}`).join(', ')} onChange={v => {
                            const keys = v.split(',').map(x => x.trim()).filter(Boolean).map(x => {
                                const [col, dir] = x.split(/\s+/)
                                return { column: col, direction: (dir?.toLowerCase() === 'desc' ? 'desc' : 'asc') as 'asc' | 'desc', nulls: 'last' as const }
                            })
                            update(i, { orderBy: keys })
                        }} placeholder="col ASC, col2 DESC…" className="flex-1" />
                    </div>
                </div>
            ))}
            <AddRowBtn onClick={addWin} label="+ Fonction fenêtre" />
        </div>
    )
}

