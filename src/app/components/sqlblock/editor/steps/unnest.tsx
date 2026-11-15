import type {UnnestStep} from '../../../../../lib/SqlBlockTypes'
import {ColSelect, TxtInput} from '../ui'

export function UnnestStepUI({ step, availableCols, onChange }: { step: UnnestStep; availableCols: string[]; onChange: (s: UnnestStep) => void }) {
    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground shrink-0">Colonne array :</label>
                <ColSelect value={step.column} cols={availableCols} onChange={v => onChange({ ...step, column: v })} className="flex-1" />
            </div>
            <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground shrink-0">Nom sortie :</label>
                <TxtInput value={step.alias} onChange={v => onChange({ ...step, alias: v })} placeholder="item" className="flex-1" />
            </div>
            <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                <input type="checkbox" className="w-3 h-3" checked={step.keepEmpty} onChange={e => onChange({ ...step, keepEmpty: e.target.checked })} />
                Conserver les lignes sans valeur (LEFT JOIN)
            </label>
        </div>
    )
}

