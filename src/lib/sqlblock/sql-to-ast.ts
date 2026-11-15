import type {SqlParseResult} from './constants'
// Module extrait de SqlBlockService.ts — SQL vers AST (parsers simples).


import type {ChangeTypeChange, SqlBlockAst, SqlBlockMaterialize, SqlBlockStep} from '../SqlBlockTypes'
import {singleStepToSql} from './ast-to-sql'
import {parseChartFinalSelect} from './chart'
import {unquoteId} from './helpers'

export function sqlToAst(sql: string, materialize: SqlBlockMaterialize = 'view'): SqlParseResult {
    if (!sql?.trim()) return { ast: null, compatible: false, error: 'SQL vide' };
    const normalized = sql.replace(/[ \t]+/g, ' ').trim();

    const cteAst = tryParseCteChain(normalized, materialize);
    if (cteAst) return { ast: cteAst, compatible: true };

    const simpleAst = tryParseSimpleSelect(normalized, materialize);
    if (simpleAst) return { ast: simpleAst, compatible: true };

    return { ast: null, compatible: false, error: 'SQL non compatible avec les blocs disponibles' };
}

export function tryParseSimpleSelect(sql: string, materialize: SqlBlockMaterialize): SqlBlockAst | null {
    const m = sql.match(/^SELECT\s+(.+?)\s+FROM\s+((?:"[^"]*"|\S)+)\s*;?\s*$/is);
    if (!m) return null;
    const parsed = parseSelectBody(m[1].trim());
    if (!parsed) return null;
    return { source: unquoteId(m[2].trim()), steps: parsed.step ? [parsed.step] : [], materialized: materialize };
}

/** Extrait le SELECT final d'un WITH query (le SELECT qui suit tous les CTEs, à profondeur 0). */
export function extractFinalSelectFromWithQuery(sql: string): string | null {
    const withM = sql.match(/^WITH\s+/i);
    if (!withM) return null;
    let pos = withM[0].length;
    let depth = 0;
    while (pos < sql.length) {
        const ch = sql[pos];
        if (ch === '(') { depth++; pos++; continue; }
        if (ch === ')') { depth--; pos++; continue; }
        if (depth === 0 && /^SELECT\b/i.test(sql.slice(pos))) return sql.slice(pos).trim();
        pos++;
    }
    return null;
}

export function tryParseCteChain(sql: string, materialize: SqlBlockMaterialize): SqlBlockAst | null {
    if (!/^WITH\s+_sqlblock_s/i.test(sql)) return null;
    const ctes = extractCtes(sql);
    if (!ctes?.length) return null;

    const steps: SqlBlockStep[] = [];
    for (const cte of ctes) {
        const parsed = parseSelectBody(cte.body);
        if (!parsed) return null;
        if (parsed.step) steps.push(parsed.step);
    }
    const finalSql = extractFinalSelectFromWithQuery(sql);
    const chartConfig = finalSql ? parseChartFinalSelect(finalSql) ?? undefined : undefined;
    return { source: unquoteId(ctes[0].source), steps, materialized: materialize, ...(chartConfig ? { chartConfig } : {}) };
}

interface CteInfo { body: string; source: string }

export function extractCtes(sql: string): CteInfo[] | null {
    const ctes: CteInfo[] = [];
    const re = /_sqlblock_s\d+(?:_[a-z]+)?\s+AS\s*\(/gi;
    let match: RegExpExecArray | null;
    while ((match = re.exec(sql)) !== null) {
        const innerSql = extractParenContent(sql, match.index + match[0].length - 1);
        if (!innerSql) return null;
        // Ignore le commentaire de description /* ... */ en début de corps
        const stripped = innerSql.replace(/[ \t\r\n]+/g, ' ').trim()
            .replace(/^\/\*.*?\*\/\s*/s, '').trim();
        const m = stripped.match(/^SELECT\s+(.+?)\s+FROM\s+((?:"[^"]*"|\S)+)\s*;?\s*$/is);
        if (!m) return null;
        ctes.push({ body: m[1].trim(), source: m[2].trim() });
    }
    return ctes.length > 0 ? ctes : null;
}

export function extractParenContent(sql: string, start: number): string | null {
    let depth = 0, i = start;
    while (i < sql.length) {
        if (sql[i] === '(') depth++;
        else if (sql[i] === ')') { depth--; if (depth === 0) return sql.slice(start + 1, i); }
        i++;
    }
    return null;
}

export function parseSelectBody(body: string): { step: SqlBlockStep | null } | null {
    const b = body.trim();
    if (b === '*') return { step: null };

    const excludeMatch = b.match(/^\*\s+EXCLUDE\s*\(([^)]+)\)\s*$/i);
    if (excludeMatch) {
        const columns = splitIdentifiers(excludeMatch[1]);
        return columns ? { step: { type: 'exclude_columns', columns } } : null;
    }

    const replaceMatch = b.match(/^\*\s+REPLACE\s*\((.+)\)\s*$/is);
    if (replaceMatch) {
        const changes = parseCastList(replaceMatch[1]);
        return changes ? { step: { type: 'change_type', changes } } : null;
    }

    if (!b.includes('*')) {
        const columns = splitIdentifiers(b);
        if (columns?.length) return { step: { type: 'select_columns', columns } };
    }

    return null;
}

export function splitIdentifiers(s: string): string[] | null {
    const ids: string[] = [];
    for (const p of s.split(',').map(x => x.trim()).filter(Boolean)) {
        const id = parseIdentifier(p);
        if (!id) return null;
        ids.push(id);
    }
    return ids;
}

export function parseIdentifier(s: string): string | null {
    s = s.trim();
    if (s.startsWith('"') && s.endsWith('"')) return s.slice(1, -1).replace(/""/g, '"');
    if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)) return s;
    return null;
}

export function parseCastList(s: string): ChangeTypeChange[] | null {
    const re = /CAST\(([^\s),]+)\s+AS\s+([A-Z_][A-Z0-9_]*(?:\(\d+(?:,\s*\d+)?\))?)\)\s+AS\s+([^\s,)]+)/gi;
    const changes: ChangeTypeChange[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(s)) !== null) {
        changes.push({ column: unquoteId(m[1]), targetType: m[2].toUpperCase() });
    }
    return changes.length > 0 ? changes : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// singleStepToSql — SQL généré pour chaque step
// ─────────────────────────────────────────────────────────────────────────────

