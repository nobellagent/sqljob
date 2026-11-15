import type {UnionStep} from '../../../../../lib/SqlBlockTypes'
import {TxtInput} from '../ui'

export function UnionStepUI({ step, onChange }: { step: UnionStep; onChange: (s: UnionStep) => void }) {
    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground shrink-0">Table :</label>
                <TxtInput value={step.table} onChange={v => onChange({ ...step, table: v })} placeholder="nom_table" className="flex-1" />
            </div>
            <div className="flex gap-1">
                {(['all', 'distinct'] as const).map(m => (
                    <button key={m} onClick={() => onChange({ ...step, mode: m })}
                        className={`px-2 py-0.5 rounded border text-xs transition-colors ${step.mode === m ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'}`}>
                        {m === 'all' ? 'UNION ALL' : 'UNION DISTINCT'}
                    </button>
                ))}
            </div>
        </div>
    )
}

