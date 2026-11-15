// Module extrait de SqlBlockService.ts — AST vers SQL.

import type {SqlBlockAst, SqlBlockConfig, SqlBlockStep} from '../SqlBlockTypes'
import {buildChartFinalSelect} from './chart'
import {filterGroupHasContent, filterGroupToSql, quoteSqlValue, renderFilterValue} from './filters'
import {escapeBlockComment, fromExpr, getCteName, quoteId} from './helpers'

export function astToSql(ast: SqlBlockAst): string {
    const { source, steps, chartConfig } = ast;

    if (!steps || steps.length === 0) {
        const from = fromExpr(source);
        if (chartConfig?.columns?.length) return buildChartFinalSelect(from, chartConfig);
        return `SELECT * FROM ${from}`;
    }
    // Step unique sans nom : forme simple (pas de CTE)
    // Exception : custom_sql → toujours en CTE pour préserver la structure (SQL non standard)
    if (steps.length === 1 && !steps[0].name?.trim() && steps[0].type !== 'custom_sql') {
        const sql = singleStepToSql(fromExpr(source), steps[0]);
        const desc = steps[0].description?.trim();
        // Pas de forme simple quand chartConfig présent : on passe par CTE pour pouvoir
        // ajouter le SELECT final avec annotations
        if (!chartConfig?.columns?.length) {
            return desc ? `/* ${escapeBlockComment(desc)} */\n${sql}` : sql;
        }
    }

    const ctes: string[] = [];
    for (let i = 0; i < steps.length; i++) {
        const prevSrc = i === 0 ? fromExpr(source) : quoteId(getCteName(steps[i - 1], i - 1));
        const inner = singleStepToSql(prevSrc, steps[i]);
        const cteName = quoteId(getCteName(steps[i], i));
        const desc = steps[i].description?.trim();
        const comment = desc ? `/* ${escapeBlockComment(desc)} */\n    ` : '';
        ctes.push(`  ${cteName} AS (\n    ${comment}${inner.replace(/\n/g, '\n    ')}\n  )`);
    }
    const lastName = quoteId(getCteName(steps[steps.length - 1], steps.length - 1));
    const finalSelect = chartConfig?.columns?.length
        ? buildChartFinalSelect(lastName, chartConfig)
        : `SELECT * FROM ${lastName}`;
    // Hoist config prefix SELECTs (LABEL/SUBLABEL/ICON) before WITH so DuckDB can parse cleanly
    const prefixM = finalSelect.match(/^((SELECT\s+(?:'[^']*'\s*::(?:LABEL|SUBLABEL|ICON)\b\s*(?:,\s*)?)+;\n?)+)/i);
    const hoistPrefix = prefixM ? prefixM[1] : '';
    const body = hoistPrefix ? finalSelect.slice(hoistPrefix.length) : finalSelect;
    return `${hoistPrefix}WITH\n${ctes.join(',\n')}\n${body}`;
}

export function stepSql(ast: SqlBlockAst, stepIndex: number): string {
    // Si pas de source ET pas de steps : rien à faire
    if (!ast.source && !ast.steps?.length) return '';
    if (stepIndex < 0 || !ast.steps?.length) {
        if (!ast.source) return '';
        return `SELECT * FROM ${fromExpr(ast.source)}`;
    }
    return astToSql({ ...ast, steps: ast.steps.slice(0, stepIndex + 1) });
}

export function getEffectiveSql(config: SqlBlockConfig): string {
    if (config.degraded && config.manualSql) return config.manualSql;
    return astToSql(config.ast);
}

// ─────────────────────────────────────────────────────────────────────────────
// SQL → AST (parser limité aux patterns P0 générés)
// ─────────────────────────────────────────────────────────────────────────────

export function singleStepToSql(source: string, step: SqlBlockStep): string {
    switch (step.type) {

        // ── P0 ──────────────────────────────────────────────────────────────
        case 'select_columns': {
            if (!step.columns.length) return `SELECT * FROM ${source}`;
            return `SELECT\n  ${step.columns.map(quoteId).join(',\n  ')}\nFROM ${source}`;
        }
        case 'exclude_columns': {
            if (!step.columns.length) return `SELECT * FROM ${source}`;
            return `SELECT * EXCLUDE (${step.columns.map(quoteId).join(', ')}) FROM ${source}`;
        }
        case 'change_type': {
            if (!step.changes.length) return `SELECT * FROM ${source}`;
            const casts = step.changes
                .map(c => `CAST(${quoteId(c.column)} AS ${c.targetType}) AS ${quoteId(c.column)}`)
                .join(',\n  ');
            return `SELECT * REPLACE (\n  ${casts}\n) FROM ${source}`;
        }

        // ── P1 ──────────────────────────────────────────────────────────────
        case 'filter_rows': {
            // Migration rétrocompat : ancien format conditions[] → groups
            const rawGroups = step.groups?.length
                ? step.groups
                : (step.conditions?.length
                    ? [{ items: step.conditions.map(c => ({ kind: 'cond' as const, cond: c })), logicOp: step.logicOp ?? 'AND' }]
                    : [])
            const activeGroups = rawGroups.filter(g => filterGroupHasContent(g))
            if (!activeGroups.length) return `SELECT * FROM ${source}`;
            const whereSql = activeGroups.map(g => {
                const sql = filterGroupToSql(g)
                return activeGroups.length > 1 ? `(${sql})` : sql
            }).join(`\n  ${step.groupLogicOp ?? 'OR'} `)
            return `SELECT * FROM ${source}\nWHERE ${whereSql}`;
        }
        case 'sort': {
            if (!step.keys.length) return `SELECT * FROM ${source}`;
            const keys = step.keys
                .map(k => `${quoteId(k.column)} ${k.direction.toUpperCase()} NULLS ${k.nulls.toUpperCase()}`)
                .join(', ');
            return `SELECT * FROM ${source}\nORDER BY ${keys}`;
        }
        case 'top_n': {
            if (step.mode === 'limit') {
                const off = step.offset ? ` OFFSET ${step.offset}` : '';
                return `SELECT * FROM ${source}\nLIMIT ${step.n}${off}`;
            }
            const meth = step.sampleMethod ? ` (${step.sampleMethod})` : '';
            const unit = step.mode === 'sample_percent' ? `${step.n}%` : `${step.n} ROWS`;
            return `SELECT * FROM ${source}\nUSING SAMPLE ${unit}${meth}`;
        }
        case 'rename_columns': {
            if (!step.renames.length) return `SELECT * FROM ${source}`;
            const renames = step.renames.map(r => `${quoteId(r.from)} AS ${quoteId(r.to)}`).join(', ');
            return `SELECT * RENAME (${renames}) FROM ${source}`;
        }
        case 'derive': {
            if (!step.columns.length) return `SELECT * FROM ${source}`;
            const adds = step.columns.filter(c => !c.replace);
            const replaces = step.columns.filter(c => c.replace);
            const excludeClause = replaces.length
                ? ` EXCLUDE (${replaces.map(c => quoteId(c.name)).join(', ')})`
                : '';
            const exprs = [...replaces, ...adds]
                .map(c => `(${c.expr}) AS ${quoteId(c.name)}`)
                .join(',\n  ');
            return `SELECT *${excludeClause},\n  ${exprs}\nFROM ${source}`;
        }
        case 'fill_null': {
            if (!step.fills.length) return `SELECT * FROM ${source}`;
            const reps = step.fills.map(f => {
                const col = quoteId(f.column);
                switch (f.strategy) {
                    case 'value':        return `COALESCE(${col}, ${quoteSqlValue(f.value || '')}) AS ${col}`;
                    case 'zero':         return `COALESCE(${col}, 0) AS ${col}`;
                    case 'empty_string': return `COALESCE(${col}, '') AS ${col}`;
                    case 'mean':         return `COALESCE(${col}, AVG(${col}) OVER ()) AS ${col}`;
                    case 'median':       return `COALESCE(${col}, MEDIAN(${col}) OVER ()) AS ${col}`;
                }
            });
            return `SELECT * REPLACE (\n  ${reps.join(',\n  ')}\n) FROM ${source}`;
        }

        // ── P2 ──────────────────────────────────────────────────────────────
        case 'group_by': {
            const groupCols = step.groupCols.map(quoteId);
            const aggs = step.aggregations.map(a => {
                const col = a.column === '*' ? '*' : quoteId(a.column);
                const fn = a.fn.toUpperCase();
                switch (a.fn) {
                    case 'count':          return `COUNT(${col}) AS ${quoteId(a.alias)}`;
                    case 'count_distinct': return `COUNT(DISTINCT ${col}) AS ${quoteId(a.alias)}`;
                    case 'string_agg':     return `STRING_AGG(${col}, ${quoteSqlValue(a.separator ?? ', ')}) AS ${quoteId(a.alias)}`;
                    default:               return `${fn}(${col}) AS ${quoteId(a.alias)}`;
                }
            });
            const selCols = [...groupCols, ...aggs];
            const groupBy = groupCols.length ? `\nGROUP BY ${groupCols.join(', ')}` : '';
            return `SELECT\n  ${selCols.join(',\n  ')}\nFROM ${source}${groupBy}`;
        }
        case 'join': {
            const jt = step.joinType === 'anti' ? 'LEFT' : step.joinType.toUpperCase();
            const onClauses = step.on.map(c => `${source}.${quoteId(c.left)} = _r.${quoteId(c.right)}`).join(' AND ');
            const rightCols = step.selectRight === '*'
                ? '_r.*'
                : step.selectRight.map(c => `_r.${quoteId(c)}`).join(', ');
            const antiWhere = step.joinType === 'anti' && step.on[0]
                ? `\nWHERE _r.${quoteId(step.on[0].right)} IS NULL`
                : '';
            return `SELECT ${source}.*, ${rightCols}\nFROM ${source}\n${jt} JOIN ${quoteId(step.rightTable)} AS _r\n  ON ${onClauses}${antiWhere}`;
        }
        case 'union': {
            const mode = step.mode === 'all' ? 'UNION ALL' : 'UNION';
            return `SELECT * FROM ${source}\n${mode}\nSELECT * FROM ${quoteId(step.table)}`;
        }
        case 'pivot': {
            const group = step.groupCols.length
                ? `\nGROUP BY ${step.groupCols.map(quoteId).join(', ')}`
                : '';
            return `SELECT * FROM (PIVOT ${source}\n  ON ${quoteId(step.onColumn)}\n  USING ${step.valueFn}(${quoteId(step.valueColumn)})${group})`;
        }
        case 'unpivot': {
            const cols = step.columns.map(quoteId).join(', ');
            return `SELECT * FROM (UNPIVOT ${source}\n  ON ${cols}\n  INTO NAME ${quoteId(step.nameCol)} VALUE ${quoteId(step.valueCol)})`;
        }

        // ── P3 ──────────────────────────────────────────────────────────────
        case 'window': {
            if (!step.columns.length) return `SELECT * FROM ${source}`;
            const wins = step.columns.map(w => {
                const arg = w.col ? quoteId(w.col) : '';
                const fnStr = (w.fn === 'LAG' || w.fn === 'LEAD') && w.offset
                    ? `${w.fn}(${arg}, ${w.offset})`
                    : `${w.fn}(${arg})`;
                const partPart = w.partitionBy.length
                    ? `PARTITION BY ${w.partitionBy.map(quoteId).join(', ')} `
                    : '';
                const ordPart = w.orderBy.length
                    ? `ORDER BY ${w.orderBy.map(k => `${quoteId(k.column)} ${k.direction.toUpperCase()}`).join(', ')} `
                    : '';
                const framePart = w.frame ? `${w.frame} ` : '';
                return `${fnStr} OVER (${partPart}${ordPart}${framePart}) AS ${quoteId(w.alias)}`;
            });
            return `SELECT *,\n  ${wins.join(',\n  ')}\nFROM ${source}`;
        }
        case 'unnest': {
            if (step.keepEmpty) {
                return `SELECT ${source}.*, _u.${quoteId(step.alias)}\nFROM ${source}\nLEFT JOIN UNNEST(${source}.${quoteId(step.column)}) AS _u(${quoteId(step.alias)}) ON TRUE`;
            }
            return `SELECT ${source}.*, _u.${quoteId(step.alias)}\nFROM ${source},\nUNNEST(${source}.${quoteId(step.column)}) AS _u(${quoteId(step.alias)})`;
        }
        case 'json_extract': {
            if (!step.extractions.length) return `SELECT * FROM ${source}`;
            const cols = step.extractions.map(e => {
                const base = `json_extract_string(${source}.${quoteId(step.column)}, '${e.path}')`;
                const cast = e.targetType ? `CAST(${base} AS ${e.targetType})` : base;
                return `${cast} AS ${quoteId(e.alias)}`;
            });
            return `SELECT ${source}.*,\n  ${cols.join(',\n  ')}\nFROM ${source}`;
        }
        case 'date_trunc': {
            const gran = `'${step.granularity}'`;
            const expr = `DATE_TRUNC(${gran}, ${quoteId(step.column)})`;
            if (step.mode === 'replace') {
                return `SELECT * REPLACE (${expr} AS ${quoteId(step.column)}) FROM ${source}`;
            }
            const alias = step.alias || `${step.column}_${step.granularity}`;
            return `SELECT *, ${expr} AS ${quoteId(alias)} FROM ${source}`;
        }

        case 'conditional_column': {
            const col = quoteId(step.newColumn || 'nouvelle_colonne');
            const whenClauses = (step.rules ?? [])
                .filter(r => filterGroupHasContent(r.when))
                .map(r => {
                    const cond = filterGroupToSql(r.when);
                    const thenVal = renderFilterValue(r.then ?? '', r.thenKind);
                    return `WHEN ${cond} THEN ${thenVal}`;
                });
            const elseClause = step.elseValue !== undefined && step.elseValue !== ''
                ? `ELSE ${renderFilterValue(step.elseValue, step.elseKind)}`
                : 'ELSE NULL';
            const caseExpr = `CASE\n    ${whenClauses.join('\n    ')}\n    ${elseClause}\n  END`;
            return `SELECT *, ${caseExpr} AS ${col} FROM ${source}`;
        }

        case 'custom_sql': {
            const sql = (step.sql?.trim() || `SELECT * FROM {{subquery}}`).replace(/;+\s*$/, '');
            return sql.replace(/\{\{subquery\}\}/g, source);
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

