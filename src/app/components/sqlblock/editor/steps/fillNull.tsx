import type {FillNullStep} from '../../../../../lib/SqlBlockTypes'
import {AddRowBtn, ColSelect, MoveBtns, RemoveBtn, TxtInput} from '../ui'
import {moveArr} from '../filters'

export const FILL_STRATEGIES = [
    { value: 'value', label: 'Valeur fixe' },
    { value: 'zero', label: '0' },
    { value: 'empty_string', label: 'Chaîne vide' },
    { value: 'mean', label: 'Moyenne' },
    { value: 'median', label: 'Médiane' },
]


export function FillNullStepUI({ step, availableCols, onChange }: { step: FillNullStep; availableCols: string[]; onChange: (s: FillNullStep) => void }) {
    function update(i: number, patch: any) {
        onChange({ ...step, fills: step.fills.map((f, idx) => idx === i ? { ...f, ...patch } : f) })
    }
    return (
        <div className="flex flex-col gap-1.5">
            {step.fills.map((fill, i) => (
                <div key={i} className="flex items-center gap-1 flex-wrap">
                    <ColSelect value={fill.column} cols={availableCols} onChange={v => update(i, { column: v })} className="flex-1 min-w-20" />
                    <select className="h-6 rounded border border-border bg-background px-1 text-xs w-28"
                        value={fill.strategy} onChange={e => update(i, { strategy: e.target.value })}>
                        {FILL_STRATEGIES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                    {fill.strategy === 'value' && (
                        <TxtInput value={fill.value ?? ''} onChange={v => update(i, { value: v })} placeholder="valeur" className="flex-1 min-w-16" />
                    )}
                    <MoveBtns onUp={i > 0 ? () => onChange({ ...step, fills: moveArr(step.fills, i, -1) }) : undefined} onDown={i < step.fills.length - 1 ? () => onChange({ ...step, fills: moveArr(step.fills, i, 1) }) : undefined} />
                    <RemoveBtn onClick={() => onChange({ ...step, fills: step.fills.filter((_, idx) => idx !== i) })} />
                </div>
            ))}
            <AddRowBtn onClick={() => onChange({ ...step, fills: [...step.fills, { column: availableCols[0] ?? '', strategy: 'value', value: '' }] })} label="+ Colonne" />
        </div>
    )
}

// ─── P2 step UIs ──────────────────────────────────────────────────────────────

