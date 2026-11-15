import {useState, useCallback, useRef, useEffect} from 'react'
import {createPortal} from 'react-dom'
import {SqlMonacoEditor} from '@sqlrooms/sql-editor'
import {DuckDBManager} from '../../../../lib/DuckDBManager'
import {CDNManager} from '../../../../lib/CDNManager'
import {stepSql, getAutoCteName} from '../../../../lib/SqlBlockService'
import {ChartConfigEditor} from '../ChartConfigEditor'
import type {ChartConfig} from '../../../../lib/SqlBlockTypes'
import {STEP_LABELS, STEP_CATEGORIES} from '../../../../lib/SqlBlockTypes'
import type {SqlBlockAst, SqlBlockStep} from '../../../../lib/SqlBlockTypes'
import {makeTableRef} from './session'
import {EyeIcon} from './ui'
import {ExcludeColumnsStepUI, SelectColumnsStepUI} from './steps/selectColumns'
import {ChangeTypeStepUI} from './steps/changeType'
import {FilterRowsStepUI} from './filters'
import {SortStepUI} from './steps/sort'
import {TopNStepUI} from './steps/topN'
import {RenameColumnsStepUI} from './steps/rename'
import {DeriveStepUI} from './steps/derive'
import {FillNullStepUI} from './steps/fillNull'
import {GroupByStepUI} from './steps/groupBy'
import {JoinStepUI} from './steps/join'
import {UnionStepUI} from './steps/union'
import {PivotStepUI} from './steps/pivot'
import {UnpivotStepUI} from './steps/unpivot'
import {WindowStepUI} from './steps/window'
import {UnnestStepUI} from './steps/unnest'
import {JsonExtractStepUI} from './steps/jsonExtract'
import {DateTruncStepUI} from './steps/dateTrunc'
import {CustomSqlStepUI} from './steps/customSql'
import {ConditionalColumnStepUI} from './steps/conditional'

export function truncateCols(items: string[], max = 4): string {
    if (items.length <= max) return items.join(', ')
    return items.slice(0, max).join(', ') + '…'
}


export function stepSummary(step: SqlBlockStep): string {
    switch (step.type) {
        case 'select_columns':  return step.columns.length ? truncateCols(step.columns) : '—'
        case 'exclude_columns': return step.columns.length ? truncateCols(step.columns) : '—'
        case 'rename_columns':  return step.renames.length ? truncateCols(step.renames.map(r => `${r.from}→${r.to}`)) : '—'
        case 'change_type':     return step.changes.length ? truncateCols(step.changes.map(c => `${c.column}:${c.targetType}`)) : '—'
        case 'filter_rows': {
            const groups = step.groups?.length ? step.groups : (step.conditions?.length ? [{ items: step.conditions.map(c => ({ kind: 'cond', cond: c })) }] : [])
            function countItems(g): number {
                return (g.items ?? g.conditions ?? []).reduce((s, it) => s + (it.kind === 'group' ? countItems(it.group) : 1), 0)
            }
            const n = groups.reduce((s, g) => s + countItems(g), 0)
            const neg = groups.some(g => g.negate)
            return n ? `${n} condition${n > 1 ? 's' : ''}${groups.length > 1 ? ` (${groups.length} groupes)` : ''}${neg ? ' [NOT]' : ''}` : '—'
        }
        case 'sort':            return step.keys.length ? truncateCols(step.keys.map(k => `${k.column} ${k.direction === 'asc' ? '↑' : '↓'}`)) : '—'
        case 'top_n':           return step.mode === 'limit' ? `${step.n} lignes` : `${step.n}% échantillon`
        case 'derive':          return step.columns.length ? truncateCols(step.columns.map(c => c.name)) : '—'
        case 'fill_null':       return step.fills.length ? truncateCols(step.fills.map(f => f.column)) : '—'
        case 'group_by':        return step.groupCols.length ? truncateCols(step.groupCols) : '—'
        case 'join':            return step.rightTable || '—'
        case 'union':           return step.table || '—'
        case 'pivot':           return step.onColumn || '—'
        case 'unpivot':         return step.columns.length ? truncateCols(step.columns) : '—'
        case 'window':          return step.columns.length ? `${step.columns.length} col.` : '—'
        case 'unnest':          return step.column || '—'
        case 'json_extract':    return step.column || '—'
        case 'date_trunc':      return step.column ? `${step.column} → ${step.granularity}` : '—'
        case 'custom_sql':           return step.sql ? step.sql.slice(0, 40).replace(/\n/g, ' ') + (step.sql.length > 40 ? '…' : '') : '—'
        case 'conditional_column':   return step.newColumn ? `→ ${step.newColumn}` : '—'
        default:                return ''
    }
}

