import type {PivotStep} from '../../../../../lib/SqlBlockTypes'
import {ColSelect} from '../ui'

export const AGG_FNS_PIVOT = ['SUM', 'COUNT', 'AVG', 'MIN', 'MAX', 'MEDIAN']


export function PivotStepUI({ step, availableCols, onChange }: { step: PivotStep; availableCols: string[]; onChange: (s: PivotStep) => void }) {
    const toggleGroup = (col: string) => {
        const s = new Set(step.groupCols)
        s.has(col) ? s.delete(col) : s.add(col)
        onChange({ ...step, groupCols: availableCols.filter(c => s.has(c)) })
    }
    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 flex-wrap">
                <label className="text-xs text-muted-foreground shrink-0 w-20">Pivoter :</label>
                <ColSelect value={step.onColumn} cols={availableCols} onChange={v => onChange({ ...step, onColumn: v })} className="flex-1" />
            </div>
            <div className="flex items-center gap-1 flex-wrap">
                <label className="text-xs text-muted-foreground shrink-0 w-20">Valeur :</label>
                <ColSelect value={step.valueColumn} cols={availableCols} onChange={v => onChange({ ...step, valueColumn: v })} className="flex-1" />
                <select className="h-6 rounded border border-border bg-background px-1 text-xs w-20"
                    value={step.valueFn} onChange={e => onChange({ ...step, valueFn: e.target.value })}>
                    {AGG_FNS_PIVOT.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
            </div>
            <div>
                <p className="text-xs text-muted-foreground mb-1 w-20">Lignes :</p>
                <div className="flex flex-wrap gap-1">
                    {availableCols.filter(c => c !== step.onColumn && c !== step.valueColumn).map(c => (
                        <label key={c} className={`flex items-center gap-1 px-1.5 py-0.5 rounded border cursor-pointer text-xs transition-colors ${step.groupCols.includes(c) ? 'bg-primary/10 border-primary text-primary' : 'border-border hover:bg-muted'}`}>
                            <input type="checkbox" className="w-3 h-3" checked={step.groupCols.includes(c)} onChange={() => toggleGroup(c)} />
                            {c}
                        </label>
                    ))}
                </div>
            </div>
        </div>
    )
}

