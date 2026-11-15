// Module extrait de EChartSqlParser.ts — rôles de colonnes.

const KNOWN_ROLES = [
    // Ordering matters: longer/more-specific roles MUST come before shorter ones
    // so suffix matching doesn't accidentally match a prefix
    'BARCHART_STACKED_PERCENT',
    'BARCHART_STACKED',
    'BARCHART_PERCENT',
    'BARCHART',
    'LINECHART_PERCENT',
    'LINECHART',
    'PIECHART_PERCENT',
    'PIECHART',
    'DONUTCHART_PERCENT',
    'DONUTCHART',
    'GAUGE_PERCENT',
    'GAUGE',
    'BOXPLOT',
    'XAXIS',
    'YAXIS',
    'CATEGORY',
    'COLOR',
    'COLORS',
    'LABELS',
    'RANGE',
    'KPI',
    'ICON',
    'LABEL',
    'SUBLABEL',
    'PERCENT',
    'COMPARE',
    'TREND_PERCENT',
    'TREND',
    'XLINE',
    'YLINE',
];

const KNOWN_ROLES_SET = new Set(KNOWN_ROLES);

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ColumnRole {
    originalName: string;   // raw column name in result object
    role: string;           // uppercase role string (e.g. 'BARCHART')
    displayName: string;    // human label for legend / tooltip
}

export interface ParsedColumnRoles {
    roles: ColumnRole[];
    roleMap: Record<string, ColumnRole[]>;
    chartType: string;
}

// ─── Responsive font size via CSS clamp() ────────────────────────────────────
export function parseColumnRoles(results: any[], columnTypes?: Record<string, string>): ParsedColumnRoles {
    if (!results || results.length === 0) {
        return { roles: [], roleMap: {}, chartType: 'unknown' };
    }

    const columnNames = Object.keys(results[0]);
    const roles: ColumnRole[] = [];

    for (const colName of columnNames) {
        const upper = colName.toUpperCase();
        const colType = columnTypes?.[colName]?.toUpperCase();

        // 0. Priorité : type DuckDB (ex: ::XAXIS AS "Mon Label" → type=XAXIS, display="Mon Label")
        if (colType && KNOWN_ROLES_SET.has(colType)) {
            roles.push({ originalName: colName, role: colType, displayName: colName });
            continue;
        }

        // 1. Exact match sur le nom de colonne (rétrocompatibilité)
        if (KNOWN_ROLES_SET.has(upper)) {
            roles.push({ originalName: colName, role: upper, displayName: colName });
            continue;
        }

        // 2. Suffix match: "Label_XAXIS" → role=XAXIS, displayName="Label"
        let matched = false;
        for (const role of KNOWN_ROLES) {
            const suffix = '_' + role;
            if (upper.endsWith(suffix)) {
                const displayName = colName.substring(0, colName.length - suffix.length);
                roles.push({ originalName: colName, role, displayName });
                matched = true;
                break;
            }
        }
        if (!matched) {
            // Colonne sans rôle chart : ignorée pour les graphiques
        }
    }

    const roleMap: Record<string, ColumnRole[]> = {};
    for (const cr of roles) {
        if (!roleMap[cr.role]) roleMap[cr.role] = [];
        roleMap[cr.role].push(cr);
    }

    const chartType = _detectChartType(roleMap);
    return { roles, roleMap, chartType };
}

export function _detectChartType(roleMap: Record<string, ColumnRole[]>): string {
    const has = (r: string) => !!(roleMap[r]?.length);

    if (has('BARCHART_STACKED_PERCENT')) return 'bar_stacked_percent';
    if (has('BARCHART_PERCENT'))         return 'bar_percent';
    if (has('BARCHART_STACKED'))         return 'bar_stacked';
    if (has('BARCHART') && has('LINECHART')) return 'bar_line';
    if (has('BARCHART')) {
        // Horizontal bar when YAXIS instead of XAXIS
        if (has('YAXIS') && !has('XAXIS')) return 'bar_horizontal';
        return 'bar';
    }
    if (has('LINECHART_PERCENT')) return 'line_percent';
    if (has('LINECHART'))         return 'line';
    if (has('PIECHART_PERCENT'))  return 'pie_percent';
    if (has('PIECHART'))          return 'pie';
    if (has('DONUTCHART_PERCENT')) return 'donut_percent';
    if (has('DONUTCHART'))         return 'donut';
    if (has('GAUGE_PERCENT'))      return 'gauge_percent';
    if (has('GAUGE'))              return 'gauge';
    if (has('BOXPLOT'))            return 'boxplot';
    if (has('KPI') || has('PERCENT') || has('COMPARE') || has('TREND') || has('TREND_PERCENT')) return 'kpi';
    return 'unknown';
}

// ─── Main entry point ────────────────────────────────────────────────────────

