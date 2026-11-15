// Module extrait de SqlBlockService.ts — SELECT final des graphiques.

import type {ChartColumnRole, ChartConfig, FilterValueKind} from '../SqlBlockTypes'
import {CHART_AXIS_ROLES, CHART_ROLES_ORDERED, CHART_ROLES_SET} from './constants'
import {quoteId} from './helpers'

export function buildChartFinalSelect(fromSource: string, cfg: ChartConfig): string {
    // Préfixe combiné LABEL / SUBLABEL / ICON dans un seul SELECT si au moins un est défini
    const cfgParts: string[] = [];
    if (cfg.label?.trim()) {
        const escaped = cfg.label.trim().replace(/'/g, "''");
        cfgParts.push(`'${escaped}'::LABEL`);
    }
    if ((cfg as any).sublabel?.trim()) {
        const escaped = (cfg as any).sublabel.trim().replace(/'/g, "''");
        cfgParts.push(`'${escaped}'::SUBLABEL`);
    }
    if ((cfg as any).icon?.trim()) {
        const escaped = (cfg as any).icon.trim().replace(/'/g, "''");
        cfgParts.push(`'${escaped}'::ICON`);
    }
    const prefix = cfgParts.length > 0 ? `SELECT ${cfgParts.join(',\n       ')};\n` : '';
    // Axe / catégorie / couleur en premier, puis les données
    const sorted = [...cfg.columns].sort((a, b) => {
        const aAxis = CHART_AXIS_ROLES.has(a.role.toUpperCase()) ? 0 : 1;
        const bAxis = CHART_AXIS_ROLES.has(b.role.toUpperCase()) ? 0 : 1;
        return aAxis - bAxis;
    });
    const parts = sorted.map(col => {
        const role = col.role.toUpperCase();
        const alias = col.label?.trim() ? ` AS "${col.label.trim()}"` : '';
        let expr: string;
        if (col.valueKind === 'literal') {
            const n = Number(col.column);
            expr = col.column.trim() !== '' && !isNaN(n) ? col.column : `'${col.column.replace(/'/g, "''")}'`;
        } else if (col.valueKind === 'param') {
            expr = col.column; // {{paramName}} — pas de quoting
        } else if (col.valueKind === 'expression') {
            expr = `(${col.column})`;
        } else {
            expr = quoteId(col.column); // colonne (défaut)
        }
        return `  ${expr}::${role}${alias}`;
    });
    return `${prefix}SELECT\n${parts.join(',\n')}\nFROM ${fromSource}`;
}

/**
 * Parse un SELECT final pour extraire une ChartConfig.
 * Reconnaît la syntaxe: col::ROLE [AS "alias"], ...
 * Retourne null si aucun rôle chart n'est trouvé.
 */
export function parseChartFinalSelect(selectSql: string): ChartConfig | null {
    // Extrait le titre/sous-titre/icône depuis les préfixes ::LABEL / ::SUBLABEL / ::ICON
    // Supporte le format combiné : SELECT 'title'::LABEL, 'sub'::SUBLABEL, 'icon'::ICON;
    // et le format individuel legacy : SELECT 'title'::LABEL;
    let cfgLabel: string | undefined;
    let cfgSublabel: string | undefined;
    let cfgIcon: string | undefined;
    const labelM = selectSql.match(/'([^']*)'\s*::LABEL\b/i);
    if (labelM) cfgLabel = labelM[1];
    const sublabelM = selectSql.match(/'([^']*)'\s*::SUBLABEL\b/i);
    if (sublabelM) cfgSublabel = sublabelM[1];
    const iconM = selectSql.match(/'([^']*)'\s*::ICON\b/i);
    if (iconM) cfgIcon = iconM[1];

    const rolesPattern = CHART_ROLES_ORDERED.join('|');
    // Match: ("col" | {{param}} | 'literal' | (expression) | unquoted)::ROLE [AS ("label" | label)]
    // Groups: 1=double-quoted col, 2=param({{...}}), 3=single-quoted literal,
    //         4=parenthesised expression, 5=unquoted
    const re = new RegExp(
        `(?:"([^"]+)"|\\{\\{([^}]+)\\}\\}|'([^']*)'|\\(((?:[^()]+|\\([^()]*\\))*)\\)|([\\w.]+))\\s*::\\s*(${rolesPattern})(?:\\s+AS\\s+(?:"([^"]+)"|([\\w]+)))?`,
        'gi'
    );
    const columns: ChartColumnRole[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(selectSql)) !== null) {
        const role = m[6].toUpperCase();
        const label = m[7] ?? m[8] ?? undefined;
        // Skip LABEL / SUBLABEL / ICON roles — they are prefix statements, not data columns
        if (!CHART_ROLES_SET.has(role) || role === 'LABEL' || role === 'SUBLABEL' || role === 'ICON') continue;

        let column: string;
        let valueKind: FilterValueKind | undefined;

        if (m[1] !== undefined) {
            // "double-quoted" → column identifier
            column = m[1];
            valueKind = 'column';
        } else if (m[2] !== undefined) {
            // {{param}} → parameter
            column = `{{${m[2]}}}`;
            valueKind = 'param';
        } else if (m[3] !== undefined) {
            // 'single-quoted' → literal string (may be numeric)
            column = m[3];
            valueKind = 'literal';
        } else if (m[4] !== undefined) {
            // (expression) → SQL expression wrapped in parens
            column = m[4];
            valueKind = 'expression';
        } else {
            // unquoted word: numeric token → literal, otherwise → column
            column = m[5];
            valueKind = /^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(column) ? 'literal' : 'column';
        }

        const entry: ChartColumnRole = { column, role, label };
        if (valueKind !== 'column') entry.valueKind = valueKind;
        columns.push(entry);
    }
    if (!columns.length && !cfgLabel && !cfgIcon) return null;

    // Déduire le chartType depuis les rôles présents (même logique que EChartSqlParser)
    const roleSet = new Set(columns.map(c => c.role));
    const has = (r: string) => roleSet.has(r);
    let chartType = 'bar';
    if (has('BARCHART_STACKED_PERCENT')) chartType = 'bar';
    else if (has('BARCHART_PERCENT')) chartType = 'bar';
    else if (has('BARCHART_STACKED')) chartType = 'bar';
    else if (has('BARCHART') && has('LINECHART')) chartType = 'bar+line';
    else if (has('BARCHART')) chartType = has('YAXIS') && !has('XAXIS') ? 'bar' : 'bar';
    else if (has('LINECHART_PERCENT') || has('LINECHART')) chartType = 'line';
    else if (has('PIECHART_PERCENT') || has('PIECHART')) chartType = 'pie';
    else if (has('DONUTCHART_PERCENT') || has('DONUTCHART')) chartType = 'donut';
    else if (has('GAUGE_PERCENT') || has('GAUGE')) chartType = 'gauge';
    else if (has('BOXPLOT')) chartType = 'boxplot';
    else if (has('KPI') || has('PERCENT') || has('COMPARE') || has('TREND') || has('TREND_PERCENT')) chartType = 'kpi';

    const cfg: ChartConfig = { chartType, columns };
    if (cfgLabel) cfg.label = cfgLabel;
    if (cfgSublabel) (cfg as any).sublabel = cfgSublabel;
    if (cfgIcon) (cfg as any).icon = cfgIcon;
    return cfg;
}

