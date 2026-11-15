import type {JoinStep, JoinCondition} from '../../../../../lib/SqlBlockTypes'
import {AddRowBtn, ColSelect, MoveBtns, RemoveBtn, TxtInput} from '../ui'
import {moveArr} from '../filters'

export const JOIN_TYPES: { type: JoinStep['joinType']; label: string }[] = [
    { type: 'left', label: 'LEFT' }, { type: 'inner', label: 'INNER' },
    { type: 'right', label: 'RIGHT' }, { type: 'full', label: 'FULL' },
    { type: 'anti', label: 'ANTI' },
]


export function JoinStepUI({ step, availableCols, onChange }: { step: JoinStep; availableCols: string[]; onChange: (s: JoinStep) => void }) {
    function updateOn(i: number, patch: Partial<JoinCondition>) {
        onChange({ ...step, on: step.on.map((c, idx) => idx === i ? { ...c, ...patch } : c) })
    }
    const selRight = step.selectRight === '*' ? [] : step.selectRight
    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground shrink-0">Table :</label>
                <TxtInput value={step.rightTable} onChange={v => onChange({ ...step, rightTable: v })} placeholder="nom_table" className="flex-1" />
            </div>
            <div className="flex gap-1 flex-wrap">
                {JOIN_TYPES.map(jt => (
                    <button key={jt.type} onClick={() => onChange({ ...step, joinType: jt.type })}
                        className={`px-2 py-0.5 rounded border text-xs transition-colors ${step.joinType === jt.type ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'}`}>
                        {jt.label}
                    </button>
                ))}
            </div>
            <div>
                <p className="text-xs text-muted-foreground mb-1">Clés de jointure :</p>
                {step.on.map((c, i) => (
                    <div key={i} className="flex items-center gap-1 mb-1">
                        <ColSelect value={c.left} cols={availableCols} onChange={v => updateOn(i, { left: v })} placeholder="col gauche" className="flex-1" />
                        <span className="text-xs text-muted-foreground shrink-0">=</span>
                        <TxtInput value={c.right} onChange={v => updateOn(i, { right: v })} placeholder="col droite" className="flex-1" />
                        <MoveBtns onUp={i > 0 ? () => onChange({ ...step, on: moveArr(step.on, i, -1) }) : undefined} onDown={i < step.on.length - 1 ? () => onChange({ ...step, on: moveArr(step.on, i, 1) }) : undefined} />
                        <RemoveBtn onClick={() => onChange({ ...step, on: step.on.filter((_, idx) => idx !== i) })} />
                    </div>
                ))}
                <AddRowBtn onClick={() => onChange({ ...step, on: [...step.on, { left: availableCols[0] ?? '', right: '' }] })} label="+ Clé" />
            </div>
            <div>
                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <input type="checkbox" className="w-3 h-3" checked={step.selectRight === '*'}
                        onChange={e => onChange({ ...step, selectRight: e.target.checked ? '*' : [] })} />
                    Importer toutes les colonnes de droite
                </label>
                {step.selectRight !== '*' && (
                    <div className="mt-1">
                        <p className="text-xs text-muted-foreground mb-0.5">Colonnes à importer (noms) :</p>
                        <TxtInput value={selRight.join(', ')} onChange={v => onChange({ ...step, selectRight: v.split(',').map(x => x.trim()).filter(Boolean) })}
                            placeholder="col1, col2…" className="w-full" />
                    </div>
                )}
            </div>
        </div>
    )
}

