import {DUCKDB_TYPES} from '../../../../../lib/SqlBlockTypes'
import type {JsonExtractStep} from '../../../../../lib/SqlBlockTypes'
import {AddRowBtn, ColSelect, MoveBtns, RemoveBtn, TxtInput} from '../ui'
import {moveArr} from '../filters'

export function JsonExtractStepUI({ step, availableCols, onChange }: { step: JsonExtractStep; availableCols: string[]; onChange: (s: JsonExtractStep) => void }) {
    function updateEx(i: number, patch: any) {
        onChange({ ...step, extractions: step.extractions.map((e, idx) => idx === i ? { ...e, ...patch } : e) })
    }
    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground shrink-0">Colonne JSON :</label>
                <ColSelect value={step.column} cols={availableCols} onChange={v => onChange({ ...step, column: v })} className="flex-1" />
            </div>
            {step.extractions.map((ex, i) => (
                <div key={i} className="flex items-center gap-1 flex-wrap">
                    <TxtInput value={ex.path} onChange={v => updateEx(i, { path: v })} placeholder="$.user.name" className="flex-1 min-w-24" />
                    <span className="text-xs text-muted-foreground shrink-0">→</span>
                    <TxtInput value={ex.alias} onChange={v => updateEx(i, { alias: v })} placeholder="alias" className="w-24" />
                    <select className="h-6 rounded border border-border bg-background px-1 text-xs w-20"
                        value={ex.targetType ?? ''} onChange={e => updateEx(i, { targetType: e.target.value || undefined })}>
                        <option value="">VARCHAR</option>
                        {DUCKDB_TYPES.slice(2).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <MoveBtns onUp={i > 0 ? () => onChange({ ...step, extractions: moveArr(step.extractions, i, -1) }) : undefined} onDown={i < step.extractions.length - 1 ? () => onChange({ ...step, extractions: moveArr(step.extractions, i, 1) }) : undefined} />
                    <RemoveBtn onClick={() => onChange({ ...step, extractions: step.extractions.filter((_, idx) => idx !== i) })} />
                </div>
            ))}
            <AddRowBtn onClick={() => onChange({ ...step, extractions: [...step.extractions, { path: '$.', alias: '' }] })} label="+ Extraction" />
        </div>
    )
}

