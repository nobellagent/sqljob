// Module extrait de EChartSqlParser.ts — helpers internes.

import {ColumnRole} from './roles'

export function _uniqueOrdered(results: any[], colName: string): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const row of results) {
        const v = _str(row[colName]);
        if (!seen.has(v)) { seen.add(v); out.push(v); }
    }
    return out;
}

export function _str(v: any): string {
    if (v === null || v === undefined) return '';
    if (v instanceof Date) return v.toISOString().split('T')[0];
    return String(v);
}

export function _num(v: any): number {
    const n = Number(v);
    return isNaN(n) ? 0 : n;
}

/** Build a pivot: category → axisValue → numeric value */
export function _pivot(results: any[], catCol: string, axisCol: string, valueCol: string):
    Record<string, Record<string, number>> {
    const map: Record<string, Record<string, number>> = {};
    for (const row of results) {
        const cat = _str(row[catCol]);
        const ax = _str(row[axisCol]);
        if (!map[cat]) map[cat] = {};
        map[cat][ax] = _num(row[valueCol]);
    }
    return map;
}

/** Collect XLINE / YLINE markLine data from results */
export function _buildMarkLines(results: any[], roleMap: Record<string, ColumnRole[]>): any[] {
    const data: any[] = [];
    for (const col of (roleMap['XLINE'] || [])) {
        for (const row of results) {
            const v = row[col.originalName];
            if (v !== null && v !== undefined) {
                data.push({ xAxis: _str(v), name: col.displayName, lineStyle: { type: 'dashed' } });
            }
        }
    }
    for (const col of (roleMap['YLINE'] || [])) {
        for (const row of results) {
            const v = row[col.originalName];
            if (v !== null && v !== undefined) {
                data.push({ yAxis: _num(v), name: col.displayName, lineStyle: { type: 'dashed' } });
            }
        }
    }
    return data;
}

/** Collect LABEL markPoint data from results (text annotations at XAXIS position) */
export function _buildMarkPoints(results: any[], roleMap: Record<string, ColumnRole[]>): any[] {
    const labelCols = roleMap['LABEL'] || [];
    if (labelCols.length === 0) return [];

    const axisCols = roleMap['XAXIS'] || roleMap['YAXIS'] || [];
    const axisCol = axisCols[0]?.originalName;
    const data: any[] = [];

    for (const col of labelCols) {
        for (const row of results) {
            const labelVal = row[col.originalName];
            if (labelVal === null || labelVal === undefined || _str(labelVal) === '') continue;
            const point: any = {
                name: _str(labelVal),
                value: _str(labelVal),
                symbol: 'pin',
                symbolSize: 28,
                label: { formatter: '{b}', position: 'top', fontSize: 10 },
            };
            if (axisCol) {
                point.xAxis = _str(row[axisCol]);
            }
            data.push(point);
        }
    }
    return data;
}

// ─── Bar chart ───────────────────────────────────────────────────────────────

export function _esc(s: string): string {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function _fmtVal(v: any): string {
    if (v === null || v === undefined) return '–';
    if (typeof v === 'number') return v.toLocaleString('fr-FR');
    return _esc(String(v));
}

/**
 * Returns an HTML string for a KPI / Stat single-value display.
 * Used when chartType === 'kpi' (no ECharts instance needed).
 *
 * @param label - optional title override (from SELECT '...'::LABEL; or chartConfig.label)
 *
 * Two display modes:
 *  - Stat mode (TEXT_LARGE / TEXT_MEDIUM / TEXT_SMALL present):
 *    centered card with title, big value, comparison row below
 *  - KPI mode (legacy LABEL / PERCENT / COMPARE / TREND):
 *    DaisyUI stat cards side by side
 */
