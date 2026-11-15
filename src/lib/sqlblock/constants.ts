import type {SqlBlockAst} from '../SqlBlockTypes'

// Module extrait de SqlBlockService.ts — constantes de nommage.

import type {ChartConfig} from '../SqlBlockTypes'

export const CTE_PREFIX = '_sqlblock_s';

/** Slug court par type de step — inclus dans le nom auto des CTEs. */
export const STEP_TYPE_SLUG: Record<string, string> = {
    select_columns:  'select',
    exclude_columns: 'exclude',
    change_type:     'cast',
    filter_rows:     'filter',
    sort:            'sort',
    top_n:           'limit',
    rename_columns:  'rename',
    derive:          'derive',
    fill_null:       'fill',
    group_by:        'group',
    join:            'join',
    union:           'union',
    pivot:           'pivot',
    unpivot:         'unpivot',
    window:          'window',
    unnest:          'unnest',
    json_extract:    'json',
    date_trunc:      'date',
    custom_sql:      'sql',
};
export const SLUG_TO_STEP_TYPE: Record<string, string> = Object.fromEntries(
    Object.entries(STEP_TYPE_SLUG).map(([k, v]) => [v, k])
);

/** Retourne le nom de CTE d'un step : son nom personnalisé ou le nom auto `_sqlblock_sN_slug`. */
export const CHART_ROLES_ORDERED = [
    'BARCHART_STACKED_PERCENT', 'BARCHART_STACKED', 'BARCHART_PERCENT', 'BARCHART',
    'LINECHART_PERCENT', 'LINECHART',
    'PIECHART_PERCENT', 'PIECHART',
    'DONUTCHART_PERCENT', 'DONUTCHART',
    'GAUGE_PERCENT', 'GAUGE',
    'BOXPLOT',
    'XAXIS', 'YAXIS', 'CATEGORY',
    'COLOR', 'COLORS', 'LABELS', 'RANGE',
    'KPI', 'ICON', 'LABEL', 'SUBLABEL', 'PERCENT', 'COMPARE', 'TREND_PERCENT', 'TREND', 'XLINE', 'YLINE',
];
export const CHART_ROLES_SET = new Set(CHART_ROLES_ORDERED);

/**
 * Génère un SELECT final avec annotations ::ROLE à partir d'une ChartConfig.
 * Ex: SELECT "date"::XAXIS, "revenue"::BARCHART AS "Revenue" FROM "last_cte"
 */
export const CHART_AXIS_ROLES = new Set(['XAXIS', 'YAXIS', 'CATEGORY', 'COLOR', 'COLORS']);
export const COL_PAT = '(?:"[^"]*"|[a-zA-Z_][a-zA-Z0-9_]*)';

export interface SqlParseResult {
    ast: SqlBlockAst | null;
    compatible: boolean;
    error?: string;
}
