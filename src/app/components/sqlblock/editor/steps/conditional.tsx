import type {FilterGroup, ConditionalColumnStep, ConditionalRule} from '../../../../../lib/SqlBlockTypes'
import {makeTableRef} from '../session'
import {useStepEyeData} from '../useStepEyeData'
import {AddRowBtn, MoveBtns, RemoveBtn, TxtInput} from '../ui'
import {VarInput} from '../varInput'
import {FilterGroupUI, moveArr} from '../filters'
import {useStepInputSchemas} from '../stepParts'

export function ConditionalRuleRow({ rule, index, total, availableCols, fetchDistinctValues, onChange, onRemove, onMoveUp, onMoveDown }: {
    rule: ConditionalRule; index: number; total: number
    availableCols: string[]
    fetchDistinctValues?: (col: string, sl: number, fl: number) => Promise<{ values: string[]; hasMore: boolean }>
    onChange: (r: ConditionalRule) => void
    onRemove: () => void
    onMoveUp?: () => void
    onMoveDown?: () => void
}) {
    const when: FilterGroup = rule.when ?? { items: [], logicOp: 'AND' }

    return (
        <div className="border border-border rounded p-2 flex flex-col gap-1.5">
            {/* En-tête règle */}
            <div className="flex items-center gap-1 mb-0.5">
                <span className="text-xs font-semibold text-muted-foreground shrink-0">SI</span>
                <span className="flex-1" />
                <MoveBtns onUp={onMoveUp} onDown={onMoveDown} />
                <RemoveBtn onClick={onRemove} />
            </div>
            {/* Groupe de conditions récursif (avec sous-groupes, AND/OR, NOT) */}
            <FilterGroupUI
                group={when}
                onUpdate={g => onChange({ ...rule, when: g })}
                availableCols={availableCols}
                depth={1}
                fetchDistinctValues={fetchDistinctValues}
            />
            {/* Valeur ALORS */}
            <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-muted-foreground shrink-0 w-12">ALORS</span>
                <VarInput
                    value={rule.then ?? ''} valueKind={rule.thenKind ?? 'literal'}
                    onChange={(v, k) => onChange({ ...rule, then: v, thenKind: k })}
                    availableCols={availableCols}
                    fetchDistinctValues={fetchDistinctValues}
                    placeholder="valeur résultat" className="flex-1 min-w-0"
                />
            </div>
        </div>
    )
}


export function ConditionalColumnStepUI({ step, availableCols, fetchDistinctValues, onChange }: {
    step: ConditionalColumnStep; availableCols: string[]
    fetchDistinctValues?: (col: string, sl: number, fl: number) => Promise<{ values: string[]; hasMore: boolean }>
    onChange: (s: ConditionalColumnStep) => void
}) {
    const rules = step.rules ?? []

    function updateRule(i: number, r: ConditionalRule) {
        onChange({ ...step, rules: rules.map((x, idx) => idx === i ? r : x) })
    }

    function addRule() {
        const newRule: ConditionalRule = {
            when: { items: [{ kind: 'cond', cond: { column: availableCols[0] ?? '', op: '=', value: '', valueKind: 'literal' } }], logicOp: 'AND' },
            then: '', thenKind: 'literal',
        }
        onChange({ ...step, rules: [...rules, newRule] })
    }

    return (
        <div className="flex flex-col gap-2">
            {/* Nom de la nouvelle colonne */}
            <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground shrink-0">Nom de la colonne</span>
                <TxtInput
                    value={step.newColumn ?? ''} onChange={v => onChange({ ...step, newColumn: v })}
                    placeholder="nouvelle_colonne" className="flex-1"
                />
            </div>

            {/* Règles WHEN … THEN … */}
            {rules.map((rule, i) => (
                <ConditionalRuleRow key={i}
                    rule={rule} index={i} total={rules.length}
                    availableCols={availableCols} fetchDistinctValues={fetchDistinctValues}
                    onChange={r => updateRule(i, r)}
                    onRemove={() => onChange({ ...step, rules: rules.filter((_, idx) => idx !== i) })}
                    onMoveUp={i > 0 ? () => onChange({ ...step, rules: moveArr(rules, i, -1) }) : undefined}
                    onMoveDown={i < rules.length - 1 ? () => onChange({ ...step, rules: moveArr(rules, i, 1) }) : undefined}
                />
            ))}
            <AddRowBtn onClick={addRule} label="+ Règle (WHEN … THEN …)" />

            {/* Valeur SINON */}
            <div className="flex items-center gap-1 border border-dashed border-border rounded p-2">
                <span className="text-xs font-semibold text-muted-foreground shrink-0 w-12">SINON</span>
                <VarInput
                    value={step.elseValue ?? ''} valueKind={step.elseKind ?? 'literal'}
                    onChange={(v, k) => onChange({ ...step, elseValue: v, elseKind: k })}
                    availableCols={availableCols}
                    fetchDistinctValues={fetchDistinctValues}
                    placeholder="NULL si vide" className="flex-1 min-w-0"
                />
            </div>
        </div>
    )
}

// ─── useStepInputSchemas ──────────────────────────────────────────────────────
// Récupère le schéma réel en entrée de chaque step.
// Stratégie : lit d'abord la table temp déjà matérialisée par useStepEyeData
// (makeTableRef(cellId, N-1)), fallback sur une requête SQL LIMIT 0.

