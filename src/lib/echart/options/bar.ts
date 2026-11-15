// Module extrait de EChartSqlParser.ts — barres et barres/lignes.

import {_buildMarkLines, _buildMarkPoints, _num, _pivot, _str, _uniqueOrdered} from '../helpers'
import {ColumnRole} from '../roles'
import {_axisLabelSize} from '../theme'

export function _buildBarOption(results, roleMap, chartType, base, textColor, horizontal) {
    const isStacked = chartType === 'bar_stacked' || chartType === 'bar_percent' || chartType === 'bar_stacked_percent';
    const isPercent = chartType === 'bar_percent' || chartType === 'bar_stacked_percent';
    const stack = isStacked ? 'total' : undefined;

    // Determine value columns (prefer most-specific role)
    const valueCols: ColumnRole[] = (
        roleMap['BARCHART_STACKED_PERCENT'] ||
        roleMap['BARCHART_PERCENT'] ||
        roleMap['BARCHART_STACKED'] ||
        roleMap['BARCHART'] ||
        []
    );
    const axisCols = roleMap[horizontal ? 'YAXIS' : 'XAXIS'] || [];
    const categoryCols = roleMap['CATEGORY'] || [];
    const colorCols = roleMap['COLOR'] || [];
    const axisCol = axisCols[0]?.originalName;

    let axisData: string[] = [];
    const series: any[] = [];

    if (categoryCols.length > 0 && valueCols.length > 0) {
        // Multi-series via CATEGORY pivot
        const catCol = categoryCols[0].originalName;
        const valueCol = valueCols[0].originalName;
        const colorCol = colorCols[0]?.originalName;

        axisData = axisCol ? _uniqueOrdered(results, axisCol) : [];
        const categories = _uniqueOrdered(results, catCol);
        const pivotData = _pivot(results, catCol, axisCol || '', valueCol);

        // Custom colors per category (from COLOR column)
        const customColors: Record<string, string> = {};
        if (colorCol) {
            for (const row of results) {
                const cat = _str(row[catCol]);
                if (row[colorCol]) customColors[cat] = _str(row[colorCol]);
            }
        }

        for (const cat of categories) {
            const data = axisData.map(ax => pivotData[cat]?.[ax] ?? 0);
            const s: any = {
                name: cat,
                type: 'bar',
                data,
                stack,
                barMaxWidth: 60,
                emphasis: { focus: 'series' },
            };
            if (isPercent) {
                s.label = { show: true, formatter: (p) => p.value > 0 ? p.value.toFixed(1) + '%' : '', position: 'inside', fontSize: 10 };
            }
            if (customColors[cat]) s.itemStyle = { color: customColors[cat] };
            series.push(s);
        }
    } else if (valueCols.length > 0) {
        // Multiple value columns → multiple named series
        axisData = axisCol ? results.map(r => _str(r[axisCol])) : [];
        const colorCol = colorCols[0]?.originalName;

        for (const vc of valueCols) {
            const s: any = {
                name: vc.displayName,
                type: 'bar',
                stack,
                barMaxWidth: 60,
                emphasis: { focus: 'series' },
                data: results.map(r => {
                    const val = _num(r[vc.originalName]);
                    if (colorCol && r[colorCol]) {
                        return { value: val, itemStyle: { color: _str(r[colorCol]) } };
                    }
                    return val;
                }),
            };
            if (isPercent) {
                s.label = { show: true, formatter: (p) => p.value > 0 ? p.value.toFixed(1) + '%' : '', position: 'inside', fontSize: 10 };
            }
            series.push(s);
        }
    }

    // Attach markLines to first series
    const markLineData = _buildMarkLines(results, roleMap);
    if (markLineData.length > 0 && series.length > 0) {
        series[0].markLine = {
            symbol: ['none', 'none'],
            data: markLineData,
            label: { show: true },
        };
    }

    // Attach markPoints (LABEL annotations) to first series
    const markPointData = _buildMarkPoints(results, roleMap);
    if (markPointData.length > 0 && series.length > 0) {
        series[0].markPoint = {
            symbol: 'pin',
            symbolSize: 28,
            data: markPointData,
            label: { color: '#fff', fontSize: 9 },
        };
    }

    const categoryAxis = { type: 'category', data: axisData, axisLabel: { color: textColor, fontSize: _axisLabelSize() } };
    const valueAxis: any = {
        type: 'value',
        axisLabel: {
            color: textColor,
            ...(isPercent ? { formatter: '{value}%' } : {}),
        },
        ...(isPercent ? { max: 100 } : {}),
    };

    return {
        ...base,
        tooltip: {
            trigger: 'axis',
            confine: true,
            axisPointer: { type: 'shadow' },
            ...(isPercent ? { formatter: (params) => {
                const name = params[0]?.axisValue || '';
                const lines = params.map(p => `${p.marker}${p.seriesName}: ${_num(p.value).toFixed(1)}%`);
                return [name, ...lines].join('<br/>');
            }} : {}),
        },
        xAxis: horizontal ? valueAxis : categoryAxis,
        yAxis: horizontal ? categoryAxis : valueAxis,
        series,
    };
}

// ─── Bar + Line mixed chart ───────────────────────────────────────────────────

export function _buildBarLineOption(results, roleMap, base, textColor) {
    const axisCols = roleMap['XAXIS'] || [];
    const axisCol = axisCols[0]?.originalName;
    const axisData: string[] = axisCol ? results.map(r => _str(r[axisCol])) : [];

    const barCols: ColumnRole[] = roleMap['BARCHART'] || [];
    const lineCols: ColumnRole[] = roleMap['LINECHART'] || [];

    const series: any[] = [];
    for (const vc of barCols) {
        series.push({
            name: vc.displayName,
            type: 'bar',
            barMaxWidth: 60,
            emphasis: { focus: 'series' },
            data: results.map(r => _num(r[vc.originalName])),
        });
    }
    for (const vc of lineCols) {
        series.push({
            name: vc.displayName,
            type: 'line',
            smooth: true,
            emphasis: { focus: 'series' },
            data: results.map(r => _num(r[vc.originalName])),
        });
    }

    return {
        ...base,
        tooltip: { trigger: 'axis', confine: true, axisPointer: { type: 'shadow' } },
        xAxis: { type: 'category', data: axisData, axisLabel: { color: textColor, fontSize: _axisLabelSize() } },
        yAxis: { type: 'value', axisLabel: { color: textColor, fontSize: _axisLabelSize() } },
        series,
    };
}

// ─── Line chart ──────────────────────────────────────────────────────────────

