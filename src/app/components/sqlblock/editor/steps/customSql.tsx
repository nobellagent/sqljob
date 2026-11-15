import type {CustomSqlStep} from '../../../../../lib/SqlBlockTypes'
import {ConditionalColumnStepUI} from './conditional'

export function CustomSqlStepUI({ step, onChange }: { step: CustomSqlStep; onChange: (s: CustomSqlStep) => void }) {
    return (
        <div className="flex flex-col gap-3">
            <p className="text-xs text-muted-foreground">
                Écrivez du SQL libre. Utilisez <code className="bg-muted px-1 rounded font-mono">{'{{subquery}}'}</code> pour référencer le résultat de l'étape précédente (ou la source si c'est la première étape).
            </p>
            <textarea
                className="w-full h-48 text-xs font-mono rounded-md border border-border bg-background p-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                value={step.sql}
                onChange={e => onChange({ ...step, sql: e.target.value })}
                spellCheck={false}
                placeholder="SELECT * FROM {{subquery}} WHERE ..."
            />
        </div>
    )
}

// ─── ConditionalColumnStepUI ──────────────────────────────────────────────────

/** Une règle WHEN … THEN … avec groupe de conditions récursif (sous-groupes supportés) */
