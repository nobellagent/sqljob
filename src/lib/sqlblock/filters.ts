// Module extrait de SqlBlockService.ts — filtres et parsing bas niveau.

import type {FilterCondition, FilterGroup, FilterItem, FilterOp, FilterValueKind, GroupByStep, SortKey} from '../SqlBlockTypes'
import {COL_PAT} from './constants'
import {parseSqlLiteral, parseSqlValueList, quoteId, unquoteId} from './helpers'
import {extractParenContent} from './sql-to-ast'

export function filterGroupHasContent(g: FilterGroup): boolean {
    // Retrocompat: old format had conditions[]
    if (g.conditions?.length) return true;
    return (g.items ?? []).some(item =>
        item.kind === 'cond' ? !!item.cond.column : filterGroupHasContent(item.group)
    )
}

export function filterGroupToSql(g: FilterGroup): string {
    // Retrocompat: old format with conditions[]
    const items: FilterItem[] = g.items?.length
        ? g.items
        : (g.conditions ?? []).map(c => ({ kind: 'cond' as const, cond: c }))

    const parts = items
        .filter(item => item.kind === 'cond' ? !!item.cond.column : filterGroupHasContent(item.group))
        .map(item => {
            if (item.kind === 'cond') return conditionToSql(item.cond)
            const inner = filterGroupToSql(item.group)
            return `(${inner})`
        })

    if (!parts.length) return '1=1'
    const joined = parts.join(` ${g.logicOp ?? 'AND'} `)
    const expr = parts.length > 1 ? `(${joined})` : joined
    return g.negate ? `NOT ${expr}` : expr
}

/** Rendu d'une valeur de filtre selon son mode (literal, column, param). */
export function renderFilterValue(v: string, kind?: FilterValueKind): string {
    if (kind === 'column')     return quoteId(v)
    if (kind === 'param')      return v            // {{paramName}} — substitué à l'exécution
    if (kind === 'expression') return `(${v})`
    return quoteSqlValue(v)
}

function conditionToSql(c: FilterCondition): string {
    const col = quoteId(c.column);
    const val  = renderFilterValue(c.value ?? '', c.valueKind)
    const valTo = renderFilterValue(c.valueTo ?? '', c.valueToKind)
    switch (c.op) {
        case '=':       return `${col} = ${val}`;
        case '!=':      return `${col} != ${val}`;
        case '>':       return `${col} > ${val}`;
        case '<':       return `${col} < ${val}`;
        case '>=':      return `${col} >= ${val}`;
        case '<=':      return `${col} <= ${val}`;
        case 'in':      return `${col} IN (${(c.values ?? []).map(quoteSqlValue).join(', ')})`;
        case 'not_in':  return `${col} NOT IN (${(c.values ?? []).map(quoteSqlValue).join(', ')})`;
        case 'is_null': return `${col} IS NULL`;
        case 'not_null':return `${col} IS NOT NULL`;
        case 'like':    return `${col} LIKE ${val}`;
        case 'ilike':   return `${col} ILIKE ${val}`;
        case 'between': return `${col} BETWEEN ${val} AND ${valTo}`;
    }
}

/** Entoure d'apostrophes si non-numérique / non-booléen. */
export function quoteSqlValue(v: string): string {
    if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(v)) return v;
    if (/^(true|false|null)$/i.test(v)) return v.toLowerCase();
    return `'${v.replace(/'/g, "''")}'`;
}

