import type {UnpivotStep} from '../../../../../lib/SqlBlockTypes'
import {TxtInput} from '../ui'

export function UnpivotStepUI({ step, availableCols, onChange }: { step: UnpivotStep; availableCols: string[]; onChange: (s: UnpivotStep) => void }) {
    const toggleCol = (col: string) => {
        const s = new Set(step.columns)
        s.has(col) ? s.delete(col) : s.add(col)
        onChange({ ...step, columns: availableCols.filter(c => s.has(c)) })
    }
    return (
        <div className="flex flex-col gap-2">
            <div>
                <p className="text-xs text-muted-foreground mb-1">Colonnes à fondre :</p>
                <div className="flex flex-wrap gap-1">
                    {availableCols.map(c => (
                        <label key={c} className={`flex items-center gap-1 px-1.5 py-0.5 rounded border cursor-pointer text-xs transition-colors ${step.columns.includes(c) ? 'bg-primary/10 border-primary text-primary' : 'border-border hover:bg-muted'}`}>
                            <input type="checkbox" className="w-3 h-3" checked={step.columns.includes(c)} onChange={() => toggleCol(c)} />
                            {c}
                        </label>
                    ))}
                </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
                <label className="text-xs text-muted-foreground shrink-0 w-24">Colonne labels :</label>
                <TxtInput value={step.nameCol} onChange={v => onChange({ ...step, nameCol: v })} placeholder="category" className="flex-1" />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
                <label className="text-xs text-muted-foreground shrink-0 w-24">Colonne valeurs :</label>
                <TxtInput value={step.valueCol} onChange={v => onChange({ ...step, valueCol: v })} placeholder="value" className="flex-1" />
            </div>
        </div>
    )
}

// ─── P3 step UIs ──────────────────────────────────────────────────────────────