// ─── CustomSqlStepUI ──────────────────────────────────────────────────────────


export interface DynamicSchema { columns: string[]; colTypes: Record<string, string> }


export function useStepInputSchemas(ast: SqlBlockAst, cellId: string) {
    const [dynamicSchemas, setDynamicSchemas] = useState<Record<number, DynamicSchema>>({})
    const cacheRef = useRef<Map<string, DynamicSchema>>(new Map())
    const astRef = useRef(ast)
    astRef.current = ast

    const fetchSchemaForStep = useCallback(async (stepIdx: number) => {
        // Toujours travailler sur un AST sans chartConfig : le SELECT final avec
        // annotations (CAST(x AS XAXIS)…) ne doit jamais polluer les schémas des étapes.
        const a = { ...astRef.current, chartConfig: undefined }
        if (!a.source) return
        const cacheKey = JSON.stringify({ src: a.source, steps: a.steps.slice(0, stepIdx) })

        const cached = cacheRef.current.get(cacheKey)
        if (cached) {
            setDynamicSchemas(prev => ({ ...prev, [stepIdx]: cached }))
            return
        }

        try {
            let schemaTypes: Record<string, string> | undefined

            // 1. Essaie la table temp déjà matérialisée (makeTableRef(cellId, stepIdx-1))
            //    Elle existe si la matérialisation proactive a tourné.
            if (stepIdx > 0) {
                const tRef = makeTableRef(cellId, stepIdx - 1)
                try {
                    const conn = DuckDBManager.getConnection()
                    if (conn) {
                        const result = await conn.query(`SELECT * FROM ${tRef} LIMIT 0`)
                        schemaTypes = {}
                        for (const field of result.schema.fields) {
                            schemaTypes[field.name] = String(field.type)
                        }
                    }
                } catch { /* table pas encore créée → fallback */ }
            }

            // 2. Fallback : LIMIT 0 directement sur le SQL amont (sans wrapper subquery)
            if (!schemaTypes) {
                const inputSql = stepSql(a, stepIdx - 1)
                if (!inputSql) return
                const bare = inputSql.trimEnd().replace(/;+\s*$/, '')
                const hasLimit = /\bLIMIT\s+\d/i.test(bare.replace(/\([\s\S]*?\)/g, ''))
                const sql0 = hasLimit ? bare : `${bare}\nLIMIT 0`
                const conn = DuckDBManager.getConnection()
                if (!conn) return
                const result = await conn.query(sql0)
                for (const field of result.schema.fields) {
                    if (!schemaTypes) schemaTypes = {}
                    schemaTypes[field.name] = String(field.type)
                }
            }

            if (!schemaTypes) return
            const result: DynamicSchema = { columns: Object.keys(schemaTypes), colTypes: schemaTypes }
            cacheRef.current.set(cacheKey, result)
            setDynamicSchemas(prev => ({ ...prev, [stepIdx]: result }))
        } catch (err) {
            console.warn('[sqlblock input-schema]', err)
        }
    }, [cellId])

    /** Invalide le cache ET l'état dynamicSchemas pour les steps >= dirtyFromStep */
    const invalidateFrom = useCallback((dirtyFromStep: number, a: SqlBlockAst) => {
        for (const [key] of cacheRef.current) {
            try {
                const parsed = JSON.parse(key) as { src: string; steps: unknown[] }
                if (parsed.src !== a.source || parsed.steps.length >= dirtyFromStep)
                    cacheRef.current.delete(key)
            } catch { cacheRef.current.delete(key) }
        }
        // Purge aussi le state React pour éviter d'afficher des données périmées
        setDynamicSchemas(prev => {
            const next: Record<number, DynamicSchema> = {}
            for (const [k, v] of Object.entries(prev)) {
                if (Number(k) < dirtyFromStep) next[Number(k)] = v
            }
            return next
        })
    }, [])

    return { dynamicSchemas, fetchSchemaForStep, invalidateFrom }
}




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


