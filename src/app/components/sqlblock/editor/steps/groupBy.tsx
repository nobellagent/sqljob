import type {GroupByStep, Aggregation} from '../../../../../lib/SqlBlockTypes'
import {AddRowBtn, ColSelect, MoveBtns, RemoveBtn, TxtInput} from '../ui'
import {moveArr} from '../filters'

const AGG_FNS = ['count', 'count_distinct', 'sum', 'avg', 'min', 'max', 'median', 'stddev', 'string_agg', 'list']


function autoAlias(fn: string, column: string): string {
    const col = column === '*' ? 'all' : column
    return `${fn}_${col}`
}


export function GroupByStepUI({ step, availableCols, onChange }: { step: GroupByStep; availableCols: string[]; onChange: (s: GroupByStep) => void }) {
    function updateAgg(i: number, patch: Partial<Aggregation>) {
        const current = step.aggregations[i]
        // Auto-recalcule l'alias quand fn ou column change
        const merged = { ...current, ...patch }
        if (('fn' in patch || 'column' in patch)) {
            merged.alias = autoAlias(merged.fn, merged.column)
        }
        onChange({ ...step, aggregations: step.aggregations.map((a, idx) => idx === i ? merged : a) })
    }
    const toggleGroup = (col: string) => {
        const s = new Set(step.groupCols)
        s.has(col) ? s.delete(col) : s.add(col)
        onChange({ ...step, groupCols: availableCols.filter(c => s.has(c)) })
    }
    return (
        <div className="flex flex-col gap-2">
            <div>
                <p className="text-xs text-muted-foreground mb-1">Grouper par :</p>
                <div className="flex flex-wrap gap-1">
                    {availableCols.map(c => (
                        <label key={c} className={`flex items-center gap-1 px-2 py-0.5 rounded border cursor-pointer text-xs transition-colors ${step.groupCols.includes(c) ? 'bg-primary/10 border-primary text-primary' : 'border-border hover:bg-muted'}`}>
                            <input type="checkbox" className="w-3 h-3" checked={step.groupCols.includes(c)} onChange={() => toggleGroup(c)} />
                            {c}
                        </label>
                    ))}
                    {availableCols.length === 0 && <span className="text-xs text-muted-foreground italic">Aucune colonne</span>}
                </div>
            </div>
            <div>
                <p className="text-xs text-muted-foreground mb-1">Agrégations :</p>
                {step.aggregations.map((a, i) => (
                    <div key={i} className="flex items-center gap-1 mb-1 flex-wrap">
                        <ColSelect value={a.column} cols={['*', ...availableCols]} onChange={v => updateAgg(i, { column: v })} placeholder="colonne" className="flex-1 min-w-20" />
                        <select className="h-6 rounded border border-border bg-background px-1 text-xs w-28"
                            value={a.fn} onChange={e => updateAgg(i, { fn: e.target.value as any })}>
                            {AGG_FNS.map(f => <option key={f} value={f}>{f.replace('_', ' ')}</option>)}
                        </select>
                        <span className="text-xs text-muted-foreground shrink-0">→</span>
                        <TxtInput value={a.alias} onChange={v => updateAgg(i, { alias: v })} placeholder="alias" className="flex-1 min-w-16" />
                        {a.fn === 'string_agg' && <TxtInput value={a.separator ?? ', '} onChange={v => updateAgg(i, { separator: v })} placeholder="séparateur" className="w-16" />}
                        <MoveBtns onUp={i > 0 ? () => onChange({ ...step, aggregations: moveArr(step.aggregations, i, -1) }) : undefined} onDown={i < step.aggregations.length - 1 ? () => onChange({ ...step, aggregations: moveArr(step.aggregations, i, 1) }) : undefined} />
                        <RemoveBtn onClick={() => onChange({ ...step, aggregations: step.aggregations.filter((_, idx) => idx !== i) })} />
                    </div>
                ))}
                <AddRowBtn onClick={() => { const col = availableCols[0] ?? '*'; onChange({ ...step, aggregations: [...step.aggregations, { column: col, fn: 'count', alias: autoAlias('count', col) }] }) }} label="+ Agrégation" />
            </div>
        </div>
    )
}

