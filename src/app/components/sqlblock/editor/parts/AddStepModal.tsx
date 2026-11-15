import {useState, useRef, useEffect} from 'react'
import {createPortal} from 'react-dom'
import {SqlMonacoEditor} from '@sqlrooms/sql-editor'
import {getAutoCteName} from '../../../../../lib/SqlBlockService'
import {STEP_LABELS, STEP_CATEGORIES} from '../../../../../lib/SqlBlockTypes'
import type {SqlBlockStep} from '../../../../../lib/SqlBlockTypes'
import {ExcludeColumnsStepUI, SelectColumnsStepUI} from '../steps/selectColumns'
import {ChangeTypeStepUI} from '../steps/changeType'
import {FilterRowsStepUI} from '../filters'
import {SortStepUI} from '../steps/sort'
import {TopNStepUI} from '../steps/topN'
import {RenameColumnsStepUI} from '../steps/rename'
import {DeriveStepUI} from '../steps/derive'
import {FillNullStepUI} from '../steps/fillNull'
import {GroupByStepUI} from '../steps/groupBy'
import {JoinStepUI} from '../steps/join'
import {UnionStepUI} from '../steps/union'
import {PivotStepUI} from '../steps/pivot'
import {UnpivotStepUI} from '../steps/unpivot'
import {WindowStepUI} from '../steps/window'
import {UnnestStepUI} from '../steps/unnest'
import {JsonExtractStepUI} from '../steps/jsonExtract'
import {DateTruncStepUI} from '../steps/dateTrunc'
import {CustomSqlStepUI} from '../steps/customSql'
import {ConditionalColumnStepUI} from '../steps/conditional'
import {SqlPreview} from './Preview'

function defaultStep(type: SqlBlockStep['type']): SqlBlockStep {
    switch (type) {
        case 'select_columns':  return { type, columns: [] }
        case 'exclude_columns': return { type, columns: [] }
        case 'change_type':     return { type, changes: [] }
        case 'filter_rows':     return { type, groups: [{ items: [], logicOp: 'AND', negate: false }], groupLogicOp: 'OR' }
        case 'sort':            return { type, keys: [] }
        case 'top_n':           return { type, mode: 'limit', n: 100 }
        case 'rename_columns':  return { type, renames: [] }
        case 'derive':          return { type, columns: [] }
        case 'fill_null':       return { type, fills: [] }
        case 'group_by':        return { type, groupCols: [], aggregations: [] }
        case 'join':            return { type, rightTable: '', joinType: 'left', on: [], selectRight: '*' }
        case 'union':           return { type, table: '', mode: 'all' }
        case 'pivot':           return { type, onColumn: '', valueColumn: '', valueFn: 'SUM', groupCols: [] }
        case 'unpivot':         return { type, columns: [], nameCol: 'category', valueCol: 'value' }
        case 'window':          return { type, columns: [] }
        case 'unnest':          return { type, column: '', alias: 'item', keepEmpty: false }
        case 'json_extract':    return { type, column: '', extractions: [] }
        case 'date_trunc':      return { type, column: '', granularity: 'month', mode: 'replace' }
        case 'custom_sql':          return { type, sql: 'SELECT * FROM {{subquery}}' }
        case 'conditional_column':  return { type, newColumn: 'nouvelle_colonne', rules: [], elseValue: '', elseKind: 'literal' }
    }
}