function parseCondition(s: string): FilterCondition | null {
    s = s.trim();
    let m: RegExpMatchArray | null;

    // IS NOT NULL
    m = s.match(new RegExp(`^(${COL_PAT})\\s+IS\\s+NOT\\s+NULL\\s*$`, 'i'));
    if (m) return { column: unquoteId(m[1]), op: 'not_null' };

    // IS NULL
    m = s.match(new RegExp(`^(${COL_PAT})\\s+IS\\s+NULL\\s*$`, 'i'));
    if (m) return { column: unquoteId(m[1]), op: 'is_null' };

    // BETWEEN ... AND ...
    m = s.match(new RegExp(`^(${COL_PAT})\\s+BETWEEN\\s+(.+?)\\s+AND\\s+(.+?)\\s*$`, 'i'));
    if (m) return { column: unquoteId(m[1]), op: 'between', value: parseSqlLiteral(m[2]), valueTo: parseSqlLiteral(m[3]) };

    // NOT IN
    m = s.match(new RegExp(`^(${COL_PAT})\\s+NOT\\s+IN\\s*\\((.+)\\)\\s*$`, 'i'));
    if (m) {
        const values = parseSqlValueList(m[2]);
        if (!values) return null;
        return { column: unquoteId(m[1]), op: 'not_in', values };
    }

    // IN
    m = s.match(new RegExp(`^(${COL_PAT})\\s+IN\\s*\\((.+)\\)\\s*$`, 'i'));
    if (m) {
        const values = parseSqlValueList(m[2]);
        if (!values) return null;
        return { column: unquoteId(m[1]), op: 'in', values };
    }

    // ILIKE
    m = s.match(new RegExp(`^(${COL_PAT})\\s+ILIKE\\s+('(?:[^']|'')*')\\s*$`, 'i'));
    if (m) return { column: unquoteId(m[1]), op: 'ilike', value: parseSqlLiteral(m[2]) };

    // LIKE
    m = s.match(new RegExp(`^(${COL_PAT})\\s+LIKE\\s+('(?:[^']|'')*')\\s*$`, 'i'));
    if (m) return { column: unquoteId(m[1]), op: 'like', value: parseSqlLiteral(m[2]) };

    // Comparaison : =, !=, >=, <=, >, <
    m = s.match(new RegExp(`^(${COL_PAT})\\s*(!=|>=|<=|>|<|=)\\s*(.+?)\\s*$`));
    if (m) return { column: unquoteId(m[1]), op: m[2] as FilterOp, value: parseSqlLiteral(m[3]) };

    return null;
}

/**
 * Découpe une chaîne SQL par un séparateur de mots-clés (AND/OR) au niveau 0
 * (pas dans des parenthèses ni des chaînes littérales), en ignorant l'AND
 * qui fait partie d'un BETWEEN.
 */
function splitTopLevelBy(s: string, sepRe: RegExp): string[] {
    const parts: string[] = [];
    let depth = 0;
    let inStr = false;
    let start = 0;
    let i = 0;
    while (i < s.length) {
        const c = s[i];
        if (c === "'" && !inStr) { inStr = true; i++; continue; }
        if (c === "'" && inStr) {
            if (s[i + 1] === "'") { i += 2; continue; }
            inStr = false; i++; continue;
        }
        if (!inStr) {
            if (c === '(') { depth++; i++; continue; }
            if (c === ')') { depth--; i++; continue; }
            if (depth === 0) {
                const slice = s.slice(i);
                const m = slice.match(sepRe);
                if (m && m.index === 0) {
                    // Vérifie si cet AND est la 2e partie d'un BETWEEN
                    if (/^AND\b/i.test(m[0])) {
                        const before = s.slice(start, i).trim();
                        const betweenCount = (before.match(/\bBETWEEN\b/gi) ?? []).length;
                        const andCount = (before.match(/\bAND\b/gi) ?? []).length;
                        if (betweenCount > andCount) { i += m[0].length; continue; }
                    }
                    parts.push(s.slice(start, i).trim());
                    i += m[0].length;
                    start = i;
                    continue;
                }
            }
        }
        i++;
    }
    parts.push(s.slice(start).trim());
    return parts.filter(Boolean);
}

