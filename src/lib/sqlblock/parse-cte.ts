import type {SqlParseResult} from './constants'
// Module extrait de SqlBlockService.ts — parsing par CTE.

import type {Aggregation, ChartConfig, GroupByStep, PivotStep, SqlBlockAst, SqlBlockMaterialize, SqlBlockStep} from '../SqlBlockTypes'
import {parseChartFinalSelect} from './chart'
import {CHART_ROLES_ORDERED} from './constants'
import {parseOrderByKeys, parseRenameList, parseWhereToGroups, splitSelectParts} from './filters'
import {quoteId, stepTypeFromCteName, unquoteId, CteFullInfo} from './helpers'
import {extractFinalSelectFromWithQuery, extractParenContent, parseSelectBody, sqlToAst} from './sql-to-ast'

export function extractCtesWithFullBody(sql: string): CteFullInfo[] | null {
    // Parser séquentiel : lit TOUS les CTEs du bloc WITH (noms auto ET custom)
    const withM = sql.match(/^WITH\s+/i);
    if (!withM) return null;

    const ctes: CteFullInfo[] = [];
    let pos = withM[0].length;

    while (pos < sql.length) {
        // Saute les espaces
        while (pos < sql.length && /\s/.test(sql[pos])) pos++;
        // Fin du bloc WITH = SELECT final
        if (/^SELECT\b/i.test(sql.slice(pos))) break;

        // Lit le nom du CTE (avec ou sans guillemets)
        let name: string;
        if (sql[pos] === '"') {
            const end = sql.indexOf('"', pos + 1);
            if (end < 0) return null;
            name = sql.slice(pos + 1, end).replace(/""/g, '"');
            pos = end + 1;
        } else {
            const m = sql.slice(pos).match(/^([_a-zA-Z][_a-zA-Z0-9]*)/);
            if (!m) return null;
            name = m[1];
            pos += m[1].length;
        }

        // Saute les espaces puis vérifie AS (
        while (pos < sql.length && /\s/.test(sql[pos])) pos++;
        const asM = sql.slice(pos).match(/^AS\s*\(/i);
        if (!asM) return null;
        const openParen = pos + asM[0].length - 1;
        pos = openParen;

        // Extrait le corps entre parenthèses
        const inner = extractParenContent(sql, pos);
        if (!inner) return null;
        pos += inner.length + 2; // saute ( corps )

        const normalized = inner.replace(/[ \t\r\n]+/g, ' ').trim();
        const descM = normalized.match(/^\/\*(.*?)\*\//s);
        const description = descM ? descM[1].trim() : undefined;
        const bodyNoComment = normalized.replace(/^\/\*.*?\*\/\s*/s, '').trim();
        // Pour PIVOT/UNPIVOT : la vraie source est l'identifiant à l'intérieur de la sous-requête
        const pivotSrcM = bodyNoComment.match(/\bFROM\s+\(\s*(?:UN)?PIVOT\s+((?:"[^"]*"|\w[\w.]*?))\s+/i);
        const srcM = bodyNoComment.match(/\bFROM\s+((?:"[^"]*"|\S)+)/i);
        const rawSrcToken = pivotSrcM ? pivotSrcM[1] : srcM ? srcM[1] : null;
        const source = rawSrcToken && !rawSrcToken.startsWith('(') ? unquoteId(rawSrcToken) : '';
        ctes.push({ name, fullBody: bodyNoComment, source, description });

        // Saute la virgule séparatrice
        while (pos < sql.length && /[\s,]/.test(sql[pos])) pos++;
    }

    return ctes.length > 0 ? ctes : null;
}

export function escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Parse une valeur SQL littérale (chaîne quotée ou numérique/booléen). */
export function tryParseGroupByParts(selectBody: string, groupByBody: string): import('../SqlBlockTypes').GroupByStep | null {
    const groupCols = splitSelectParts(groupByBody).map(s => unquoteId(s.trim())).filter(Boolean);
    if (!groupCols.length) return null;

    const selectParts = splitSelectParts(selectBody);
    const seenGroupCols: string[] = [];
    const aggregations: import('../SqlBlockTypes').Aggregation[] = [];

    for (const part of selectParts) {
        const p = part.trim();
        // Plain column → must be a GROUP BY column
        const asPlain = unquoteId(p);
        if (groupCols.includes(asPlain)) { seenGroupCols.push(asPlain); continue; }

        // FN(args) AS alias — greedy match of args handles nested parens
        const fnM = p.match(/^(\w+)\s*\(([\s\S]+)\)\s+AS\s+("(?:[^"]+)"|[\w]+)\s*$/i);
        if (!fnM) return null;

        const fn = fnM[1].toUpperCase();
        const rawArgs = fnM[2].trim();
        const alias = unquoteId(fnM[3].trim());
        let agg: import('../SqlBlockTypes').Aggregation | null = null;

        if (fn === 'COUNT') {
            if (rawArgs === '*') agg = { fn: 'count', column: '*', alias };
            else {
                const distM = rawArgs.match(/^DISTINCT\s+([\s\S]+)$/i);
                agg = distM
                    ? { fn: 'count_distinct', column: unquoteId(distM[1].trim()), alias }
                    : { fn: 'count', column: unquoteId(rawArgs), alias };
            }
        } else if (fn === 'STRING_AGG') {
            const p2 = splitSelectParts(rawArgs);
            const col = unquoteId(p2[0]?.trim() ?? '');
            const sep = p2[1]?.trim().replace(/^['"]|['"]$/g, '') ?? ', ';
            agg = { fn: 'string_agg', column: col, alias, separator: sep };
        } else {
            const FN_MAP: Record<string, string> = {
                SUM: 'sum', AVG: 'avg', MIN: 'min', MAX: 'max',
                MEDIAN: 'median', STDDEV: 'stddev', STDDEV_SAMP: 'stddev', STDDEV_POP: 'stddev',
                LIST: 'list', ARRAY_AGG: 'list',
            };
            const mapped = FN_MAP[fn];
            if (!mapped) return null;
            agg = { fn: mapped as any, column: unquoteId(rawArgs), alias };
        }

        if (!agg) return null;
        aggregations.push(agg);
    }

    // Verify all GROUP BY cols appeared in SELECT
    if (groupCols.some(c => !seenGroupCols.includes(c))) return null;

    return { type: 'group_by', groupCols, aggregations };
}

/**
 * Parse le corps d'un CTE en un SqlBlockStep.
 * - Retourne null si c'est un SELECT * passthrough (pas de step).
 * - Retourne un step structuré si le pattern est reconnu.
 * - Retourne un custom_sql step (avec {{subquery}}) sinon.
 */
export function parseCteBodyToStep(
    fullBody: string,
    typeHint: SqlBlockStep['type'] | null,
    sourceName: string,
): SqlBlockStep | null {
    const b = fullBody.trim();

    // ── Patterns P0 (SELECT body FROM src) ──────────────────────────────────
    const selectM = b.match(/^SELECT\s+(.+?)\s+FROM\s+(?:"[^"]*"|\S+)\s*;?\s*$/is);
    if (selectM) {
        const parsed = parseSelectBody(selectM[1].trim());
        if (parsed !== null) return parsed.step; // null = SELECT * = passthrough
    }

    // ── RENAME ───────────────────────────────────────────────────────────────
    const renameM = b.match(/^SELECT\s+\*\s+RENAME\s*\((.+)\)\s+FROM\s+(?:"[^"]*"|\S+)\s*;?\s*$/is);
    if (renameM) {
        const renames = parseRenameList(renameM[1]);
        if (renames) return { type: 'rename_columns', renames };
    }

    // ── filter_rows (WHERE) ───────────────────────────────────────────────────
    if (!typeHint || typeHint === 'filter_rows') {
        const filterM = b.match(/^SELECT\s+\*\s+FROM\s+(?:"[^"]*"|\S+)\s+WHERE\s+([\s\S]+?)\s*;?\s*$/i);
        if (filterM) {
            const groups = parseWhereToGroups(filterM[1].trim());
            if (groups) return { type: 'filter_rows', groups, groupLogicOp: 'OR' };
        }
    }

    // ── sort (ORDER BY) ───────────────────────────────────────────────────────
    if (!typeHint || typeHint === 'sort') {
        const sortM = b.match(/^SELECT\s+\*\s+FROM\s+(?:"[^"]*"|\S+)\s+ORDER\s+BY\s+([\s\S]+?)\s*;?\s*$/i);
        if (sortM) {
            const keys = parseOrderByKeys(sortM[1].trim());
            if (keys?.length) return { type: 'sort', keys };
        }
    }

    // ── top_n (LIMIT / USING SAMPLE) ──────────────────────────────────────────
    if (!typeHint || typeHint === 'top_n') {
        const limitM = b.match(/^SELECT\s+\*\s+FROM\s+(?:"[^"]*"|\S+)\s+LIMIT\s+(\d+)(?:\s+OFFSET\s+(\d+))?\s*;?\s*$/i);
        if (limitM) {
            const step: SqlBlockStep = { type: 'top_n', mode: 'limit', n: parseInt(limitM[1]) };
            if (limitM[2]) (step as any).offset = parseInt(limitM[2]);
            return step;
        }
        const sampleM = b.match(/^SELECT\s+\*\s+FROM\s+(?:"[^"]*"|\S+)\s+USING\s+SAMPLE\s+(\d+)(%|\s+ROWS?)(?:\s*\((\w+)\))?\s*;?\s*$/i);
        if (sampleM) {
            const isPercent = sampleM[2].trim() === '%';
            const step: SqlBlockStep = { type: 'top_n', mode: isPercent ? 'sample_percent' : 'sample_rows', n: parseInt(sampleM[1]) };
            if (sampleM[3]) (step as any).sampleMethod = sampleM[3];
            return step;
        }
    }

    // ── group_by (SELECT groupCols + AGGs FROM src GROUP BY cols) ──────────────
    if (!typeHint || typeHint === 'group_by') {
        const groupM = b.match(/^SELECT\s+([\s\S]+?)\s+FROM\s+(?:"[^"]*"|\S+)\s+GROUP\s+BY\s+([\s\S]+?)\s*;?\s*$/i);
        if (groupM) {
            const groupStep = tryParseGroupByParts(groupM[1].trim(), groupM[2].trim());
            if (groupStep) return groupStep;
        }
    }

    // ── pivot (SELECT * FROM (PIVOT src ON col USING fn(col) GROUP BY ...)) ─────
    if (!typeHint || typeHint === 'pivot') {
        const pivotM = b.match(/^SELECT\s+\*\s+FROM\s+\(\s*PIVOT\s+(?:"[^"]*"|\S+)\s+ON\s+((?:"[^"]*"|\S+))\s+USING\s+(\w+)\s*\(\s*((?:"[^"]*"|\S+))\s*\)(?:\s+GROUP\s+BY\s+([\s\S]+?))?\s*\)\s*;?\s*$/i);
        if (pivotM) {
            return {
                type: 'pivot',
                onColumn:    unquoteId(pivotM[1].trim()),
                valueFn:     pivotM[2].toUpperCase(),
                valueColumn: unquoteId(pivotM[3].trim()),
                groupCols:   pivotM[4]
                    ? splitSelectParts(pivotM[4]).map(c => unquoteId(c.trim())).filter(Boolean)
                    : [],
            };
        }
    }

    // ── unpivot (SELECT * FROM (UNPIVOT src ON cols INTO NAME name VALUE value)) ─
    if (!typeHint || typeHint === 'unpivot') {
        const unpivotM = b.match(/^SELECT\s+\*\s+FROM\s+\(\s*UNPIVOT\s+(?:"[^"]*"|\S+)\s+ON\s+([\s\S]+?)\s+INTO\s+NAME\s+((?:"[^"]*"|\S+))\s+VALUE\s+((?:"[^"]*"|\S+))\s*\)\s*;?\s*$/i);
        if (unpivotM) {
            return {
                type: 'unpivot',
                columns:  splitSelectParts(unpivotM[1]).map(c => unquoteId(c.trim())).filter(Boolean),
                nameCol:  unquoteId(unpivotM[2].trim()),
                valueCol: unquoteId(unpivotM[3].trim()),
            };
        }
    }

    // ── Fallback : custom_sql (source → {{subquery}}) ─────────────────────────
    const srcQ = quoteId(sourceName);
    const sqlWithPlaceholder = b
        .replace(new RegExp(`\\bFROM\\s+${escapeRegex(srcQ)}\\b`, 'g'), 'FROM {{subquery}}')
        .replace(new RegExp(`\\bFROM\\s+${escapeRegex(sourceName)}\\b`, 'g'), 'FROM {{subquery}}');
    return { type: 'custom_sql', sql: sqlWithPlaceholder };
}

/** Parser par CTE : chaque CTE est parsé indépendamment (fallback custom_sql). */