export function StepItem({ step, index, totalSteps, availableCols, availableColTypes,
    eyeOpen, eyeLoading, onEyeToggle,
    onUpdate, onRemove, onMove,
    configOpen, onConfigOpen, onConfigClose, fetchDistinctValues, otherStepNames }: {
    step: SqlBlockStep; index: number; totalSteps: number
    availableCols: string[]; availableColTypes: Record<string, string>
    eyeOpen: boolean; eyeLoading: boolean
    onEyeToggle: () => void
    onUpdate: (idx: number, s: SqlBlockStep) => void
    onRemove: (idx: number) => void
    onMove: (idx: number, dir: -1 | 1) => void
    configOpen: boolean
    onConfigOpen: () => void
    onConfigClose: () => void
    fetchDistinctValues?: (col: string, selectLimit: number, fromLimit?: number) => Promise<{ values: string[]; hasMore: boolean }>
    otherStepNames: string[]
}) {
    const [pendingDelete, setPendingDelete] = useState(false)
    const summary = stepSummary(step)
    const customName = step.name?.trim()
    const hasDesc = !!step.description?.trim()

    return (
        <>
            <div className="border border-border rounded bg-card text-card-foreground">
                <div className="flex items-center gap-1.5 px-2 py-1.5 select-none">

                    {/* Bouton œil */}
                    <button
                        onClick={e => { e.stopPropagation(); onEyeToggle() }}
                        className={`shrink-0 w-5 h-5 flex items-center justify-center rounded transition-colors ${eyeOpen ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                        title={eyeOpen ? 'Masquer l\'aperçu' : 'Voir l\'aperçu de cette étape'}
                    >
                        {eyeLoading && eyeOpen
                            ? <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                            : <EyeIcon open={eyeOpen} className="w-3.5 h-3.5" />
                        }
                    </button>

                    <span className="text-xs text-muted-foreground font-mono w-4 shrink-0">{index + 1}.</span>
                    {/* Nom + résumé — clic ouvre la config */}
                    <button className="flex-1 text-left min-w-0" onClick={onConfigOpen}>
                        <div className="flex items-center gap-1 flex-wrap">
                            <span className="text-xs font-medium">{STEP_LABELS[step.type]}</span>
                            {customName && (
                                <span className="text-[10px] font-mono text-primary/80 bg-primary/10 px-1 rounded leading-4 shrink-0" title="Nom de la sous-requête">{customName}</span>
                            )}
                            {hasDesc && !customName && (
                                <span className="text-muted-foreground opacity-60" title={step.description}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                                </span>
                            )}
                        </div>
                        {hasDesc ? (
                            <span className="block text-xs text-muted-foreground truncate italic">{step.description}</span>
                        ) : (
                            summary && summary !== '—' && (
                                <span className="block text-xs text-muted-foreground truncate">{summary}</span>
                            )
                        )}
                    </button>

                    <div className="flex items-center gap-0.5 ml-1 shrink-0">
                        {pendingDelete ? (
                            <div className="flex items-center gap-1">
                                <span className="text-xs text-destructive">Supprimer ?</span>
                                <button onClick={() => { onRemove(index); setPendingDelete(false) }}
                                    className="px-1.5 h-5 rounded bg-destructive text-destructive-foreground text-xs">Oui</button>
                                <button onClick={() => setPendingDelete(false)}
                                    className="px-1.5 h-5 rounded border border-border text-xs text-muted-foreground hover:text-foreground">Non</button>
                            </div>
                        ) : (
                            <>
                                {/* Roue crantée — ouvre la modale de config */}
                                <button onClick={onConfigOpen}
                                    className="text-muted-foreground hover:text-foreground w-6 h-6 flex items-center justify-center rounded hover:bg-muted transition-colors"
                                    title="Configurer ce step">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                                    </svg>
                                </button>
                                <button onClick={() => onMove(index, -1)} disabled={index === 0}
                                    className="text-muted-foreground hover:text-foreground disabled:opacity-30 w-5 h-5 flex items-center justify-center text-xs" title="Monter">▲</button>
                                <button onClick={() => onMove(index, 1)} disabled={index === totalSteps - 1}
                                    className="text-muted-foreground hover:text-foreground disabled:opacity-30 w-5 h-5 flex items-center justify-center text-xs" title="Descendre">▼</button>
                                <button onClick={() => setPendingDelete(true)}
                                    className="text-destructive hover:text-destructive/80 w-5 h-5 flex items-center justify-center text-xs" title="Supprimer ce step">✕</button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {configOpen && (
                <StepConfigModal step={step} index={index}
                    availableCols={availableCols} availableColTypes={availableColTypes}
                    onUpdate={onUpdate} onClose={onConfigClose}
                    fetchDistinctValues={fetchDistinctValues}
                    otherStepNames={otherStepNames} />
            )}
        </>
    )
}

// ─── SourceStepItem / SourceConfigModal ───────────────────────────────────────


export function SourceConfigModal({ source, tables, disabled, onChange, onClose }: {
    source: string; tables: string[]; disabled: boolean
    onChange: (v: string) => void; onClose: () => void
}) {
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
        document.addEventListener('keydown', handler)
        return () => document.removeEventListener('keydown', handler)
    }, [onClose])

    return createPortal(
        <div className="fixed inset-0 z-[9998] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative z-10 bg-popover border border-border rounded-xl shadow-2xl w-full max-w-sm mx-4 flex flex-col">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
                    <span className="font-semibold text-sm flex-1">Source</span>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground w-6 h-6 flex items-center justify-center rounded hover:bg-muted text-lg leading-none">×</button>
                </div>
                <div className="px-4 py-4">
                    <select
                        value={source || ''}
                        onChange={e => { onChange(e.target.value); onClose() }}
                        disabled={disabled}
                        size={Math.min(tables.length + (source && !tables.includes(source) ? 1 : 0), 12)}
                        className="w-full text-xs font-mono border border-border rounded bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                        {!source && <option value="" disabled>— choisir une source —</option>}
                        {tables.map(t => <option key={t} value={t}>{t}</option>)}
                        {source && !tables.includes(source) && <option value={source}>{source}</option>}
                    </select>
                </div>
            </div>
        </div>,
        document.body
    )
}


export function SourceStepItem({ eyeOpen, onEyeToggle, source, configOpen, onConfigOpen, onConfigClose, tables, disabled, onSourceChange }: {
    eyeOpen: boolean; onEyeToggle: () => void
    source: string; configOpen: boolean; onConfigOpen: () => void; onConfigClose: () => void
    tables: string[]; disabled: boolean; onSourceChange: (v: string) => void
}) {
    return (
        <>
            <div className="border border-border rounded bg-card text-card-foreground">
                <div className="flex items-center gap-1.5 px-2 py-1.5 select-none">
                    <button
                        onClick={e => { e.stopPropagation(); onEyeToggle() }}
                        className={`shrink-0 w-5 h-5 flex items-center justify-center rounded transition-colors ${eyeOpen ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                        title={eyeOpen ? "Masquer l'aperçu source" : "Voir l'aperçu source"}
                    >
                        <EyeIcon open={eyeOpen} className="w-3.5 h-3.5" />
                    </button>
                    <button className="flex-1 text-left min-w-0" onClick={onConfigOpen}>
                        <div className="flex items-center gap-1">
                            <span className="text-xs font-medium">Source</span>
                            {source && (
                                <span className="text-[10px] font-mono text-primary/80 bg-primary/10 px-1 rounded leading-4 shrink-0 truncate max-w-[120px]">{source}</span>
                            )}
                        </div>
                        {!source && <span className="block text-xs text-muted-foreground italic">— choisir une source —</span>}
                    </button>
                    <button onClick={onConfigOpen}
                        className="text-muted-foreground hover:text-foreground w-6 h-6 flex items-center justify-center rounded hover:bg-muted transition-colors"
                        title="Changer la source">
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                        </svg>
                    </button>
                </div>
            </div>
            {configOpen && (
                <SourceConfigModal
                    source={source} tables={tables} disabled={disabled}
                    onChange={onSourceChange} onClose={onConfigClose}
                />
            )}
        </>
    )
}

// ─── VizStepItem / VizConfigModal ─────────────────────────────────────────────


export function VizConfigModal({ chartConfig, availableColumns, availableColTypes, onMount, onChange, onClose, eyeOpen, onEyeToggle }: {
    chartConfig: ChartConfig | undefined
    availableColumns: string[]; availableColTypes: Record<string, string>
    onMount: () => void
    onChange: (cfg: ChartConfig | null) => void
    onClose: () => void
    eyeOpen: boolean; onEyeToggle: () => void
}) {
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
        document.addEventListener('keydown', handler)
        return () => document.removeEventListener('keydown', handler)
    }, [onClose])

    return createPortal(
        <div className="fixed inset-0 z-[9998] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative z-10 bg-popover border border-border rounded-xl shadow-2xl w-full max-w-lg mx-4 h-[96vh] flex flex-col">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
                    <span className="font-semibold text-sm flex-1">Visualisation</span>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground w-6 h-6 flex items-center justify-center rounded hover:bg-muted text-lg leading-none">×</button>
                </div>
                <div className="overflow-y-auto px-4 py-4 flex-1">
                    <ChartConfigEditor
                        chartConfig={chartConfig}
                        availableColumns={availableColumns}
                        availableColTypes={availableColTypes}
                        onMount={onMount}
                        onChange={onChange}
                        eyeOpen={eyeOpen}
                        onEyeToggle={onEyeToggle}
                    />
                </div>
            </div>
        </div>,
        document.body
    )
}


