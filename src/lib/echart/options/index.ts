// Module extrait de EChartSqlParser.ts — sélection du type de graphique.

import {_buildBarLineOption, _buildBarOption} from './bar'
import {_buildBoxplotOption} from './boxplot'
import {_buildGaugeOption} from './gauge'
import {_buildLineOption} from './line'
import {_buildPieOption} from './pie'
import {ParsedColumnRoles} from '../roles'
import {_getChartColors, _isDark} from '../theme'

export function buildEChartsOption(results: any[], parsed: ParsedColumnRoles): object | null {
    const { roleMap, chartType } = parsed;
    if (!results || results.length === 0) return null;

    const dark = _isDark();
    const textColor = dark ? '#e2e8f0' : '#334155';

    const base = {
        backgroundColor: 'transparent',
        color: _getChartColors(),
        textStyle: { color: textColor, fontFamily: 'inherit' },
        tooltip: { trigger: 'axis', confine: true },
        legend: { show: true, textStyle: { color: textColor } },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    };

    switch (chartType) {
        case 'bar':
            return _buildBarOption(results, roleMap, 'bar', base, textColor, false);
        case 'bar_stacked':
            return _buildBarOption(results, roleMap, 'bar_stacked', base, textColor, false);
        case 'bar_percent':
            return _buildBarOption(results, roleMap, 'bar_percent', base, textColor, false);
        case 'bar_stacked_percent':
            return _buildBarOption(results, roleMap, 'bar_stacked_percent', base, textColor, false);
        case 'bar_horizontal':
            return _buildBarOption(results, roleMap, 'bar', base, textColor, true);
        case 'line':
            return _buildLineOption(results, roleMap, 'line', base, textColor);
        case 'line_percent':
            return _buildLineOption(results, roleMap, 'line_percent', base, textColor);
        case 'pie':
        case 'pie_percent':
            return _buildPieOption(results, roleMap, chartType, base, textColor, false);
        case 'donut':
        case 'donut_percent':
            return _buildPieOption(results, roleMap, chartType, base, textColor, true);
        case 'bar_line':
            return _buildBarLineOption(results, roleMap, base, textColor);
        case 'gauge':
        case 'gauge_percent':
            return _buildGaugeOption(results, roleMap, chartType, base, textColor);
        case 'boxplot':
            return _buildBoxplotOption(results, roleMap, base, textColor);
        case 'kpi':
            // KPI is handled separately (rendered as HTML, not ECharts)
            return null;
        default:
            return null;
    }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Collect unique values from a column, preserving first-seen order */
