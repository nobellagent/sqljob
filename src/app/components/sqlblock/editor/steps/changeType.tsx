import {useState} from 'react'
import {DUCKDB_TYPES} from '../../../../../lib/SqlBlockTypes'
import type {ChangeTypeStep} from '../../../../../lib/SqlBlockTypes'
import {MoveBtns} from '../ui'
import {moveArr} from '../filters'

export function ChangeTypeStepUI({ step, availableCols, availableColTypes, onChange }: {
    step: ChangeTypeStep; availableCols: string[]; availableColTypes: Record<string, string>
    onChange: (s: ChangeTypeStep) => void
}) {
    const [addCol, setAddCol] = useState('')
    const [addType, setAddType] = useState('VARCHAR')
    const allCols = availableCols.length > 0 ? availableCols : step.changes.map(c => c.column)

    return (
        <div className="flex flex-col gap-0 divide-y divide-border">
            {step.changes.map((change, idx) => (
                <div key={idx} className="flex flex-col gap-1 py-2 first:pt-0">
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground shrink-0 w-4">col</span>
                        <select className="flex-1 min-w-0 h-6 rounded border border-border bg-background px-1 text-xs font-mono"
                            value={change.column}
                            onChange={e => onChange({ ...step, changes: step.changes.map((c, i) => i === idx ? { ...c, column: e.target.value } : c) })}>
                            {allCols.map(c => <option key={c} value={c}>{c}</option>)}
                            {!allCols.includes(change.column) && <option value={change.column}>{change.column}</option>}
                        </select>
                        <MoveBtns onUp={idx > 0 ? () => onChange({ ...step, changes: moveArr(step.changes, idx, -1) }) : undefined} onDown={idx < step.changes.length - 1 ? () => onChange({ ...step, changes: moveArr(step.changes, idx, 1) }) : undefined} />
                        <button onClick={() => onChange({ ...step, changes: step.changes.filter((_, i) => i !== idx) })}
                            className="shrink-0 text-destructive hover:text-destructive/80 w-5 h-5 flex items-center justify-center">✕</button>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground shrink-0 w-4">→</span>
                        <select className="flex-1 min-w-0 h-6 rounded border border-border bg-background px-1 text-xs font-mono"
                            value={change.targetType}
                            onChange={e => onChange({ ...step, changes: step.changes.map((c, i) => i === idx ? { ...c, targetType: e.target.value } : c) })}>
                            {DUCKDB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <span className="shrink-0 w-5" />
                    </div>
                </div>
            ))}
            <div className="flex flex-col gap-1.5 pt-2">
                <select className="w-full h-6 rounded border border-border bg-background px-1 text-xs font-mono"
                    value={addCol} onChange={e => setAddCol(e.target.value)}>
                    <option value="">— choisir une colonne —</option>
                    {allCols.map(c => <option key={c} value={c}>{c}{availableColTypes[c] ? ` (${availableColTypes[c]})` : ''}</option>)}
                </select>
                <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground shrink-0 w-4">→</span>
                    <select className="flex-1 min-w-0 h-6 rounded border border-border bg-background px-1 text-xs font-mono"
                        value={addType} onChange={e => setAddType(e.target.value)}>
                        {DUCKDB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <button onClick={() => { if (!addCol) return; onChange({ ...step, changes: [...step.changes, { column: addCol, targetType: addType }] }); setAddCol('') }}
                        disabled={!addCol}
                        className="shrink-0 px-2 h-6 rounded bg-primary text-primary-foreground text-xs disabled:opacity-50 whitespace-nowrap">
                        + Ajouter
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── Helpers UI partagés ──────────────────────────────────────────────────────

