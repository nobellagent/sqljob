import type {DateTruncStep} from '../../../../../lib/SqlBlockTypes'
import {ColSelect, TxtInput} from '../ui'

const DATE_GRANULARITIES = ['second', 'minute', 'hour', 'day', 'week', 'month', 'quarter', 'year']


export function DateTruncStepUI({ step, availableCols, onChange }: { step: DateTruncStep; availableCols: string[]; onChange: (s: DateTruncStep) => void }) {
    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 flex-wrap">
                <label className="text-xs text-muted-foreground shrink-0 w-20">Colonne :</label>
                <ColSelect value={step.column} cols={availableCols} onChange={v => onChange({ ...step, column: v })} className="flex-1" />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
                <label className="text-xs text-muted-foreground shrink-0 w-20">Granularité :</label>
                <select className="h-6 rounded border border-border bg-background px-1 text-xs flex-1"
                    value={step.granularity} onChange={e => onChange({ ...step, granularity: e.target.value as any })}>
                    {DATE_GRANULARITIES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
            </div>
            <div className="flex gap-1">
                {(['replace', 'add'] as const).map(m => (
                    <button key={m} onClick={() => onChange({ ...step, mode: m })}
                        className={`px-2 py-0.5 rounded border text-xs transition-colors ${step.mode === m ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'}`}>
                        {m === 'replace' ? 'Remplacer' : 'Nouvelle colonne'}
                    </button>
                ))}
            </div>
            {step.mode === 'add' && (
                <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground shrink-0 w-20">Nom :</label>
                    <TxtInput value={step.alias ?? ''} onChange={v => onChange({ ...step, alias: v })} placeholder={`${step.column}_${step.granularity}`} className="flex-1" />
                </div>
            )}
        </div>
    )
}

// ─── Résumé inline d'un step ──────────────────────────────────────────────────

