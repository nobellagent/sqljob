/**
 * SqlBlockEditor — Éditeur visuel pour les cellules de type sqlBlock.
 *
 * Architecture : sql <-> ast <-> ui
 * L'AST est la source de vérité. Le SQL est généré depuis l'AST (ou édité
 * manuellement en mode dégradé). Toute modification UI met à jour l'AST puis
 * régénère le SQL.
 *
 * Colonnes par étape : dérivées statiquement depuis l'AST + source DuckDB.
 * Aperçu par étape (œil) : table DuckDB temporaire _sb_<cellId>_s<i> LIMIT 10.
 *   → Seules les étapes dont les prédécesseurs ont changé sont recalculées.
 */
import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { SqlMonacoEditor } from '@sqlrooms/sql-editor'
import { useShallow } from 'zustand/react/shallow'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@sqlrooms/ui'
import { useNotebookStore } from '../../store/notebookStore'
import { DuckDBManager } from '../../../lib/DuckDBManager'
import { CDNManager } from '../../../lib/CDNManager'
import {
    astToSql,
    sqlToAst,
    sqlToAstSmart,
    getEffectiveSql,
    generateMaterializeQuery,
    buildDisplaySql,
    stripMaterializePrefix,
    stepSql,
    quoteId,
    getAutoCteName,
} from '../../../lib/SqlBlockService'
import { ChartConfigEditor } from './ChartConfigEditor'
import type { ChartConfig } from '../../../lib/SqlBlockTypes'
import {
    DUCKDB_TYPES,
    STEP_LABELS,
    STEP_CATEGORIES,
    createDefaultSqlBlockConfig,
} from '../../../lib/SqlBlockTypes'
import type {
    SqlBlockConfig,
    SqlBlockAst,
    SqlBlockStep,
    SelectColumnsStep,
    ExcludeColumnsStep,
    ChangeTypeStep,
    FilterRowsStep,
    FilterGroup,
    FilterItem,
    FilterCondition,
    FilterOp,
    FilterValueKind,
    SortStep,
    SortKey,
    TopNStep,
    RenameColumnsStep,
    DeriveStep,
    FillNullStep,
    GroupByStep,
    Aggregation,
    JoinStep,
    JoinCondition,
    UnionStep,
    PivotStep,
    UnpivotStep,
    WindowStep,
    WindowColumn,
    UnnestStep,
    JsonExtractStep,
    DateTruncStep,
    CustomSqlStep,
    ConditionalColumnStep,
    ConditionalRule,
    SqlBlockMaterialize,
} from '../../../lib/SqlBlockTypes'
import { SqlDataTable } from '../SqlDataTable'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Lecture de la configuration SQL block : jamais de mutation (un rendu ne doit
 * pas écrire dans l'état). Applique les valeurs par défaut sur une copie.
 */
export function SqlBlockEditor(props: SqlBlockEditorProps) {
    const {
        _duckdbTables, allowedMaterializeModes, ast, bodyRef, cell, cellIndex, cfg, chartSchema, configOpenIdx, confirmDegraded, displayCell, displaySql, dynamicSchemas, eyeData, eyeLoading, eyeOpen, fetchChartSchema, fetchSchemaForStep, fromSqlCell, handleChartConfigChange, handleManualSqlEdit, handleOutputModeChange, handleSourceChange, handleStepAdd, handleStepMove, handleStepRemove, handleStepUpdate, hasChart, hasResults, layout, makeStepDistinctValues, multiSqlWarning, onExitUiMode, outputMode, path, pendingDegradedSql, runCellAt, setConfigOpenIdx, setMultiSqlWarning, setPendingDegradedSql, setShowSql, setSourceConfigOpen, setVizConfigOpen, setVizTab, showSql, showingEye, sourceColumns, sourceConfigOpen, stepSchemas, tableSchemas, toggleEye, tryRestoreFromDegraded, vizConfigOpen, vizTab,
    } = useSqlBlockEditor(props)

    return (
        <div className="flex flex-col gap-3 w-full">
            {cfg.degraded && <DegradedBanner onRestore={tryRestoreFromDegraded} />}
            {multiSqlWarning && (
                <div className="flex items-center gap-2 rounded-md bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs px-3 py-2">
                    <span>⚠️ L'édition du SQL via l'UI n'est possible que si une seule instruction SQL est présente.</span>
                    <button onClick={() => setMultiSqlWarning(false)} className="ml-auto shrink-0 text-yellow-600 hover:text-yellow-900">✕</button>
                </div>
            )}
            {pendingDegradedSql !== null && (
                <IncompatibleConfirmModal onConfirm={confirmDegraded} onCancel={() => setPendingDegradedSql(null)} />
            )}

            {/* Barre d'outils — bouton retour SQL uniquement */}
            {onExitUiMode && !fromSqlCell && (
                <div className="shrink-0">
                    <button
                        onClick={() => { setConfigOpenIdx(null); onExitUiMode() }}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground border border-border rounded hover:bg-muted transition-colors"
                        title="Retour à l'éditeur SQL"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                        SQL
                    </button>
                </div>
            )}

            {/* Corps principal — responsive */}
            {!cfg.degraded ? (() => {
                // ── Sections réutilisables ──────────────────────────────
                const dtSection = (
                    <>
                        {showingEye ? (
                            <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-xs text-primary font-medium">
                                    {eyeOpen === 'source' ? `Source` : `Aperçu étape ${(eyeOpen as number) + 1}`}
                                </span>
                                {eyeLoading && <svg viewBox="0 0 24 24" className="w-3 h-3 animate-spin text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>}
                            </div>
                        ) : (
                            <div className="flex items-center gap-1 shrink-0">
                                {(ast.chartConfig?.chartType && ast.chartConfig.chartType !== 'datatable' || hasChart) && (
                                    <button
                                        onClick={() => setVizTab('chart')}
                                        className={`px-2 py-0.5 text-xs rounded transition-colors ${vizTab === 'chart' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
                                    >Graphique</button>
                                )}
                                <button
                                    onClick={() => setVizTab('table')}
                                    className={`px-2 py-0.5 text-xs rounded transition-colors ${vizTab === 'table' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
                                >Tableau</button>
                            </div>
                        )}
                        {showingEye ? (
                            eyeData && eyeData.rows.length > 0
                                ? <SqlDataTable cell={displayCell} />
                                : eyeLoading
                                    ? <div className="flex items-center justify-center h-16 text-xs text-muted-foreground italic">Chargement…</div>
                                    : <div className="flex items-center justify-center h-16 text-xs text-muted-foreground italic border border-dashed border-border rounded">Résultat vide</div>
                        ) : vizTab === 'chart' ? (
                            hasChart
                                ? <ChartPreviewInEditor cell={cell} />
                                : <div className="flex items-center justify-center h-16 text-xs text-muted-foreground italic border border-dashed border-border rounded">Exécutez la cellule pour voir le graphique</div>
                        ) : hasResults ? (
                            <SqlDataTable cell={cell} />
                        ) : (
                            <div className="flex items-center justify-center h-16 text-xs text-muted-foreground italic border border-dashed border-border rounded">Aucun résultat — exécutez la cellule</div>
                        )}
                        {cell._status === 'error' && cell._resultInfo && !showingEye && (
                            <div className="p-2 rounded bg-destructive/10 text-destructive text-xs shrink-0">{cell._resultInfo}</div>
                        )}
                    </>
                )

                const sqlToggle = (
                    <button onClick={() => setShowSql(s => !s)}
                        className="flex items-center gap-1 text-xs font-medium text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors whitespace-nowrap shrink-0 mb-1">
                        SQL généré <span className="ml-0.5">{showSql ? '▾' : '▸'}</span>
                    </button>
                )
                const sqlPreviewEl = showSql && (
                    <SqlPreview sql={displaySql} editable={true} onEdit={handleManualSqlEdit} tableSchemas={tableSchemas} cellId={cell._id} />
                )

                const n = ast.steps.length
                const mainTables = Object.keys(_duckdbTables ?? {}).filter(t => !t.startsWith('_sqlblock.'))
                // stepSchemas[n] = output of last step (input for the new step being added)
                const newStepInputSchema = dynamicSchemas[n] ?? stepSchemas[n] ?? { columns: sourceColumns.map(c => c.name), colTypes: Object.fromEntries(sourceColumns.map(c => [c.name, c.type])) }
                const stepsSection = (
                    <>
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide shrink-0">Étapes</span>
                        <SourceStepItem
                            eyeOpen={eyeOpen === 'source'}
                            onEyeToggle={() => toggleEye('source')}
                            source={ast.source}
                            configOpen={sourceConfigOpen}
                            onConfigOpen={() => setSourceConfigOpen(true)}
                            onConfigClose={() => setSourceConfigOpen(false)}
                            tables={mainTables}
                            disabled={cfg.degraded}
                            onSourceChange={handleSourceChange}
                        />
                        {ast.steps.length === 0 && <p className="text-xs text-muted-foreground italic px-1">Aucune étape — SELECT * FROM {ast.source || '…'}</p>}
                        {ast.steps.map((step, idx) => {
                            const staticSchema = stepSchemas[idx] ?? { columns: sourceColumns.map(c => c.name), colTypes: Object.fromEntries(sourceColumns.map(c => [c.name, c.type])) }
                            const schema = dynamicSchemas[idx] ?? staticSchema
                            const otherStepNames = ast.steps.filter((_, i) => i !== idx).map(s => s.name?.trim()).filter(Boolean) as string[]
                            return (
                                <StepItem key={idx} step={step} index={idx} totalSteps={ast.steps.length}
                                    availableCols={schema.columns} availableColTypes={schema.colTypes}
                                    eyeOpen={eyeOpen === idx} eyeLoading={eyeLoading && eyeOpen === idx}
                                    onEyeToggle={() => toggleEye(idx)} onUpdate={handleStepUpdate}
                                    onRemove={handleStepRemove} onMove={handleStepMove}
                                    configOpen={configOpenIdx === idx}
                                    onConfigOpen={() => { setConfigOpenIdx(idx); fetchSchemaForStep(idx) }}
                                    onConfigClose={() => {
                                        setConfigOpenIdx(null)
                                        // Relance la visu si un graphique est actif
                                        if (ast.chartConfig) runCellAt(path, cellIndex)
                                    }}
                                    fetchDistinctValues={makeStepDistinctValues(idx)} otherStepNames={otherStepNames}
                                />
                            )
                        })}
                        <AddStepModal onAdd={handleStepAdd}
                            availableCols={newStepInputSchema.columns} availableColTypes={newStepInputSchema.colTypes}
                            fetchDistinctValues={makeStepDistinctValues(n)}
                            otherStepNames={ast.steps.map(s => s.name?.trim()).filter(Boolean) as string[]}
                            stepIndex={n} onOpen={() => fetchSchemaForStep(n)}
                        />
                        {!cfg.degraded && (
                            <div className="flex items-center gap-2 mt-1 shrink-0">
                                <label className="text-xs text-muted-foreground shrink-0">Matérialisation :</label>
                                <select
                                    value={outputMode}
                                    onChange={e => handleOutputModeChange(e.target.value)}
                                    className="text-xs border border-border rounded px-1 py-0.5 bg-background text-foreground"
                                >
                                    {(!allowedMaterializeModes || allowedMaterializeModes.includes('ephemeral')) && <option value="ephemeral">ephemeral</option>}
                                    {(!allowedMaterializeModes || allowedMaterializeModes.includes('view')) && <option value="view">VIEW</option>}
                                    {(!allowedMaterializeModes || allowedMaterializeModes.includes('table')) && <option value="table">TABLE</option>}
                                </select>
                            </div>
                        )}
                        <VizStepItem
                            eyeOpen={eyeOpen === null}
                            onEyeToggle={() => {
                                if (eyeOpen !== null) toggleEye(eyeOpen)
                            }}
                            configOpen={vizConfigOpen}
                            onConfigOpen={() => { setVizConfigOpen(true); fetchChartSchema() }}
                            onConfigClose={() => {
                                setVizConfigOpen(false)
                                runCellAt(path, cellIndex)
                            }}
                            chartConfig={ast.chartConfig}
                            availableColumns={chartSchema.columns}
                            availableColTypes={chartSchema.colTypes}
                            onMount={fetchChartSchema}
                            onChange={handleChartConfigChange}
                        />
                    </>
                )

                // ── Rendu selon la largeur ──────────────────────────────
                if (layout === 'wide') return (
                    <div ref={bodyRef} className="flex flex-row gap-3 min-h-[280px]" style={{ height: 'calc(100% - 40px)' }}>
                        <div className="flex-1 min-w-0 flex flex-col gap-1">{dtSection}</div>
                        <div className={`flex flex-col min-h-0 ${showSql ? 'w-64 shrink-0' : ''}`}>{sqlToggle}{sqlPreviewEl}</div>
                        <div className="flex flex-col gap-2 w-64 shrink-0 overflow-y-auto">{stepsSection}</div>
                    </div>
                )
                if (layout === 'medium') return (
                    <div ref={bodyRef} className="flex flex-col gap-2">
                        <div className="flex flex-row gap-3 min-h-[280px]">
                            <div className={`flex flex-col min-h-0 ${showSql ? 'flex-1 min-w-0' : ''}`}>{sqlToggle}{sqlPreviewEl}</div>
                            <div className="flex flex-col gap-2 w-64 shrink-0 overflow-y-auto">{stepsSection}</div>
                        </div>
                        <div className="flex flex-col gap-1 min-h-[180px]">{dtSection}</div>
                    </div>
                )
                // narrow
                return (
                    <div ref={bodyRef} className="flex flex-col gap-2">
                        <div className="flex flex-col gap-2 overflow-y-auto">{stepsSection}</div>
                        <div className="flex flex-col gap-1 min-h-[180px]">{dtSection}</div>
                        <div className={`flex flex-col ${showSql ? 'min-h-[180px]' : ''}`}>{sqlToggle}{sqlPreviewEl}</div>
                    </div>
                )
            })() : (
                <div className="flex gap-3 min-h-[280px]">
                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                        {hasResults ? (
                            <SqlDataTable cell={cell} />
                        ) : (
                            <div className="flex items-center justify-center h-16 text-xs text-muted-foreground italic border border-dashed border-border rounded">
                                Aucun résultat — exécutez la cellule
                            </div>
                        )}
                        {cell._status === 'error' && cell._resultInfo && (
                            <div className="p-2 rounded bg-destructive/10 text-destructive text-xs">{cell._resultInfo}</div>
                        )}
                    </div>
                    <div className="w-64 flex flex-col min-h-0">
                        <SqlPreview sql={displaySql} editable={true} onEdit={handleManualSqlEdit}
                            tableSchemas={tableSchemas} cellId={cell._id} />
                    </div>
                </div>
            )}
        </div>
    )
}

import { useSqlBlockEditor } from './editor/useSqlBlockEditor'
import type { SqlBlockEditorProps } from './editor/types'
import {commitAstUpdate, getOrInitConfig, mutateSqlBlockConfig} from './editor/config'
import {computeStepSchemas} from './editor/schema'
import {useStepEyeData} from './editor/useStepEyeData'
import {AddStepModal, ChartPreviewInEditor, DegradedBanner, IncompatibleConfirmModal, SourceStepItem, SqlPreview, StepItem, VizStepItem, useStepInputSchemas} from './editor/stepParts'

// API publique historique (ré-exportée depuis les modules découpés).
export { openSqlblockSession, dropSqlblockSchema } from './editor/session'
export { VarInput } from './editor/varInput'
