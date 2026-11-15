import type {SelectColumnsStep, ExcludeColumnsStep} from '../../../../../lib/SqlBlockTypes'
import {ColumnCheckbox} from '../ui'
import {ChangeTypeStepUI} from './changeType'

export function SelectColumnsStepUI({ step, availableCols, onChange }: {
    step: SelectColumnsStep; availableCols: string[]
    onChange: (s: SelectColumnsStep) => void
}) {
    const all = availableCols.length > 0 ? availableCols : step.columns
    const selected = new Set(step.columns)
    const toggle = (col: string, checked: boolean) => onChange({
        ...step,
        columns: checked
            ? [...step.columns, col].filter((c, i, a) => a.indexOf(c) === i)
            : step.columns.filter(c => c !== col),
    })
    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <button onClick={() => onChange({ ...step, columns: [...all] })} className="underline hover:text-foreground">tout</button>
                <span>/</span>
                <button onClick={() => onChange({ ...step, columns: [] })} className="underline hover:text-foreground">aucun</button>
                <span className="ml-auto">{step.columns.length}/{all.length} col.</span>
            </div>
            <div className="max-h-48 overflow-y-auto flex flex-col gap-0 border border-border rounded bg-background">
                {all.length === 0 && <p className="text-xs text-muted-foreground p-2 italic">Aucune colonne — exécutez la source</p>}
                {all.map(col => <ColumnCheckbox key={col} col={col} checked={selected.has(col)} onChange={toggle} />)}
            </div>
        </div>
    )
}

// ─── ExcludeColumnsStepUI ─────────────────────────────────────────────────────


export function ExcludeColumnsStepUI({ step, availableCols, onChange }: {
    step: ExcludeColumnsStep; availableCols: string[]
    onChange: (s: ExcludeColumnsStep) => void
}) {
    const all = availableCols.length > 0 ? availableCols : step.columns
    const excluded = new Set(step.columns)
    const toggle = (col: string, checked: boolean) => onChange({
        ...step,
        columns: checked
            ? [...step.columns, col].filter((c, i, a) => a.indexOf(c) === i)
            : step.columns.filter(c => c !== col),
    })
    return (
        <div className="flex flex-col gap-1">
            <p className="text-xs text-muted-foreground mb-1">
                Colonnes à exclure ({step.columns.length} sélectionnée{step.columns.length !== 1 ? 's' : ''})
            </p>
            <div className="max-h-48 overflow-y-auto flex flex-col gap-0 border border-border rounded bg-background">
                {all.length === 0 && <p className="text-xs text-muted-foreground p-2 italic">Aucune colonne — exécutez la source</p>}
                {all.map(col => <ColumnCheckbox key={col} col={col} checked={excluded.has(col)} onChange={toggle} />)}
            </div>
        </div>
    )
}

// ─── ChangeTypeStepUI ─────────────────────────────────────────────────────────

