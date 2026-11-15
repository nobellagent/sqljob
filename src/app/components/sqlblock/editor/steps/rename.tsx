import type {RenameColumnsStep} from '../../../../../lib/SqlBlockTypes'
import {AddRowBtn, ColSelect, MoveBtns, RemoveBtn, TxtInput} from '../ui'
import {moveArr} from '../filters'

export function RenameColumnsStepUI({ step, availableCols, onChange }: { step: RenameColumnsStep; availableCols: string[]; onChange: (s: RenameColumnsStep) => void }) {
    function update(i: number, patch: Partial<{ from: string; to: string }>) {
        onChange({ ...step, renames: step.renames.map((r, idx) => idx === i ? { ...r, ...patch } : r) })
    }
    return (
        <div className="flex flex-col gap-1.5">
            {step.renames.map((r, i) => (
                <div key={i} className="flex items-center gap-1">
                    <ColSelect value={r.from} cols={availableCols} onChange={v => update(i, { from: v })} className="flex-1" />
                    <span className="text-xs text-muted-foreground shrink-0">→</span>
                    <TxtInput value={r.to} onChange={v => update(i, { to: v })} placeholder="nouveau nom" className="flex-1" />
                    <MoveBtns onUp={i > 0 ? () => onChange({ ...step, renames: moveArr(step.renames, i, -1) }) : undefined} onDown={i < step.renames.length - 1 ? () => onChange({ ...step, renames: moveArr(step.renames, i, 1) }) : undefined} />
                    <RemoveBtn onClick={() => onChange({ ...step, renames: step.renames.filter((_, idx) => idx !== i) })} />
                </div>
            ))}
            <AddRowBtn onClick={() => onChange({ ...step, renames: [...step.renames, { from: availableCols[0] ?? '', to: '' }] })} label="+ Renommage" />
        </div>
    )
}