/** Parse un groupe de filtre récursif (avec AND/OR/NOT/parens). */
function parseSingleFilterGroup(s: string): FilterGroup | null {
    let negate = false;
    let inner = s.trim();

    // NOT préfixe
    if (/^NOT\s+/i.test(inner)) {
        negate = true;
        inner = inner.replace(/^NOT\s+/i, '').trim();
    }

    // Déplie les parenthèses extérieures si l'expression entière est entourée
    if (inner.startsWith('(')) {
        const content = extractParenContent(inner, 0);
        if (content !== null && inner === `(${content})`) inner = content.trim();
    }

    // Essaie de séparer par AND
    let parts = splitTopLevelBy(inner, /^AND\b/i);
    let logicOp: 'AND' | 'OR' = 'AND';

    // Si une seule partie, essaie OR
    if (parts.length === 1) {
        const orParts = splitTopLevelBy(inner, /^OR\b/i);
        if (orParts.length > 1) { parts = orParts; logicOp = 'OR'; }
    }

    const items: FilterItem[] = [];
    for (const part of parts) {
        const t = part.trim();
        // Sous-groupe entre parenthèses avec NOT ?
        if (/^NOT\s*\(/i.test(t) || (t.startsWith('(') && t.endsWith(')'))) {
            const g = parseSingleFilterGroup(t);
            if (!g) return null;
            items.push({ kind: 'group', group: g });
        } else {
            const cond = parseCondition(t);
            if (!cond) return null;
            items.push({ kind: 'cond', cond });
        }
    }

    return { items, logicOp, negate };
}

/** Parse une clause WHERE complète en tableau de FilterGroup. */
export function parseWhereToGroups(where: string): FilterGroup[] | null {
    // Les groupes de premier niveau sont séparés par le groupLogicOp (OR par défaut)
    const topParts = splitTopLevelBy(where, /^OR\b/i);
    const groups: FilterGroup[] = [];
    for (const part of topParts) {
        const g = parseSingleFilterGroup(part.trim());
        if (!g) return null;
        groups.push(g);
    }
    return groups.length > 0 ? groups : null;
}

/** Parse une liste ORDER BY en SortKey[]. */
export function parseOrderByKeys(orderBy: string): SortKey[] | null {
    const parts = orderBy.split(',');
    const keys: SortKey[] = [];
    for (const part of parts) {
        const p = part.trim();
        // "col" ASC NULLS LAST
        let m = p.match(new RegExp(`^(${COL_PAT})\\s+(ASC|DESC)\\s+NULLS\\s+(FIRST|LAST)\\s*$`, 'i'));
        if (m) { keys.push({ column: unquoteId(m[1]), direction: m[2].toLowerCase() as 'asc'|'desc', nulls: m[3].toLowerCase() as 'first'|'last' }); continue; }
        // "col" ASC / DESC (sans NULLS)
        m = p.match(new RegExp(`^(${COL_PAT})\\s*(ASC|DESC)?\\s*$`, 'i'));
        if (!m) return null;
        keys.push({ column: unquoteId(m[1]), direction: (m[2]?.toLowerCase() ?? 'asc') as 'asc'|'desc', nulls: 'last' });
    }
    return keys;
}

/** Parse une liste RENAME (old AS new, ...) en tableau de renames. */
export function parseRenameList(s: string): { from: string; to: string }[] | null {
    const parts = s.split(',');
    const renames: { from: string; to: string }[] = [];
    for (const part of parts) {
        const m = part.trim().match(new RegExp(`^(${COL_PAT})\\s+AS\\s+(${COL_PAT})\\s*$`, 'i'));
        if (!m) return null;
        renames.push({ from: unquoteId(m[1]), to: unquoteId(m[2]) });
    }
    return renames;
}

/** Splits a comma-separated SQL expression list, respecting parentheses. */
export function splitSelectParts(sql: string): string[] {
    const parts: string[] = [];
    let depth = 0, cur = '';
    for (const ch of sql) {
        if (ch === '(') depth++;
        else if (ch === ')') depth--;
        else if (ch === ',' && depth === 0) { parts.push(cur.trim()); cur = ''; continue; }
        cur += ch;
    }
    if (cur.trim()) parts.push(cur.trim());
    return parts;
}

/** Tries to parse a GROUP BY body into a GroupByStep AST node. */
