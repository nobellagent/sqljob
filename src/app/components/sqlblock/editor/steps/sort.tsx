import type {SortStep, SortKey} from '../../../../../lib/SqlBlockTypes'
import {AddRowBtn, ColSelect, MoveBtns, RemoveBtn} from '../ui'
import {moveArr} from '../filters'

export function SortStepUI({ step, availableCols, onChange }: { step: SortStep; availableCols: string[]; onChange: (s: SortStep) => void }) {
    function update(i: number, patch: Partial<SortKey>) {
        onChange({ ...step, keys: step.keys.map((k, idx) => idx === i ? { ...k, ...patch } : k) })
    }
    return (
        <div className="flex flex-col gap-1.5">
            {step.keys.map((k, i) => (
                <div key={i} className="flex items-center gap-1 flex-wrap">
                    <ColSelect value={k.column} cols={availableCols} onChange={v => update(i, { column: v })} className="flex-1 min-w-24" />
                    <div className="flex rounded border border-border overflow-hidden text-xs">
                        {(['asc', 'desc'] as const).map(d => (
                            <button key={d} onClick={() => update(i, { direction: d })}
                                className={`px-2 py-0.5 transition-colors ${k.direction === d ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}>
                                {d.toUpperCase()}
                            </button>
                        ))}
                    </div>
                    <div className="flex rounded border border-border overflow-hidden text-xs">
                        {(['last', 'first'] as const).map(n => (
                            <button key={n} onClick={() => update(i, { nulls: n })}
                                className={`px-1.5 py-0.5 transition-colors ${k.nulls === n ? 'bg-muted-foreground/20 font-medium' : 'bg-background hover:bg-muted'} text-xs`}>
                                NULL {n.toUpperCase()}
                            </button>
                        ))}
                    </div>
                    <MoveBtns onUp={i > 0 ? () => onChange({ ...step, keys: moveArr(step.keys, i, -1) }) : undefined} onDown={i < step.keys.length - 1 ? () => onChange({ ...step, keys: moveArr(step.keys, i, 1) }) : undefined} />
                    <RemoveBtn onClick={() => onChange({ ...step, keys: step.keys.filter((_, idx) => idx !== i) })} />
                </div>
            ))}
            <AddRowBtn onClick={() => onChange({ ...step, keys: [...step.keys, { column: availableCols[0] ?? '', direction: 'asc', nulls: 'last' }] })} label="+ Clé de tri" />
        </div>
    )
}