export function AddStepModal({ onAdd, availableCols, availableColTypes, fetchDistinctValues, otherStepNames, stepIndex, onOpen }: {
    onAdd: (step: SqlBlockStep) => void
    availableCols: string[]; availableColTypes: Record<string, string>
    fetchDistinctValues?: (col: string, selectLimit: number, fromLimit: number) => Promise<{ values: string[]; hasMore: boolean }>
    otherStepNames: string[]
    stepIndex: number
    onOpen?: () => void
}) {
    const [open, setOpen] = useState(false)
    const [selectedType, setSelectedType] = useState<string | null>(null)
    const [draftStep, setDraftStep] = useState<SqlBlockStep | null>(null)
    const [search, setSearch] = useState('')
    const searchRef = useRef<HTMLInputElement>(null)

    function handleOpen() {
        setOpen(true)
        setSelectedType(null)
        setDraftStep(null)
        setSearch('')
        onOpen?.()
        setTimeout(() => searchRef.current?.focus(), 50)
    }

    function handleClose() { setOpen(false) }

    function handleSelectType(type: string) {
        setSelectedType(type)
        setDraftStep(defaultStep(type as any) as SqlBlockStep)
    }

    function handleDraftUpdate(_idx: number, s: SqlBlockStep) { setDraftStep(s) }

    function handleConfirm() {
        if (draftStep) { onAdd(draftStep); setOpen(false) }
    }

    useEffect(() => {
        if (!open) return
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape') {
                if (selectedType) { setSelectedType(null); setDraftStep(null) }
                else setOpen(false)
            }
        }
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [open, selectedType])

    const q = search.toLowerCase().trim()
    const filteredCats = q
        ? [{ label: 'Résultats', steps: STEP_CATEGORIES.flatMap(c => c.steps).filter(t => STEP_LABELS[t].toLowerCase().includes(q)) }]
        : STEP_CATEGORIES

    const nameConflict = !!(draftStep?.name?.trim() && otherStepNames.includes(draftStep.name.trim()))

    return (
        <>
            <button onClick={handleOpen}
                className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded border border-dashed border-border hover:border-primary hover:text-primary text-xs text-muted-foreground transition-colors">
                + Ajouter une étape
            </button>
            {open && createPortal(
                <div className="fixed inset-0 z-[9998] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
                    <div className="relative z-10 bg-popover border border-border rounded-xl shadow-2xl w-full max-w-lg mx-4 h-[96vh] flex flex-col">

                        {/* Header */}
                        <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
                            {selectedType && (
                                <button onClick={() => { setSelectedType(null); setDraftStep(null) }}
                                    className="text-muted-foreground hover:text-foreground text-sm px-1 leading-none" title="Changer de type">←</button>
                            )}
                            <span className="font-semibold text-sm flex-1">
                                {selectedType ? STEP_LABELS[selectedType] : 'Ajouter une étape'}
                            </span>
                            <button onClick={handleClose}
                                className="text-muted-foreground hover:text-foreground w-6 h-6 flex items-center justify-center rounded hover:bg-muted text-lg leading-none">×</button>
                        </div>

                        {!selectedType ? (
                            /* ── Phase 1 : sélection du type ── */
                            <>
                                <div className="px-2 py-2 border-b border-border bg-muted/30 shrink-0">
                                    <input ref={searchRef} value={search} onChange={e => setSearch(e.target.value)}
                                        placeholder="Filtrer les traitements…"
                                        className="w-full h-6 rounded border border-border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                        onKeyDown={e => {
                                            if (e.key === 'Enter' && filteredCats[0]?.steps[0]) handleSelectType(filteredCats[0].steps[0])
                                        }}
                                    />
                                </div>
                                <div className="overflow-y-auto flex-1">
                                    {filteredCats.map(cat => (
                                        <div key={cat.label}>
                                            {(!q || cat.steps.length > 0) && (
                                                <div className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide bg-muted/50 border-b border-border sticky top-0">
                                                    {cat.label}
                                                </div>
                                            )}
                                            {cat.steps.map(type => (
                                                <button key={type}
                                                    className="w-full text-left px-3 py-1.5 hover:bg-muted transition-colors flex items-center gap-2"
                                                    onClick={() => handleSelectType(type)}>
                                                    <span className="text-xs font-medium flex-1">{STEP_LABELS[type]}</span>
                                                </button>
                                            ))}
                                            {q && cat.steps.length === 0 && (
                                                <div className="px-3 py-2 text-xs text-muted-foreground italic">Aucun résultat</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : draftStep ? (
                            /* ── Phase 2 : configuration ── */
                            <>
                                <div className="overflow-y-auto px-4 py-4 flex-1 flex flex-col gap-4">
                                    {/* Nom et description */}
                                    <div className="flex flex-col gap-2 pb-3 border-b border-border">
                                        <div>
                                            <label className="text-xs text-muted-foreground mb-1 block">Nom de la sous-requête</label>
                                            <input type="text"
                                                value={draftStep.name ?? ''}
                                                onChange={e => setDraftStep({ ...draftStep, name: e.target.value || undefined })}
                                                placeholder={`${getAutoCteName(draftStep, stepIndex)} (auto)`}
                                                className={`w-full px-2 py-1 text-xs border rounded bg-background font-mono ${nameConflict ? 'border-destructive' : 'border-border'}`}
                                                spellCheck={false}
                                            />
                                            {nameConflict && <p className="text-xs text-destructive mt-0.5">Ce nom est déjà utilisé par un autre step.</p>}
                                        </div>
                                        <div>
                                            <label className="text-xs text-muted-foreground mb-1 block">Description</label>
                                            <textarea
                                                value={draftStep.description ?? ''}
                                                onChange={e => setDraftStep({ ...draftStep, description: e.target.value || undefined })}
                                                placeholder="Description de cette étape…"
                                                rows={2}
                                                className="w-full px-2 py-1 text-xs border border-border rounded bg-background resize-none"
                                            />
                                        </div>
                                    </div>
                                    {/* Config spécifique au type */}
                                    <div>
                                        {draftStep.type === 'select_columns' && <SelectColumnsStepUI step={draftStep} availableCols={availableCols} onChange={s => handleDraftUpdate(0, s)} />}
                                        {draftStep.type === 'exclude_columns' && <ExcludeColumnsStepUI step={draftStep} availableCols={availableCols} onChange={s => handleDraftUpdate(0, s)} />}
                                        {draftStep.type === 'change_type' && <ChangeTypeStepUI step={draftStep} availableCols={availableCols} availableColTypes={availableColTypes} onChange={s => handleDraftUpdate(0, s)} />}
                                        {draftStep.type === 'filter_rows' && <FilterRowsStepUI step={draftStep} availableCols={availableCols} onChange={s => handleDraftUpdate(0, s)} fetchDistinctValues={fetchDistinctValues} />}
                                        {draftStep.type === 'sort' && <SortStepUI step={draftStep} availableCols={availableCols} onChange={s => handleDraftUpdate(0, s)} />}
                                        {draftStep.type === 'top_n' && <TopNStepUI step={draftStep} onChange={s => handleDraftUpdate(0, s)} />}
                                        {draftStep.type === 'rename_columns' && <RenameColumnsStepUI step={draftStep} availableCols={availableCols} onChange={s => handleDraftUpdate(0, s)} />}
                                        {draftStep.type === 'derive' && <DeriveStepUI step={draftStep} availableCols={availableCols} onChange={s => handleDraftUpdate(0, s)} />}
                                        {draftStep.type === 'fill_null' && <FillNullStepUI step={draftStep} availableCols={availableCols} onChange={s => handleDraftUpdate(0, s)} />}
                                        {draftStep.type === 'group_by' && <GroupByStepUI step={draftStep} availableCols={availableCols} onChange={s => handleDraftUpdate(0, s)} />}
                                        {draftStep.type === 'join' && <JoinStepUI step={draftStep} availableCols={availableCols} onChange={s => handleDraftUpdate(0, s)} />}
                                        {draftStep.type === 'union' && <UnionStepUI step={draftStep} onChange={s => handleDraftUpdate(0, s)} />}
                                        {draftStep.type === 'pivot' && <PivotStepUI step={draftStep} availableCols={availableCols} onChange={s => handleDraftUpdate(0, s)} />}
                                        {draftStep.type === 'unpivot' && <UnpivotStepUI step={draftStep} availableCols={availableCols} onChange={s => handleDraftUpdate(0, s)} />}
                                        {draftStep.type === 'window' && <WindowStepUI step={draftStep} availableCols={availableCols} onChange={s => handleDraftUpdate(0, s)} />}
                                        {draftStep.type === 'unnest' && <UnnestStepUI step={draftStep} availableCols={availableCols} onChange={s => handleDraftUpdate(0, s)} />}
                                        {draftStep.type === 'json_extract' && <JsonExtractStepUI step={draftStep} availableCols={availableCols} onChange={s => handleDraftUpdate(0, s)} />}
                                        {draftStep.type === 'date_trunc' && <DateTruncStepUI step={draftStep} availableCols={availableCols} onChange={s => handleDraftUpdate(0, s)} />}
                                        {draftStep.type === 'custom_sql' && <CustomSqlStepUI step={draftStep} onChange={s => handleDraftUpdate(0, s)} />}
                                        {draftStep.type === 'conditional_column' && <ConditionalColumnStepUI step={draftStep} availableCols={availableCols} fetchDistinctValues={fetchDistinctValues} onChange={s => handleDraftUpdate(0, s)} />}
                                    </div>
                                </div>
                                {/* Footer */}
                                <div className="px-4 py-3 border-t border-border flex justify-end gap-2 shrink-0">
                                    <button onClick={handleClose}
                                        className="px-3 py-1.5 text-xs rounded border border-border hover:bg-muted transition-colors">
                                        Annuler
                                    </button>
                                    <button onClick={handleConfirm} disabled={nameConflict}
                                        className="px-3 py-1.5 text-xs rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
                                        Ajouter l'étape
                                    </button>
                                </div>
                            </>
                        ) : null}
                    </div>
                </div>,
                document.body
            )}
        </>
    )
}

// ─── SqlPreview (avec SqlMonacoEditor) ────────────────────────────────────────


