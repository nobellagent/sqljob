// Rôles de graphique et réécriture des casts `::ROLE` (moteur Ducklings).

export const CHART_TYPE_NAMES = [
    // Chart roles
    'XAXIS', 'YAXIS',
    'BARCHART', 'BARCHART_STACKED', 'BARCHART_PERCENT', 'BARCHART_STACKED_PERCENT',
    'LINECHART', 'LINECHART_PERCENT',
    'PIECHART', 'PIECHART_PERCENT',
    'DONUTCHART', 'DONUTCHART_PERCENT',
    'BOXPLOT',
    'GAUGE', 'GAUGE_PERCENT',
    'CATEGORY', 'COLOR', 'COLORS', 'RANGE', 'LABELS',
    'XLINE', 'YLINE', 'LABEL', 'SUBLABEL',
    // KPI roles
    'KPI', 'ICON', 'PERCENT', 'COMPARE', 'TREND_PERCENT', 'TREND',
    // Layout/filter roles (hors scope rendu mais on les crée pour la syntaxe)
    'SECTION', 'HEADER_IMAGE', 'FOOTER_LINK',
    'DOWNLOAD_CSV', 'DOWNLOAD_PDF', 'DOWNLOAD_XLSX',
    'DROPDOWN', 'DROPDOWN_MULTI',
    'DATEPICKER', 'DATEPICKER_FROM', 'DATEPICKER_TO',
    'INPUT',
];

export function stripChartCasts(sql: string): { strippedSql: string, columnTypes: Record<string, string> } {
    const columnTypes: Record<string, string> = {};
    const roleNames = CHART_TYPE_NAMES.join('|');
    // Matches: expr::ROLENAME [AS "alias" | AS alias]?
    // expr = array literal [...], double-quoted "...", single-quoted '...', simple identifier, table.column, or closing )
    const re = new RegExp(`(\\[[^\\]]*\\]|"[^"]*"|'[^']*'|[\\w.]+|\\))\\s*::\\s*(${roleNames})\\b(\\s+AS\\s+(?:"([^"]+)"|(\\w+)))?`, 'gi');
    const strippedSql = sql.replace(re, (_, expr, role, asClause, dqAlias, bareAlias) => {
        const roleUpper = role.toUpperCase();
        let colName: string | null;
        let replacement: string;

        if (expr.startsWith('[')) {
            // Array literal [0, 10] or ['a', 'b']: DuckDB gives an ugly column name,
            // so we always inject an explicit alias equal to the role name.
            colName = dqAlias ?? bareAlias ?? roleUpper;
            replacement = expr + (asClause ?? ` AS "${roleUpper}"`);
        } else if (expr.startsWith('"') && expr.endsWith('"')) {
            // Double-quoted identifier "Quantité" → strip quotes for colName
            colName = dqAlias ?? bareAlias ?? expr.slice(1, -1);
            replacement = expr + (asClause ?? '');
        } else if (expr.startsWith("'") && expr.endsWith("'")) {
            // Single-quoted string literal 'text' → colName is the string content
            colName = dqAlias ?? bareAlias ?? expr.slice(1, -1);
            // Without an explicit alias, DuckDB names the column with the quotes included
            // (e.g. 'calendar-days' → column "'calendar-days'"). Inject AS to match colName.
            replacement = asClause ? expr + asClause : `${expr} AS "${colName.replace(/"/g, '\\"')}"`;

        } else if (expr !== ')' && /^\d/.test(expr) && expr.includes('.')) {
            // Numeric literal with decimal point (e.g. 0.22)
            colName = dqAlias ?? bareAlias ?? expr;
            replacement = expr + (asClause ?? '');
        } else {
            // Identifier (possibly qualified: schema.table.col) or closing ')'
            colName = dqAlias ?? bareAlias ?? (expr === ')' ? null : expr.split('.').at(-1));
            replacement = expr + (asClause ?? '');
        }

        if (colName) columnTypes[colName] = roleUpper;
        return replacement;
    });
    return { strippedSql, columnTypes };
}
