export interface RoleSlotConfig {
    role: string
    label: string
    multiple: boolean   // true → liste d'entrées, false → select unique
    optional: boolean   // true → "-- aucune --" possible
    hasLabel: boolean   // true → champ texte pour l'alias AS "Label"
}

export const CHART_TYPE_CONFIGS: Record<string, { label: string; icon: string; roles: RoleSlotConfig[] }> = {
    datatable: {
        label: 'Datatable',
        icon: 'material-symbols-light:table',
        roles: [],
    },
    kpi: {
        label: 'KPI',
        icon: 'material-symbols-light:123',
        roles: [
            { role: 'KPI',           label: 'Valeur',        multiple: true,  optional: false, hasLabel: true },
            { role: 'PERCENT',       label: 'Pourcentage',   multiple: false, optional: true,  hasLabel: true },
            { role: 'COMPARE',       label: 'Comparaison',   multiple: false, optional: true,  hasLabel: true },
            { role: 'TREND',         label: 'Tendance',      multiple: false, optional: true,  hasLabel: true },
            { role: 'TREND_PERCENT', label: 'Tendance (%)',  multiple: false, optional: true,  hasLabel: true },
        ],
    },
    bar: {
        label: 'Barres',
        icon: 'material-symbols-light:bar-chart',
        roles: [
            { role: 'XAXIS',    label: 'Axe X',      multiple: false, optional: false, hasLabel: true },
            { role: 'BARCHART', label: 'Barres',      multiple: true,  optional: false, hasLabel: true },
            { role: 'CATEGORY', label: 'Catégorie',   multiple: false, optional: true,  hasLabel: true },
            { role: 'COLOR',    label: 'Couleur',     multiple: false, optional: true,  hasLabel: false },
        ],
    },
    line: {
        label: 'Lignes',
        icon: 'material-symbols-light:show-chart',
        roles: [
            { role: 'XAXIS',     label: 'Axe X',    multiple: false, optional: false, hasLabel: true },
            { role: 'LINECHART', label: 'Courbes',   multiple: true,  optional: false, hasLabel: true },
            { role: 'CATEGORY',  label: 'Catégorie', multiple: false, optional: true,  hasLabel: true },
        ],
    },
    'bar+line': {
        label: 'Barres + Lignes',
        icon: 'material-symbols-light:stacked-bar-chart',
        roles: [
            { role: 'XAXIS',     label: 'Axe X',    multiple: false, optional: false, hasLabel: true },
            { role: 'BARCHART',  label: 'Barres',    multiple: true,  optional: false, hasLabel: true },
            { role: 'LINECHART', label: 'Courbes',   multiple: true,  optional: false, hasLabel: true },
        ],
    },
    pie: {
        label: 'Camembert',
        icon: 'material-symbols-light:pie-chart',
        roles: [
            { role: 'CATEGORY', label: 'Catégorie', multiple: false, optional: false, hasLabel: true },
            { role: 'PIECHART', label: 'Valeurs',   multiple: false, optional: false, hasLabel: true },
            { role: 'COLOR',    label: 'Couleur',   multiple: false, optional: true,  hasLabel: false },
        ],
    },
    donut: {
        label: 'Donut',
        icon: 'material-symbols-light:donut-large',
        roles: [
            { role: 'CATEGORY',   label: 'Catégorie', multiple: false, optional: false, hasLabel: true },
            { role: 'DONUTCHART', label: 'Valeurs',   multiple: false, optional: false, hasLabel: true },
            { role: 'COLOR',      label: 'Couleur',   multiple: false, optional: true,  hasLabel: false },
        ],
    },
    gauge: {
        label: 'Jauge',
        icon: 'material-symbols-light:speed',
        roles: [
            { role: 'GAUGE',   label: 'Valeur',   multiple: false, optional: false, hasLabel: true },
            { role: 'RANGE',   label: 'Plage',    multiple: false, optional: true,  hasLabel: false },
            { role: 'COLORS',  label: 'Couleurs', multiple: false, optional: true,  hasLabel: false },
            { role: 'LABELS',  label: 'Labels',   multiple: false, optional: true,  hasLabel: false },
        ],
    },
    boxplot: {
        label: 'Boîte à moustaches',
        icon: 'material-symbols-light:candlestick-chart',
        roles: [
            { role: 'BOXPLOT', label: 'Valeurs', multiple: true,  optional: false, hasLabel: true },
            { role: 'XAXIS',   label: 'Axe X',   multiple: false, optional: true,  hasLabel: true },
        ],
    },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

