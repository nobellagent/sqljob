// Module extrait de SqlBlockService.ts — parser CTE « smart ».

import type {ChartConfig, PivotStep, SqlBlockAst, SqlBlockMaterialize, SqlBlockStep} from '../SqlBlockTypes'
import {extractCtesWithFullBody, parseCteBodyToStep} from './parse-cte'

import {parseChartFinalSelect} from './chart'
import {CHART_ROLES_ORDERED, SqlParseResult} from './constants'
import {splitSelectParts} from './filters'
import {stepTypeFromCteName, unquoteId} from './helpers'
import {extractFinalSelectFromWithQuery, sqlToAst} from './sql-to-ast'

export function tryParseCteChainSmart(sql: string, materialize: SqlBlockMaterialize): SqlBlockAst | null {
    // Accepte tout WITH contenant au moins un CTE _sqlblock_s (même si d'autres ont un nom custom)
    if (!/^WITH\b/i.test(sql) || !/_sqlblock_s\d+/i.test(sql)) return null;
    const ctes = extractCtesWithFullBody(sql);
    if (!ctes?.length) return null;

    const source = ctes[0].source; // source originale
    const steps: SqlBlockStep[] = [];

    for (const cte of ctes) {
        const typeHint = stepTypeFromCteName(cte.name);
        const step = parseCteBodyToStep(cte.fullBody, typeHint, cte.source);
        if (step === null) continue;
        // Réattache la description extraite du commentaire /* ... */
        if (cte.description) step.description = cte.description;
        // Préserve le nom custom (pas auto-généré)
        if (!/^_sqlblock_s\d+(?:_[a-z]+)?$/.test(cte.name)) step.name = cte.name;
        steps.push(step);
    }

    const finalSql = extractFinalSelectFromWithQuery(sql);
    const chartConfig = finalSql ? parseChartFinalSelect(finalSql) ?? undefined : undefined;
    return { source, steps, materialized: materialize, ...(chartConfig ? { chartConfig } : {}) };
}

/**
 * Extrait l'expression FROM complète quand la source est une sous-requête (commence par '(').
 * Ex: `SELECT * FROM (VALUES ...) t(a, b)` → `(VALUES ...) t(a, b)`
 */
