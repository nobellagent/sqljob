import type {FilterRowsStep, FilterGroup, FilterCondition, FilterOp} from '../../../../lib/SqlBlockTypes'
import {AddRowBtn, ColSelect, MoveBtns, RemoveBtn} from './ui'
import {DistinctMultiInput} from './distinct'
import {VarInput} from './varInput'

const FILTER_OPS: { op: FilterOp; label: string }[] = [
    { op: '=', label: '=' }, { op: '!=', label: '≠' },
    { op: '>', label: '>' }, { op: '<', label: '<' },
    { op: '>=', label: '≥' }, { op: '<=', label: '≤' },
    { op: 'in', label: 'IN' }, { op: 'not_in', label: 'NOT IN' },
    { op: 'is_null', label: 'IS NULL' }, { op: 'not_null', label: 'NOT NULL' },
    { op: 'like', label: 'LIKE' }, { op: 'ilike', label: 'ILIKE' },
    { op: 'between', label: 'BETWEEN' },
]


function FilterConditionRow({ cond, availableCols, onChange, onRemove, onMoveUp, onMoveDown, fetchDistinctValues }: {
    cond: FilterCondition; availableCols: string[]
    onChange: (patch: Partial<FilterCondition>) => void
    onRemove: () => void
    onMoveUp?: () => void
    onMoveDown?: () => void
    fetchDistinctValues?: (col: string, selectLimit: number, fromLimit: number) => Promise<{ values: string[]; hasMore: boolean }>
}) {
    const noVal = cond.op === 'is_null' || cond.op === 'not_null'
    const isBetween = cond.op === 'between'
    const isMulti = cond.op === 'in' || cond.op === 'not_in'
    return (
        <div className="flex flex-wrap items-center gap-1">
            <ColSelect value={cond.column} cols={availableCols} onChange={v => onChange({ column: v })} className="flex-1 min-w-20" />
            <select className="h-6 rounded border border-border bg-background px-1 text-xs w-24" value={cond.op} onChange={e => {
                const newOp = e.target.value as FilterOp
                const wasMulti = cond.op === 'in' || cond.op === 'not_in'
                const isNowMulti = newOp === 'in' || newOp === 'not_in'
                const patch: Partial<FilterCondition> = { op: newOp }
                if (!wasMulti && isNowMulti && cond.value) patch.values = [cond.value]
                if (wasMulti && !isNowMulti && cond.values?.length) patch.value = cond.values[0]
                onChange(patch)
            }}>
                {FILTER_OPS.map(o => <option key={o.op} value={o.op}>{o.label}</option>)}
            </select>
            {!noVal && !isBetween && !isMulti && (
                <VarInput
                    value={cond.value ?? ''} valueKind={cond.valueKind}
                    onChange={(v, k) => onChange({ value: v, valueKind: k })}
                    availableCols={availableCols} column={cond.column}
                    fetchDistinctValues={fetchDistinctValues}
                    placeholder="valeur" className="flex-1 min-w-16"
                />
            )}
            {isBetween && <>
                <VarInput value={cond.value ?? ''} valueKind={cond.valueKind}
                    onChange={(v, k) => onChange({ value: v, valueKind: k })}
                    availableCols={availableCols} column={cond.column} fetchDistinctValues={fetchDistinctValues}
                    placeholder="de" className="flex-1 min-w-16" />
                <span className="text-xs text-muted-foreground">et</span>
                <VarInput value={cond.valueTo ?? ''} valueKind={cond.valueToKind}
                    onChange={(v, k) => onChange({ valueTo: v, valueToKind: k })}
                    availableCols={availableCols} column={cond.column} fetchDistinctValues={fetchDistinctValues}
                    placeholder="à" className="flex-1 min-w-16" />
            </>}
            {isMulti && (
                <DistinctMultiInput
                    values={cond.values ?? []}
                    onChange={v => onChange({ values: v })}
                    column={cond.column}
                    fetchDistinctValues={fetchDistinctValues}
                    className="flex-1 min-w-32"
                />
            )}
            <MoveBtns onUp={onMoveUp} onDown={onMoveDown} />
            <RemoveBtn onClick={onRemove} />
        </div>
    )
}

