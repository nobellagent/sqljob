import type {SqlBlockStep} from '../../../../../lib/SqlBlockTypes'
import {CustomSqlStepUI} from '../steps/customSql'

function truncateCols(items: string[], max = 4): string {
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