export function extractSubquerySource(sql: string): string | null {
    const m = sql.match(/\bFROM\s+(\([\s\S]+)/i);
    if (!m) return null;
    return m[1].replace(/\s*;?\s*$/, '').trim();
}

/** Parser simple SELECT (hors CTE) étendu aux patterns P1 (WHERE, ORDER BY, LIMIT).
 * Les patterns non reconnus deviennent un step custom_sql (préserve le SQL sans perte). */
export function tryParseSimpleSmart(sql: string, materialize: SqlBlockMaterialize): SqlBlockAst | null {
    // Ne pas traiter les requêtes WITH (CTEs) — gérées par tryParseCteChainSmart
    if (/^WITH\b/i.test(sql)) return null;
    const srcM = sql.match(/^SELECT\s+(?:[\s\S]+?)\s+FROM\s+((?:"[^"]*"|\S+))/i);
    if (!srcM) {
        // Pas de FROM — si le SQL contient des annotations ::ROLE, c'est un SELECT sans source
        // (ex: SELECT expr::KPI, 'icon'::ICON) → on utilise (SELECT 1) comme source fictive
        const rolesPattern = CHART_ROLES_ORDERED.join('|');
        if (new RegExp(`::\\s*(?:${rolesPattern})\\b`, 'i').test(sql)) {
            const chartConfig = parseChartFinalSelect(sql + '\nFROM (SELECT 1)') ?? undefined;
            if (chartConfig) return { source: '(SELECT 1)', steps: [], materialized: materialize, chartConfig };
        }
        return null;
    }
    const firstToken = srcM[1];
    const source = unquoteId(firstToken);

    // ── Sous-requête comme source (FROM commence par '(') ──────────────────────
    if (source.startsWith('(')) {
        // Cas PIVOT : SELECT * FROM (PIVOT <source> ON <col> USING <fn>(<col>) GROUP BY ...)
        // → parser en PivotStep avec la vraie source DuckDB identifiée
        const pivotM = sql.match(/^SELECT\s+\*\s+FROM\s+\(\s*PIVOT\s+((?:"[^"]*"|\w[\w.]*?))\s+ON\s+((?:"[^"]*"|\S+))\s+USING\s+(\w+)\s*\(\s*((?:"[^"]*"|\S+))\s*\)(?:\s+GROUP\s+BY\s+([\s\S]+?))?\s*\)\s*;?\s*$/i);
        if (pivotM) {
            const pivotSrc = unquoteId(pivotM[1].trim());
            const onCol    = unquoteId(pivotM[2].trim());
            const fn       = pivotM[3].toUpperCase();
            const valueCol = unquoteId(pivotM[4].trim());
            const groupCols = pivotM[5]
                ? splitSelectParts(pivotM[5]).map(c => unquoteId(c.trim())).filter(Boolean)
                : [];
            return { source: pivotSrc, steps: [{ type: 'pivot', onColumn: onCol, valueColumn: valueCol, valueFn: fn, groupCols }], materialized: materialize };
        }

        // Cas UNPIVOT : SELECT * FROM (UNPIVOT <source> ON <cols> INTO NAME <name> VALUE <value>)
        const unpivotM = sql.match(/^SELECT\s+\*\s+FROM\s+\(\s*UNPIVOT\s+((?:"[^"]*"|\w[\w.]*?))\s+ON\s+([\s\S]+?)\s+INTO\s+NAME\s+((?:"[^"]*"|\S+))\s+VALUE\s+((?:"[^"]*"|\S+))\s*\)\s*;?\s*$/i);
        if (unpivotM) {
            const unpivotSrc = unquoteId(unpivotM[1].trim());
            const columns    = splitSelectParts(unpivotM[2]).map(c => unquoteId(c.trim())).filter(Boolean);
            const nameCol    = unquoteId(unpivotM[3].trim());
            const valueCol   = unquoteId(unpivotM[4].trim());
            return { source: unpivotSrc, steps: [{ type: 'unpivot', columns, nameCol, valueCol }], materialized: materialize };
        }

        // Cas général : extraire l'expression FROM complète comme source brute
        const rawSource = extractSubquerySource(sql);
        if (!rawSource) return null;

        const chartConfig = parseChartFinalSelect(sql) ?? undefined;
        if (chartConfig) return { source: rawSource, steps: [], materialized: materialize, chartConfig };

        // SELECT * FROM (<subquery>) sans roles → SELECT * passthrough (pas de steps)
        const step = parseCteBodyToStep(sql, null, rawSource);
        if (step === null) return { source: rawSource, steps: [], materialized: materialize };
        return { source: rawSource, steps: [step], materialized: materialize };
    }

    // Si le SELECT contient des annotations ::ROLE, c'est un SELECT final de visualisation
    const chartConfig = parseChartFinalSelect(sql) ?? undefined;
    if (chartConfig) return { source, steps: [], materialized: materialize, chartConfig };

    const step = parseCteBodyToStep(sql, null, source);
    if (step === null) return { source, steps: [], materialized: materialize }; // SELECT *
    // custom_sql ou step reconnu → on crée un AST avec ce step (pas de perte de données)
    return { source, steps: [step], materialized: materialize };
}

/**
 * Parser amélioré : essaie d'abord sqlToAst (P0), puis le parsing intelligent
 * par CTE (P1+). Les CTEs non parsables deviennent des steps custom_sql.
 */
export function sqlToAstSmart(sql: string, materialize: SqlBlockMaterialize = 'view'): SqlParseResult {
    // Extraire les préfixes de configuration (LABEL, SUBLABEL, ICON) en tête avant parsing
    // Supporte le format combiné : SELECT 'x'::LABEL, 'y'::SUBLABEL, 'z'::ICON;
    // et les formats individuels legacy : SELECT 'x'::LABEL; / SELECT 'y'::SUBLABEL; / SELECT 'z'::ICON;
    let labelPrefix: string | null = null;
    let sublabelPrefix: string | null = null;
    let iconPrefix: string | null = null;
    let sqlBody = sql;
    // Extraire un ou plusieurs SELECT de configuration en tête (format combiné ou individuel)
    let extracted = true;
    while (extracted) {
        extracted = false;
        const cfgM = sqlBody.match(/^(\s*SELECT\s+(?:'[^']*'\s*::(?:LABEL|SUBLABEL|ICON)\b\s*(?:,\s*)?)+;[ \t]*\r?\n?)/i);
        if (cfgM) {
            const block = cfgM[1];
            const lM = block.match(/'([^']*)'\s*::LABEL\b/i);
            const sM = block.match(/'([^']*)'\s*::SUBLABEL\b/i);
            const iM = block.match(/'([^']*)'\s*::ICON\b/i);
            if (lM || sM || iM) {
                if (lM && labelPrefix === null) labelPrefix = lM[1];
                if (sM && sublabelPrefix === null) sublabelPrefix = sM[1];
                if (iM && iconPrefix === null) iconPrefix = iM[1];
                sqlBody = sqlBody.slice(block.length);
                extracted = true;
            }
        }
    }

    /** Injecte label/sublabel/icon dans l'AST si présents */
    function withLabel(ast: SqlBlockAst): SqlBlockAst {
        if (labelPrefix === null && sublabelPrefix === null && iconPrefix === null) return ast;
        const base = ast.chartConfig ?? { chartType: 'kpi', columns: [] };
        const chartConfig: ChartConfig = { ...base };
        if (labelPrefix !== null) chartConfig.label = labelPrefix;
        if (sublabelPrefix !== null) (chartConfig as any).sublabel = sublabelPrefix;
        if (iconPrefix !== null) (chartConfig as any).icon = iconPrefix;
        return { ...ast, chartConfig };
    }
    function withLabelResult(r: SqlParseResult): SqlParseResult {
        if (labelPrefix === null && sublabelPrefix === null && iconPrefix === null) return r;
        if (!r.compatible || !r.ast) return r;
        return { ...r, ast: withLabel(r.ast) };
    }

    // 1. Parser standard (P0)
    const standard = sqlToAst(sqlBody, materialize);
    if (standard.compatible && standard.ast) return withLabelResult(standard);

    // 2. Parser par CTE intelligent
    const normalized = sqlBody.replace(/[ \t]+/g, ' ').trim();
    const smartCte = tryParseCteChainSmart(normalized, materialize);
    if (smartCte) return withLabelResult({ ast: smartCte, compatible: true });

    // 3. Parser simple SELECT étendu (sans CTE)
    const smartSimple = tryParseSimpleSmart(normalized, materialize);
    if (smartSimple) return withLabelResult({ ast: smartSimple, compatible: true });

    // 4. Fallback ultime : SQL non reconnu → étape custom_sql sans source
    //    Préserve le SQL intégralement, sans perte de données.
    //    Pour les requêtes WITH, tente d'extraire le chartConfig depuis le SELECT final.
    if (normalized) {
        let fallbackChartConfig: ChartConfig | undefined;
        if (/^WITH\b/i.test(normalized)) {
            const finalSql = extractFinalSelectFromWithQuery(normalized);
            if (finalSql) fallbackChartConfig = parseChartFinalSelect(finalSql) ?? undefined;
        }
        return withLabelResult({
            ast: {
                source: '',
                steps: [{ type: 'custom_sql', sql: normalized }],
                materialized: materialize,
                ...(fallbackChartConfig ? { chartConfig: fallbackChartConfig } : {}),
            },
            compatible: true,
        });
    }

    // 5. Échec : retourne l'erreur d'origine
    return standard;
}
