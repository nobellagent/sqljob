import type {SqlBlockAst, SqlBlockStep} from '../../../../lib/SqlBlockTypes'
import {useStepEyeData} from './useStepEyeData'

export interface StepSchema {
    columns: string[]
    colTypes: Record<string, string>
}


export function applyStepToSchema(step: SqlBlockStep, cols: string[], types: Record<string, string>): { cols: string[]; types: Record<string, string> } {
    switch (step.type) {
        case 'select_columns': {
            if (!step.columns.length) return { cols, types }
            const kept = step.columns.filter(c => cols.includes(c))
            return { cols: kept, types: Object.fromEntries(kept.map(c => [c, types[c] ?? ''])) }
        }
        case 'exclude_columns': {
            const excl = new Set(step.columns)
            const c2 = cols.filter(c => !excl.has(c))
            return { cols: c2, types: Object.fromEntries(c2.map(c => [c, types[c] ?? ''])) }
        }
        case 'change_type': {
            const t2 = { ...types }
            step.changes.forEach(ch => { t2[ch.column] = ch.targetType })
            return { cols, types: t2 }
        }
        case 'filter_rows':
        case 'sort':
        case 'top_n':
        case 'fill_null':
        case 'union':
            return { cols, types }
        case 'rename_columns': {
            const c2 = [...cols]; const t2 = { ...types }
            step.renames.forEach(r => {
                const i = c2.indexOf(r.from); if (i < 0) return
                c2[i] = r.to; t2[r.to] = t2[r.from] ?? ''; delete t2[r.from]
            })
            return { cols: c2, types: t2 }
        }
        case 'derive': {
            const c2 = [...cols]; const t2 = { ...types }
            step.columns.forEach(col => {
                if (!c2.includes(col.name)) c2.push(col.name)
                t2[col.name] = ''
            })
            return { cols: c2, types: t2 }
        }
        case 'group_by': {
            const c2 = [...step.groupCols, ...step.aggregations.map(a => a.alias)]
            const t2: Record<string, string> = {}
            step.groupCols.forEach(c => { t2[c] = types[c] ?? '' })
            step.aggregations.forEach(a => {
                t2[a.alias] = ['count','count_distinct'].includes(a.fn) ? 'BIGINT'
                    : ['sum','avg','mean','median','stddev'].includes(a.fn) ? 'DOUBLE'
                    : a.fn === 'string_agg' ? 'VARCHAR' : (types[a.column] ?? '')
            })
            return { cols: c2, types: t2 }
        }
        case 'join': {
            const right = step.selectRight === '*' ? [] : step.selectRight
            const c2 = [...cols, ...right.filter(c => !cols.includes(c))]
            const t2 = { ...types }; right.forEach(c => { if (!t2[c]) t2[c] = '' })
            return { cols: c2, types: t2 }
        }
        case 'pivot':
            return { cols: [...step.groupCols], types: Object.fromEntries(step.groupCols.map(c => [c, types[c] ?? ''])) }
        case 'unpivot': {
            const excl = new Set(step.columns)
            const rem = cols.filter(c => !excl.has(c))
            return { cols: [...rem, step.nameCol, step.valueCol], types: { ...Object.fromEntries(rem.map(c => [c, types[c] ?? ''])), [step.nameCol]: 'VARCHAR', [step.valueCol]: '' } }
        }
        case 'window': {
            const c2 = [...cols, ...step.columns.map(w => w.alias)]
            const t2 = { ...types }; step.columns.forEach(w => { t2[w.alias] = '' })
            return { cols: c2, types: t2 }
        }
        case 'unnest':
            return { cols: [...cols, step.alias], types: { ...types, [step.alias]: '' } }
        case 'json_extract': {
            const c2 = [...cols, ...step.extractions.map(e => e.alias)]
            const t2 = { ...types }; step.extractions.forEach(e => { t2[e.alias] = e.targetType ?? 'VARCHAR' })
            return { cols: c2, types: t2 }
        }
        case 'date_trunc': {
            if (step.mode === 'replace') return { cols, types: { ...types, [step.column]: 'TIMESTAMP' } }
            const alias = step.alias || `${step.column}_${step.granularity}`
            return { cols: [...cols, alias], types: { ...types, [alias]: 'TIMESTAMP' } }
        }
        case 'conditional_column': {
            const colName = step.newColumn || 'nouvelle_colonne'
            if (cols.includes(colName)) return { cols, types }
            return { cols: [...cols, colName], types: { ...types, [colName]: 'VARCHAR' } }
        }
        default:
            // custom_sql ou type inconnu : schéma non dérivable statiquement, on conserve l'entrée
            return { cols, types }
    }
}


export function computeStepSchemas(
    ast: SqlBlockAst,
    sourceColumns: { name: string; type: string }[]
): StepSchema[] {
    const schemas: StepSchema[] = []
    let cols = sourceColumns.map(c => c.name)
    let types: Record<string, string> = Object.fromEntries(sourceColumns.map(c => [c.name, c.type]))
    for (const step of ast.steps) {
        schemas.push({ columns: [...cols], colTypes: { ...types } })
        const next = applyStepToSchema(step, cols, types)
        cols = next.cols; types = next.types
    }
    // Entry n = output of last step (= correct input for a new step appended after all existing steps)
    schemas.push({ columns: [...cols], colTypes: { ...types } })
    return schemas
}

// ─── useStepEyeData ───────────────────────────────────────────────────────────
// Gère les tables DuckDB intermédiaires _sqlblock."sb_<cellId>_s<i>".
// Hash-based : seules les étapes dont les prédécesseurs ont changé sont recalculées.
// Matérialisation proactive : toutes les étapes sont pré-calculées en arrière-plan
// dès que l'AST ou la source changent.

