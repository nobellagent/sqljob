import type {DeriveStep} from '../../../../../lib/SqlBlockTypes'
import {AddRowBtn, MoveBtns, RemoveBtn, TxtInput} from '../ui'
import {moveArr} from '../filters'

export function DeriveStepUI({ step, availableCols, onChange }: { step: DeriveStep; availableCols: string[]; onChange: (s: DeriveStep) => void }) {
    function update(i: number, patch: Partial<{ name: string; expr: string; replace: boolean }>) {
        onChange({ ...step, columns: step.columns.map((c, idx) => idx === i ? { ...c, ...patch } : c) })
    }
    return (
        <div className="flex flex-col gap-2">
            {step.columns.map((col, i) => (
                <div key={i} className="flex flex-col gap-1 border border-border rounded p-1.5">
                    <div className="flex items-center gap-1">
                        <TxtInput value={col.name} onChange={v => update(i, { name: v })} placeholder="nom_colonne" className="flex-1" />
                        <label className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer shrink-0">
                            <input type="checkbox" checked={col.replace} onChange={e => update(i, { replace: e.target.checked })} className="w-3 h-3" />
                            Remplacer
                        </label>
                        <MoveBtns onUp={i > 0 ? () => onChange({ ...step, columns: moveArr(step.columns, i, -1) }) : undefined} onDown={i < step.columns.length - 1 ? () => onChange({ ...step, columns: moveArr(step.columns, i, 1) }) : undefined} />
                        <RemoveBtn onClick={() => onChange({ ...step, columns: step.columns.filter((_, idx) => idx !== i) })} />
                    </div>
                    <textarea className="w-full rounded border border-border bg-background px-2 py-1 text-xs font-mono resize-none" rows={2}
                        value={col.expr} onChange={e => update(i, { expr: e.target.value })} placeholder="UPPER(col) ou col * 2 ou …" />
                </div>
            ))}
            <AddRowBtn onClick={() => onChange({ ...step, columns: [...step.columns, { name: '', expr: '', replace: false }] })} label="+ Colonne calculée" />
        </div>
    )
}

