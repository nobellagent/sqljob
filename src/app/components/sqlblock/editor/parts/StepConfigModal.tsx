import {useEffect} from 'react'
import {createPortal} from 'react-dom'
import {getAutoCteName} from '../../../../../lib/SqlBlockService'
import {STEP_LABELS} from '../../../../../lib/SqlBlockTypes'
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
import {StepItem} from './StepItem'

export function StepConfigModal({ step, index, availableCols, availableColTypes, onUpdate, onClose, fetchDistinctValues, otherStepNames }: {
    step: SqlBlockStep; index: number
    availableCols: string[]; availableColTypes: Record<string, string>
    onUpdate: (idx: number, s: SqlBlockStep) => void
    onClose: () => void
    fetchDistinctValues?: (col: string, selectLimit: number, fromLimit?: number) => Promise<{ values: string[]; hasMore: boolean }>
    otherStepNames: string[]
}) {
    // Fermeture sur Échap
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
        document.addEventListener('keydown', handler)
        return () => document.removeEventListener('keydown', handler)
    }, [onClose])

    const nameValue = step.name ?? ''
    const descValue = step.description ?? ''
    const nameConflict = nameValue.trim() !== '' && otherStepNames.includes(nameValue.trim())

    return createPortal(
        <div className="fixed inset-0 z-[9998] flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            {/* Modale */}
            <div className="relative z-10 bg-popover border border-border rounded-xl shadow-2xl w-full max-w-lg mx-4 h-[96vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
                    <span className="text-xs text-muted-foreground font-mono w-5">{index + 1}.</span>
                    <span className="font-semibold text-sm flex-1">{STEP_LABELS[step.type]}</span>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground w-6 h-6 flex items-center justify-center rounded hover:bg-muted text-lg leading-none">×</button>
                </div>
                {/* Corps — scrollable */}
                <div className="overflow-y-auto px-4 py-4 flex-1 flex flex-col gap-4">
                    {/* Nom et description */}
                    <div className="flex flex-col gap-2 pb-3 border-b border-border">
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Nom de la sous-requête</label>
                            <input
                                type="text"
                                value={nameValue}
                                onChange={e => onUpdate(index, { ...step, name: e.target.value || undefined })}
                                placeholder={`${getAutoCteName(step, index)} (auto)`}
                                className={`w-full px-2 py-1 text-xs border rounded bg-background font-mono ${nameConflict ? 'border-destructive' : 'border-border'}`}
                                spellCheck={false}
                            />
                            {nameConflict && (
                                <p className="text-xs text-destructive mt-0.5">Ce nom est déjà utilisé par un autre step.</p>
                            )}
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Description</label>
                            <textarea
                                value={descValue}
                                onChange={e => onUpdate(index, { ...step, description: e.target.value || undefined })}
                                placeholder="Description de cette étape…"
                                rows={2}
                                className="w-full px-2 py-1 text-xs border border-border rounded bg-background resize-none"
                            />
                        </div>
                    </div>
                    {/* Config spécifique au type de step */}
                    <div>
                        {step.type === 'select_columns' && <SelectColumnsStepUI step={step} availableCols={availableCols} onChange={s => onUpdate(index, s)} />}
                        {step.type === 'exclude_columns' && <ExcludeColumnsStepUI step={step} availableCols={availableCols} onChange={s => onUpdate(index, s)} />}
                        {step.type === 'change_type' && <ChangeTypeStepUI step={step} availableCols={availableCols} availableColTypes={availableColTypes} onChange={s => onUpdate(index, s)} />}
                        {step.type === 'filter_rows' && <FilterRowsStepUI step={step} availableCols={availableCols} onChange={s => onUpdate(index, s)} fetchDistinctValues={fetchDistinctValues} />}
                        {step.type === 'sort' && <SortStepUI step={step} availableCols={availableCols} onChange={s => onUpdate(index, s)} />}
                        {step.type === 'top_n' && <TopNStepUI step={step} onChange={s => onUpdate(index, s)} />}
                        {step.type === 'rename_columns' && <RenameColumnsStepUI step={step} availableCols={availableCols} onChange={s => onUpdate(index, s)} />}
                        {step.type === 'derive' && <DeriveStepUI step={step} availableCols={availableCols} onChange={s => onUpdate(index, s)} />}
                        {step.type === 'fill_null' && <FillNullStepUI step={step} availableCols={availableCols} onChange={s => onUpdate(index, s)} />}
                        {step.type === 'group_by' && <GroupByStepUI step={step} availableCols={availableCols} onChange={s => onUpdate(index, s)} />}
                        {step.type === 'join' && <JoinStepUI step={step} availableCols={availableCols} onChange={s => onUpdate(index, s)} />}
                        {step.type === 'union' && <UnionStepUI step={step} onChange={s => onUpdate(index, s)} />}
                        {step.type === 'pivot' && <PivotStepUI step={step} availableCols={availableCols} onChange={s => onUpdate(index, s)} />}
                        {step.type === 'unpivot' && <UnpivotStepUI step={step} availableCols={availableCols} onChange={s => onUpdate(index, s)} />}
                        {step.type === 'window' && <WindowStepUI step={step} availableCols={availableCols} onChange={s => onUpdate(index, s)} />}
                        {step.type === 'unnest' && <UnnestStepUI step={step} availableCols={availableCols} onChange={s => onUpdate(index, s)} />}
                        {step.type === 'json_extract' && <JsonExtractStepUI step={step} availableCols={availableCols} onChange={s => onUpdate(index, s)} />}
                        {step.type === 'date_trunc' && <DateTruncStepUI step={step} availableCols={availableCols} onChange={s => onUpdate(index, s)} />}
                        {step.type === 'custom_sql' && <CustomSqlStepUI step={step} onChange={s => onUpdate(index, s)} />}
                        {step.type === 'conditional_column' && <ConditionalColumnStepUI step={step} availableCols={availableCols} fetchDistinctValues={fetchDistinctValues} onChange={s => onUpdate(index, s)} />}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    )
}

// ─── StepItem ─────────────────────────────────────────────────────────────────