/** Badge AND/OR horizontal séparateur entre groupes de premier niveau */

function LogicOpBadge({ op, onChange }: { op: 'AND' | 'OR'; onChange: (op: 'AND' | 'OR') => void }) {
    return (
        <div className="flex items-center gap-1 my-0.5">
            <div className="flex-1 h-px bg-border" />
            <div className="flex rounded border border-border overflow-hidden text-xs">
                {(['AND', 'OR'] as const).map(o => (
                    <button key={o} onClick={() => onChange(o)}
                        className={`px-2 py-0.5 transition-colors ${op === o ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}>
                        {o}
                    </button>
                ))}
            </div>
            <div className="flex-1 h-px bg-border" />
        </div>
    )
}

/** Normalise un FilterGroup vers le format items[] */

function normalizeFilterGroup(g: FilterGroup): FilterGroup {
    if (g.items !== undefined) return g
    // rétrocompat ancien format conditions[]
    return {
        items: (g.conditions ?? []).map(c => ({ kind: 'cond' as const, cond: c })),
        logicOp: g.logicOp ?? 'AND',
        negate: g.negate,
    }
}

/** Couleurs de border selon profondeur */

const GROUP_DEPTH_COLORS = [
    'border-border',
    'border-blue-500/40',
    'border-purple-500/40',
    'border-amber-500/40',
]

/** Composant récursif : affiche un groupe avec ses items (conditions + sous-groupes) */

export function moveArr(arr: any[], i: number, delta: number) {
    const next = [...arr]
    const j = i + delta
    if (j < 0 || j >= next.length) return next
    ;[next[i], next[j]] = [next[j], next[i]]
    return next
}


export function FilterGroupUI({ group, onUpdate, onRemove, onMoveUp, onMoveDown, availableCols, depth = 0, fetchDistinctValues }: {
    group: FilterGroup
    onUpdate: (g: FilterGroup) => void
    onRemove?: () => void
    onMoveUp?: () => void
    onMoveDown?: () => void
    availableCols: string[]
    depth?: number
    fetchDistinctValues?: (col: string, selectLimit: number, fromLimit?: number) => Promise<{ values: string[]; hasMore: boolean }>
}) {
    const g = normalizeFilterGroup(group)
    const items = g.items ?? []
    const borderCls = GROUP_DEPTH_COLORS[Math.min(depth, GROUP_DEPTH_COLORS.length - 1)]

    function setItems(newItems) {
        onUpdate({ ...g, items: newItems })
    }

    function addCond() {
        setItems([...items, { kind: 'cond', cond: { column: availableCols[0] ?? '', op: '=', value: '' } }])
    }

    function addSubgroup() {
        setItems([...items, { kind: 'group', group: { items: [], logicOp: 'AND', negate: false } }])
    }

    return (
        <div className={`border ${borderCls} rounded p-2 flex flex-col gap-1`}>
            {/* En-tête du groupe : AND/OR | NOT | ▲▼ | ✕ */}
            <div className="flex items-center gap-1 mb-0.5">
                <div className="flex rounded border border-border overflow-hidden text-xs">
                    {(['AND', 'OR'] as const).map(o => (
                        <button key={o} onClick={() => onUpdate({ ...g, logicOp: o })}
                            className={`px-1.5 py-0.5 transition-colors ${g.logicOp === o ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}>
                            {o}
                        </button>
                    ))}
                </div>
                <button onClick={() => onUpdate({ ...g, negate: !g.negate })}
                    title="Inverser le groupe (NOT)"
                    className={`px-1.5 py-0.5 rounded border text-xs font-mono transition-colors ${g.negate
                        ? 'bg-destructive/80 text-destructive-foreground border-destructive'
                        : 'border-border text-muted-foreground hover:bg-muted'}`}>
                    NOT
                </button>
                <span className="flex-1" />
                <MoveBtns onUp={onMoveUp} onDown={onMoveDown} />
                {onRemove && <RemoveBtn onClick={onRemove} />}
            </div>

            {/* Items */}
            {items.map((item, i) => (
                <div key={i}>
                    {i > 0 && (
                        <div className="flex items-center gap-1 py-0.5 px-1">
                            <span className="text-[10px] font-mono font-semibold text-muted-foreground/70 select-none">{g.logicOp}</span>
                        </div>
                    )}
                    {item.kind === 'cond' ? (
                        <FilterConditionRow
                            cond={item.cond}
                            availableCols={availableCols}
                            onChange={patch => setItems(items.map((it, idx) => idx === i ? { kind: 'cond', cond: { ...(it as any).cond, ...patch } } : it))}
                            onRemove={() => setItems(items.filter((_, idx) => idx !== i))}
                            onMoveUp={i > 0 ? () => setItems(moveArr(items, i, -1)) : undefined}
                            onMoveDown={i < items.length - 1 ? () => setItems(moveArr(items, i, 1)) : undefined}
                            fetchDistinctValues={fetchDistinctValues}
                        />
                    ) : (
                        <FilterGroupUI
                            group={item.group}
                            onUpdate={g2 => setItems(items.map((it, idx) => idx === i ? { kind: 'group', group: g2 } : it))}
                            onRemove={() => setItems(items.filter((_, idx) => idx !== i))}
                            onMoveUp={i > 0 ? () => setItems(moveArr(items, i, -1)) : undefined}
                            onMoveDown={i < items.length - 1 ? () => setItems(moveArr(items, i, 1)) : undefined}
                            availableCols={availableCols}
                            depth={depth + 1}
                            fetchDistinctValues={fetchDistinctValues}
                        />
                    )}
                </div>
            ))}

            {items.length === 0 && (
                <p className="text-xs text-muted-foreground italic py-0.5">Aucun filtre</p>
            )}

            {/* Boutons d'ajout */}
            <div className="flex gap-3 mt-0.5">
                <AddRowBtn onClick={addCond} label="+ Condition" />
                <AddRowBtn onClick={addSubgroup} label="+ Sous-groupe" />
            </div>
        </div>
    )
}


export function FilterRowsStepUI({ step, availableCols, onChange, fetchDistinctValues }: { step: FilterRowsStep; availableCols: string[]; onChange: (s: FilterRowsStep) => void; fetchDistinctValues?: (col: string, selectLimit: number, fromLimit?: number) => Promise<{ values: string[]; hasMore: boolean }> }) {
    // Normalise rétrocompat : ancien format conditions[] → groups
    const groups: FilterGroup[] = step.groups?.length
        ? step.groups
        : (step.conditions?.length
            ? [{ items: step.conditions.map(c => ({ kind: 'cond' as const, cond: c })), logicOp: step.logicOp ?? 'AND' }]
            : [{ items: [], logicOp: 'AND' }])

    const groupLogicOp = step.groupLogicOp ?? 'OR'

    function updateGroups(newGroups: FilterGroup[]) {
        onChange({ ...step, groups: newGroups, groupLogicOp, conditions: undefined, logicOp: undefined })
    }

    function addGroup() {
        updateGroups([...groups, { items: [], logicOp: 'AND', negate: false }])
    }

    function removeGroup(gi: number) {
        const next = groups.filter((_, i) => i !== gi)
        updateGroups(next.length ? next : [{ items: [], logicOp: 'AND' }])
    }

    return (
        <div className="flex flex-col gap-2">
            {groups.map((group, gi) => (
                <div key={gi}>
                    {gi > 0 && (
                        <LogicOpBadge op={groupLogicOp} onChange={op => onChange({ ...step, groups, groupLogicOp: op })} />
                    )}
                    <FilterGroupUI
                        group={group}
                        onUpdate={g => updateGroups(groups.map((gr, i) => i === gi ? g : gr))}
                        onRemove={groups.length > 1 ? () => removeGroup(gi) : undefined}
                        onMoveUp={gi > 0 ? () => updateGroups(moveArr(groups, gi, -1)) : undefined}
                        onMoveDown={gi < groups.length - 1 ? () => updateGroups(moveArr(groups, gi, 1)) : undefined}
                        availableCols={availableCols}
                        depth={0}
                        fetchDistinctValues={fetchDistinctValues}
                    />
                </div>
            ))}
            <button onClick={addGroup}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground border border-dashed border-border rounded px-2 py-1 hover:border-primary transition-colors">
                + Ajouter un groupe
            </button>
        </div>
    )
}

