// Logique de l'éditeur SQL block (état, handlers, schémas, aperçus).
// Extrait de SqlBlockEditor : le composant ne garde que la mise en page.

import {useState, useCallback, useRef, useEffect, useMemo} from 'react'
import {useShallow} from 'zustand/react/shallow'
import {useNotebookStore} from '../../../store/notebookStore'
import {DuckDBManager} from '../../../../lib/DuckDBManager'
import {astToSql, sqlToAstSmart, getEffectiveSql, generateMaterializeQuery, buildDisplaySql, stripMaterializePrefix, stepSql, quoteId} from '../../../../lib/SqlBlockService'
import {ChartConfigEditor} from '../ChartConfigEditor'
import type {ChartConfig} from '../../../../lib/SqlBlockTypes'
import type {SqlBlockConfig, SqlBlockStep, SqlBlockMaterialize} from '../../../../lib/SqlBlockTypes'
import {SqlDataTable} from '../../SqlDataTable'
import {commitAstUpdate, getOrInitConfig, mutateSqlBlockConfig} from './config'
import {computeStepSchemas} from './schema'
import {useStepEyeData} from './useStepEyeData'
import {useStepInputSchemas} from './stepParts'

import type {SqlBlockEditorProps} from './types'

export function useSqlBlockEditor(props: SqlBlockEditorProps) {
    const { cell, path, cellIndex, onExitUiMode, fromSqlCell, skipExecution, modalOpen, allowedMaterializeModes, openVizConfigTrigger } = props
    const { updateCellAt, _duckdbTables, db, runCellAt } = useNotebookStore(useShallow(s => ({
        updateCellAt: s.updateCellAt,
        _duckdbTables: s._duckdbTables,
        db: s.db,
        runCellAt: s.runCellAt,
    })))

    /** Applique un mutateur à cette cellule, de façon immuable. */
    const apply = useCallback((fn: (c: any) => void) => {
        updateCellAt(path, cellIndex, fn)
    }, [updateCellAt, path, cellIndex])

    const cfg: SqlBlockConfig = getOrInitConfig(cell)
    const ast = cfg.ast

    // Schémas par étape (colonnes/types en entrée de chaque step)
    const sourceColumns: { name: string; type: string }[] =
        ast.source ? (_duckdbTables?.[ast.source]?.columns ?? []) : []
    const stepSchemas = computeStepSchemas(ast, sourceColumns)

    // Schémas dynamiques : priorité table temp déjà matérialisée, fallback SQL LIMIT 0
    const { dynamicSchemas, fetchSchemaForStep, invalidateFrom } = useStepInputSchemas(ast, cell._id)

    // tableSchemas pour l'autocomplétion Monaco
    // Sanitize : noms undefined → crash toLowerCase() dans le Monarch tokenizer de Monaco
    const tableSchemas = (db?.schemaTrees ?? [])
        .filter((t: any) => t?.name != null)
        .map((t: any) => ({
            ...t,
            name: String(t.name),
            columns: (t?.columns ?? [])
                .filter((c: any) => c?.name != null)
                .map((c: any) => ({ ...c, name: String(c.name), type: String(c.type ?? '') })),
        }))

    // Œil par étape (aperçus DuckDB)
    const { eyeOpen, toggleEye, loading: eyeLoading, getEyeData } = useStepEyeData(cell, ast, modalOpen)

    // Modal mode dégradé
    const [pendingDegradedSql, setPendingDegradedSql] = useState<string | null>(null)
    const [multiSqlWarning, setMultiSqlWarning] = useState(false)

    // SQL généré visible ?
    const [showSql, setShowSql] = useState(false)

    // Index du step dont la modale de config est ouverte
    const [configOpenIdx, setConfigOpenIdx] = useState<number | null>(null)
    // Modale de config source
    const [sourceConfigOpen, setSourceConfigOpen] = useState(false)

    const selectSql = getEffectiveSql(cfg)
    const displaySql = cell.name?.trim()
        ? generateMaterializeQuery(cell.name, selectSql, ast.materialized ?? 'ephemeral')
        : selectSql

    // ─── Handlers AST ──────────────────────────────────────────────────────

    const handleSourceChange = useCallback((v: string) => {
        commitAstUpdate(cell, { source: v }, apply)
    }, [cell, apply])

    // Auto-sélection de la première table lors de la création d'une cellule sans source
    useEffect(() => {
        if (!ast.source) {
            const tables = Object.keys(_duckdbTables ?? {}).filter(t => !t.startsWith('_sqlblock.'))
            if (tables.length > 0) commitAstUpdate(cell, { source: tables[0] }, apply)
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // Mode de matérialisation courant : 'ephemeral' | 'view' | 'table'
    const outputMode = ast.materialized ?? 'ephemeral'

    const handleStepUpdate = useCallback((idx: number, newStep: SqlBlockStep) => {
        invalidateFrom(idx + 1, ast)   // les schémas en aval sont périmés
        commitAstUpdate(cell, { steps: ast.steps.map((s, i) => i === idx ? newStep : s) }, apply)
    }, [cell, ast, apply, invalidateFrom])

    const handleStepRemove = useCallback((idx: number) => {
        setConfigOpenIdx(null) // ferme la modale avant de supprimer le step (évite removeChild sur portal)
        commitAstUpdate(cell, { steps: ast.steps.filter((_, i) => i !== idx) }, apply)
    }, [cell, ast.steps, apply])

    const handleStepMove = useCallback((idx: number, dir: -1 | 1) => {
        setConfigOpenIdx(null) // ferme la modale avant de déplacer le step
        const s = [...ast.steps]; const swap = idx + dir
        if (swap < 0 || swap >= s.length) return
        ;[s[idx], s[swap]] = [s[swap], s[idx]]
        commitAstUpdate(cell, { steps: s }, apply)
    }, [cell, ast.steps, apply])

    const handleStepAdd = useCallback((step: SqlBlockStep) => {
        const newSteps = [...ast.steps, step]
        commitAstUpdate(cell, { steps: newSteps }, apply)
        // Pas d'ouverture auto du modal de config — l'étape a déjà été configurée dans AddStepModal
    }, [cell, ast.steps, apply])

    // Schéma "propre" pour ChartConfigEditor : colonnes AVANT les annotations chart
    // (défini ici avant handleChartConfigChange pour éviter le TDZ dans les deps)
    const stepsKey = useMemo(() => JSON.stringify(ast.steps), [ast.steps])
    const [chartInputSchema, setChartInputSchema] = useState<{ columns: string[]; colTypes: Record<string, string> }>({ columns: [], colTypes: {} })

    const fetchChartSchema = useCallback(async () => {
        if (!ast.source && !ast.steps.length) return
        const cleanAst = { ...ast, chartConfig: undefined }
        const cleanSql = astToSql(cleanAst)
        const bare = cleanSql.trimEnd().replace(/;+\s*$/, '')
        try {
            const conn = DuckDBManager.getConnection()
            if (!conn) return
            const result = await conn.query(`${bare}\nLIMIT 0`)
            const colTypes: Record<string, string> = {}
            for (const field of result.schema.fields) colTypes[field.name] = String(field.type)
            setChartInputSchema({ columns: Object.keys(colTypes), colTypes })
        } catch {
            // Source table peut ne pas encore exister (fichier non chargé) — silencieux
        }
    }, [ast.source, stepsKey]) // eslint-disable-line

    const handleChartConfigChange = useCallback((cfg: ChartConfig | null) => {
        // Invalide le cache des schémas dynamiques : chartConfig change le SQL final
        invalidateFrom(0, ast)
        commitAstUpdate(cell, { chartConfig: cfg ?? undefined }, apply)
        if (cfg) fetchChartSchema()
        // runCellAt est déclenché à la fermeture de la modale (handleVizConfigClose), pas ici
    }, [cell, ast, apply, invalidateFrom, fetchChartSchema])

    const handleOutputModeChange = useCallback(async (mode: string) => {
        // Quitter view/table → supprimer silencieusement l'objet DuckDB existant
        if (cell.name?.trim()) {
            const prev = ast.materialized ?? 'ephemeral'
            try {
                if (prev === 'table') {
                    await DuckDBManager.executeQuery(`DROP TABLE IF EXISTS ${quoteId(cell.name)}`)
                } else if (prev === 'view') {
                    await DuckDBManager.executeQuery(`DROP VIEW IF EXISTS ${quoteId(cell.name)}`)
                }
            } catch (_) { /* silencieux */ }
        }
        commitAstUpdate(cell, { materialized: mode as SqlBlockMaterialize }, apply)
    }, [cell, ast.materialized, apply])

    // ─── Distinct values pour le filtre (par step) ─────────────────────────
    // Fabrique une fonction fetchDistinctValues qui interroge la sous-requête
    // réelle en entrée du step (stepSql(ast, stepIdx-1)), pas juste ast.source.

    const makeStepDistinctValues = useCallback((stepIdx: number) => {
        return async (column: string, selectLimit: number, fromLimit: number): Promise<{ values: string[]; hasMore: boolean }> => {
            if (!ast.source || !column) return { values: [], hasMore: false }
            try {
                const cleanAst = { ...ast, chartConfig: undefined }
                const inputSql = stepIdx === 0
                    ? stepSql(cleanAst, -1)
                    : stepSql(cleanAst, stepIdx - 1)
                if (!inputSql) return { values: [], hasMore: false }
                const col = `"${column.replace(/"/g, '""')}"`
                // Applique le fromLimit en sous-couche pour éviter de scanner toute la table
                const inner = fromLimit > 0
                    ? `(SELECT ${col} FROM (${inputSql}) __fdv__ WHERE ${col} IS NOT NULL LIMIT ${fromLimit}) _sub`
                    : `(${inputSql}) __fdv__ WHERE ${col} IS NOT NULL`
                const sql = selectLimit > 0
                    ? `SELECT DISTINCT ${col} FROM ${inner} ORDER BY 1 LIMIT ${selectLimit + 1}`
                    : `SELECT DISTINCT ${col} FROM ${inner} ORDER BY 1`
                const rows = await DuckDBManager.executeQuery(sql)
                const hasMore = selectLimit > 0 && rows.length > selectLimit
                return { values: rows.slice(0, selectLimit > 0 ? selectLimit : undefined).map(r => String(r[column] ?? '')), hasMore }
            } catch {
                return { values: [], hasMore: false }
            }
        }
    }, [ast])

    // ─── Handlers SQL manuel ───────────────────────────────────────────────

    function handleManualSqlEdit(rawSql: string) {
        const newSql = stripMaterializePrefix(rawSql)
        // Vérification : plusieurs instructions SQL → UI impossible (hors LABEL prefix)
        const stmts = newSql.split(';').map((s: string) => s.trim()).filter(Boolean)
        const nonLabelStmts = stmts.filter((s: string) => !/^\s*SELECT\s+.+?::(?:LABEL|SUBLABEL|ICON)\b/i.test(s))
        if (nonLabelStmts.length > 1) {
            apply(c => mutateSqlBlockConfig(c, (cfg: any) => {
                cfg.degraded = true; cfg.manualSql = newSql
                cfg.sql = buildDisplaySql(cell.name, newSql, cfg.ast?.materialized ?? 'ephemeral')
            }))
            setMultiSqlWarning(true)
            return
        }
        setMultiSqlWarning(false)
        const result = sqlToAstSmart(newSql, ast.materialized)
        if (result.compatible && result.ast) {
            apply(c => mutateSqlBlockConfig(c, (cfg: any) => {
                cfg.ast = result.ast; cfg.degraded = false; cfg.manualSql = null
                const genSql = astToSql(result.ast)
                cfg.sql = buildDisplaySql(cell.name, genSql, result.ast.materialized ?? 'ephemeral')
            }))
            runCellAt(path, cellIndex)
        } else {
            setPendingDegradedSql(newSql)
        }
    }

    function confirmDegraded() {
        if (!pendingDegradedSql) return
        apply(c => mutateSqlBlockConfig(c, (cfg: any) => {
            cfg.degraded = true; cfg.manualSql = pendingDegradedSql
            cfg.sql = buildDisplaySql(cell.name, pendingDegradedSql, cfg.ast?.materialized ?? 'ephemeral')
        }))
        setPendingDegradedSql(null)
        runCellAt(path, cellIndex)
    }

    function tryRestoreFromDegraded() {
        const cfg = getOrInitConfig(cell)
        const sql = stripMaterializePrefix(cfg.manualSql || selectSql)
        // Bloquer la restauration si plusieurs instructions SQL (hors LABEL prefix)
        const stmts = sql.split(';').map((s: string) => s.trim()).filter(Boolean)
        const nonLabelStmts = stmts.filter((s: string) => !/^\s*SELECT\s+.+?::(?:LABEL|SUBLABEL|ICON)\b/i.test(s))
        if (nonLabelStmts.length > 1) {
            setMultiSqlWarning(true)
            return
        }
        const result = sqlToAstSmart(sql, ast.materialized)
        if (result.compatible && result.ast) {
            apply(c => mutateSqlBlockConfig(c, (cfgInner: any) => {
                cfgInner.ast = result.ast; cfgInner.degraded = false; cfgInner.manualSql = null
                const genSql = astToSql(result.ast)
                cfgInner.sql = buildDisplaySql(cell.name, genSql, result.ast.materialized ?? 'ephemeral')
            }))
        } else {
            alert(`Impossible de restaurer l'AST : ${result.error || 'SQL incompatible'}`)
        }
    }

    // ─── Aperçu conditionnel (œil step actif ou résultats cellule) ────────

    const eyeData = eyeOpen !== null ? getEyeData(eyeOpen) : null
    const showingEye = eyeOpen !== null   // source ou step intermédiaire
    const hasResults = cell._results && Array.isArray(cell._results) && cell._results.length > 0
    const hasChart = !!(cell._echartsOption || cell._kpiHtml)

    // Aperçu graphique dans dtSection (remplace le datatable)
    const [vizTab, setVizTab] = useState<'table' | 'chart'>('table')
    const [vizConfigOpen, setVizConfigOpen] = useState(false)
    // Flag : on n'auto-active qu'une seule fois par version du SQL (évite de re-forcer après switch manuel)
    const hasAutoActivatedVizRef = useRef(false)

    // Ouvre la modale de config viz quand le trigger change (déclenché depuis CellBody)
    useEffect(() => {
        if (!openVizConfigTrigger || openVizConfigTrigger <= 0) return
        // Si cfg.sql est renseigné, il fait foi sur l'AST stocké (peut être obsolète).
        // Re-parser systématiquement depuis le SQL brut pour initialiser le chartConfig.
        const currentCfg = getOrInitConfig(cell)
        const rawSql = currentCfg.sql || ''
        if (rawSql.trim()) {
            const result = sqlToAstSmart(rawSql, currentCfg.ast?.materialized ?? 'ephemeral')
            const hasCustomSql = result.ast?.steps?.some((s: any) => s.type === 'custom_sql')
            const hasColumns = (result.ast?.chartConfig?.columns?.length ?? 0) > 0
            if (result.compatible && result.ast && hasColumns) {
                apply(c => mutateSqlBlockConfig(c, (currentCfg: any) => {
                    if (!hasCustomSql) {
                        // Parse propre (ex: SELECT littéraux ::KPI FROM (SELECT 1)) → mettre à jour tout l'AST
                        currentCfg.ast = result.ast
                        currentCfg.degraded = false
                        currentCfg.manualSql = null
                    } else {
                        // Parse partiel (fallback CTE) → uniquement le chartConfig,
                        // sans toucher source/steps pour éviter le double-WITH
                        currentCfg.ast = { ...currentCfg.ast, chartConfig: result.ast.chartConfig }
                    }
                }))
                // fetchChartSchema sera rappelé via l'effect stepsKey/source après le re-render
                setVizConfigOpen(true)
                return
            }
        }
        setVizConfigOpen(true)
        fetchChartSchema()
    }, [openVizConfigTrigger]) // eslint-disable-line

    // cellule factice pour SqlDataTable quand on affiche un aperçu step ou source
    const displayCell = showingEye && eyeData
        ? { _id: `eye_${String(eyeOpen)}_${cell._id}`, _results: eyeData.rows, _schemaTypes: eyeData.schemaTypes }
        : cell

    // Reset du flag d'auto-activation quand le SQL change (nouvelle cellule, nouvelles étapes…)
    useEffect(() => { hasAutoActivatedVizRef.current = false }, [cell._id, stepsKey, ast.source]) // eslint-disable-line

    // Bascule auto sur 'table' si le graphique disparaît ;
    // ou sur 'chart' si un graphique apparaît (SQL avec rôles ::ROLE sans ast.chartConfig)
    useEffect(() => {
        if (vizTab === 'chart' && !hasChart) setVizTab('table')
        else if (hasChart && vizTab === 'table' && !ast.chartConfig && !hasAutoActivatedVizRef.current) {
            hasAutoActivatedVizRef.current = true
            setVizTab('chart')
        }
    }, [hasChart]) // eslint-disable-line
    // Synchro vizTab avec le type de chartConfig
    useEffect(() => {
        setVizTab(ast.chartConfig?.chartType && ast.chartConfig.chartType !== 'datatable' ? 'chart' : 'table')
    }, [ast.chartConfig?.chartType]) // eslint-disable-line

    // Re-fetch quand les étapes changent
    useEffect(() => { fetchChartSchema() }, [stepsKey, ast.source]) // eslint-disable-line

    // Fallback immédiat : si l'async n'a pas encore renvoyé de colonnes, utilise sourceColumns
    // (disponibles dans _duckdbTables sans requête DuckDB — couvre le cas 0 étapes)
    const chartSchema = chartInputSchema.columns.length > 0
        ? chartInputSchema
        : {
            columns: sourceColumns.map(c => c.name),
            colTypes: Object.fromEntries(sourceColumns.map(c => [c.name, c.type])),
        }

    // ─── Layout responsive (ResizeObserver) ─────────────────────────────
    // Breakpoints :
    //   ≥ 680px : [datatable | sql | étapes] côte à côte
    //   440–679 : [sql | étapes] en haut  +  [datatable] en bas
    //   < 440   : [étapes] en haut  +  [datatable + sql] empilés en bas
    const bodyRef = useRef<HTMLDivElement>(null)
    const [bodyWidth, setBodyWidth] = useState(9999)
    useEffect(() => {
        const el = bodyRef.current
        if (!el) return
        const obs = new ResizeObserver(([e]) => setBodyWidth(e.contentRect.width))
        obs.observe(el)
        return () => obs.disconnect()
    }, [])
    const layout = bodyWidth >= 680 ? 'wide' : bodyWidth >= 440 ? 'medium' : 'narrow'

    // ─── Render ────────────────────────────────────────────────────────────

    return {
        _duckdbTables,
        allowedMaterializeModes,
        ast,
        bodyRef,
        cell,
        cellIndex,
        cfg,
        chartSchema,
        configOpenIdx,
        confirmDegraded,
        displayCell,
        displaySql,
        dynamicSchemas,
        eyeData,
        eyeLoading,
        eyeOpen,
        fetchChartSchema,
        fetchSchemaForStep,
        fromSqlCell,
        handleChartConfigChange,
        handleManualSqlEdit,
        handleOutputModeChange,
        handleSourceChange,
        handleStepAdd,
        handleStepMove,
        handleStepRemove,
        handleStepUpdate,
        hasChart,
        hasResults,
        layout,
        makeStepDistinctValues,
        multiSqlWarning,
        onExitUiMode,
        outputMode,
        path,
        pendingDegradedSql,
        runCellAt,
        setConfigOpenIdx,
        setMultiSqlWarning,
        setPendingDegradedSql,
        setShowSql,
        setSourceConfigOpen,
        setVizConfigOpen,
        setVizTab,
        showSql,
        showingEye,
        sourceColumns,
        sourceConfigOpen,
        stepSchemas,
        tableSchemas,
        toggleEye,
        tryRestoreFromDegraded,
        vizConfigOpen,
        vizTab,
        updateCellAt,
        db,
        skipExecution,
        modalOpen,
        openVizConfigTrigger,
    }
}