export function VizStepItem({ eyeOpen, onEyeToggle, configOpen, onConfigOpen, onConfigClose, chartConfig, availableColumns, availableColTypes, onMount, onChange }: {
    eyeOpen: boolean; onEyeToggle: () => void
    configOpen: boolean; onConfigOpen: () => void; onConfigClose: () => void
    chartConfig: ChartConfig | undefined
    availableColumns: string[]; availableColTypes: Record<string, string>
    onMount: () => void
    onChange: (cfg: ChartConfig | null) => void
}) {
    const isActive = !!chartConfig
    const chartType = chartConfig?.chartType

    return (
        <>
            <div className="border border-border rounded bg-card text-card-foreground">
                <div className="flex items-center gap-1.5 px-2 py-1.5 select-none">
                    <button
                        onClick={e => { e.stopPropagation(); onEyeToggle() }}
                        className={`shrink-0 w-5 h-5 flex items-center justify-center rounded transition-colors ${eyeOpen ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                        title={eyeOpen ? "Masquer l'aperçu graphique" : "Afficher l'aperçu graphique"}
                    >
                        <EyeIcon open={eyeOpen} className="w-3.5 h-3.5" />
                    </button>
                    <button className="flex-1 text-left min-w-0" onClick={onConfigOpen}>
                        <div className="flex items-center gap-1">
                            <span className="text-xs font-medium">Visualisation</span>
                            {isActive && chartType && (
                                <span className="text-[10px] font-mono text-primary/80 bg-primary/10 px-1 rounded leading-4 shrink-0">{chartType}</span>
                            )}
                        </div>
                        {!isActive && <span className="block text-xs text-muted-foreground italic">Désactivée</span>}
                    </button>
                    <button onClick={onConfigOpen}
                        className="text-muted-foreground hover:text-foreground w-6 h-6 flex items-center justify-center rounded hover:bg-muted transition-colors"
                        title="Configurer la visualisation">
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                        </svg>
                    </button>
                </div>
            </div>
            {configOpen && (
                <VizConfigModal
                    chartConfig={chartConfig}
                    availableColumns={availableColumns}
                    availableColTypes={availableColTypes}
                    onMount={onMount}
                    onChange={onChange}
                    onClose={onConfigClose}
                    eyeOpen={eyeOpen}
                    onEyeToggle={onEyeToggle}
                />
            )}
        </>
    )
}

// ─── AddStepMenu ──────────────────────────────────────────────────────────────


export function defaultStep(type: SqlBlockStep['type']): SqlBlockStep {
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


export function SqlPreview({ sql, editable, onEdit, tableSchemas, cellId }: {
    sql: string; editable: boolean; onEdit?: (sql: string) => void
    tableSchemas: any[]; cellId: string
}) {
    const [editMode, setEditMode] = useState(false)
    const [draft, setDraft] = useState(sql)

    // Sync en lecture seule
    useEffect(() => { if (!editMode) setDraft(sql) }, [sql, editMode])

    function handleApply() { onEdit?.(draft); setEditMode(false) }
    function handleCancel() { setDraft(sql); setEditMode(false) }

    return (
        <div className="flex flex-col gap-1 flex-1 min-h-0">
            <div className="flex items-center justify-between h-5 shrink-0">
                {editable && !editMode && (
                    <button onClick={() => { setDraft(sql); setEditMode(true) }}
                        className="text-xs text-muted-foreground hover:text-foreground underline">
                        Éditer manuellement…
                    </button>
                )}
                {editMode && (
                    <div className="flex gap-2">
                        <button onClick={handleApply} className="text-xs text-primary underline">Appliquer</button>
                        <button onClick={handleCancel} className="text-xs text-muted-foreground underline">Annuler</button>
                    </div>
                )}
            </div>
            <div className="flex-1 min-h-0">
                <SqlMonacoEditor
                    key={`${cellId}-sql-${editMode ? 'edit' : 'view'}`}
                    value={editMode ? draft : sql}
                    onChange={editMode ? (v) => setDraft(v ?? '') : undefined}
                    tableSchemas={tableSchemas}
                    className="border border-border rounded overflow-hidden h-full"
                    options={{
                        readOnly: !editMode,
                        minimap: { enabled: false },
                        lineNumbers: 'on',
                        scrollBeyondLastLine: false,
                        wordWrap: 'on',
                        fontSize: 12,
                        renderLineHighlight: 'none',
                        overviewRulerLanes: 0,
                        scrollbar: { vertical: 'auto', alwaysConsumeMouseWheel: false },
                    }}
                    height="100%"
                />
            </div>
        </div>
    )
}

// ─── DegradedBanner ───────────────────────────────────────────────────────────


export function DegradedBanner({ onRestore }: { onRestore: () => void }) {
    return (
        <div className="flex items-start gap-2 px-3 py-2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs mb-2">
            <span className="shrink-0 text-base">⚠️</span>
            <div className="flex-1">
                <strong>Mode dégradé</strong> — Le SQL a été édité manuellement et n'est plus compatible avec l'interface visuelle.
            </div>
            <button onClick={onRestore} className="shrink-0 underline hover:no-underline ml-2">
                Tenter la restauration
            </button>
        </div>
    )
}

// ─── IncompatibleConfirmModal ─────────────────────────────────────────────────


export function IncompatibleConfirmModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-background border border-border rounded-lg shadow-xl max-w-md w-full mx-4 p-5">
                <h3 className="text-sm font-semibold mb-2">SQL non compatible avec ce bloc</h3>
                <p className="text-xs text-muted-foreground mb-4">
                    Le SQL saisi ne correspond à aucun des patterns reconnus.
                    Voulez-vous continuer en <strong>mode dégradé</strong> (SQL libre, UI désactivée) ?
                </p>
                <div className="flex justify-end gap-2">
                    <button onClick={onCancel} className="px-3 py-1.5 text-xs rounded border border-border hover:bg-muted">Annuler</button>
                    <button onClick={onConfirm} className="px-3 py-1.5 text-xs rounded bg-amber-500 text-white hover:bg-amber-600">Continuer en mode dégradé</button>
                </div>
            </div>
        </div>
    )
}

// ─── ChartPreviewInEditor — aperçu ECharts/KPI dans le panel dtSection ────────


export function ChartPreviewInEditor({ cell }: { cell: any }) {
    const chartRef = useRef<HTMLDivElement>(null)
    // Ne re-rendre le graphique que si _echartsOption a changé (nouvelle référence produite par runCellAt).
    const lastRenderedOption = useRef<any>(null)

    useEffect(() => {
        if (!chartRef.current || !cell._echartsOption) return
        if (cell._echartsOption === lastRenderedOption.current) return  // aucun changement réel
        lastRenderedOption.current = cell._echartsOption
        CDNManager.loadECharts?.().then(() => {
            const echarts = (window as any).echarts
            if (!echarts || !chartRef.current) return
            let chart = echarts.getInstanceByDom(chartRef.current) || echarts.init(chartRef.current)
            chart.clear()
            chart.setOption(cell._echartsOption)
        })
    }, [cell._echartsOption])

    if (cell._kpiHtml) return (
        <div className="overflow-auto text-center">
            {cell._kpiLabel && <div style={{fontSize:'clamp(1.1rem,3vw,1.5rem)'}} className="font-semibold text-foreground mb-0.5">{cell._kpiLabel}</div>}
            <div dangerouslySetInnerHTML={{ __html: cell._kpiHtml }} />
            {cell._sublabel && <div style={{fontSize:'clamp(0.8rem,2vw,1rem)'}} className="text-muted-foreground text-center mt-1">{cell._sublabel}</div>}
        </div>
    )
    return (
        <div className="flex flex-col min-h-0">
            {cell._kpiLabel && <div style={{fontSize:'clamp(1.1rem,3vw,1.5rem)'}} className="font-semibold text-foreground mb-0.5 text-center shrink-0">{cell._kpiLabel}</div>}
            <div ref={chartRef} className="flex-1 min-h-[200px]" />
            {cell._sublabel && <div style={{fontSize:'clamp(0.8rem,2vw,1rem)'}} className="text-muted-foreground text-center mt-1 shrink-0">{cell._sublabel}</div>}
        </div>
    )
}

// ─── SqlBlockEditor (composant principal) ─────────────────────────────────────

