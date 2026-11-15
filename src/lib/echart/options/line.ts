// Module extrait de EChartSqlParser.ts — lignes.

import {_buildMarkLines, _buildMarkPoints, _num, _pivot, _str, _uniqueOrdered} from '../helpers'
import {ColumnRole} from '../roles'
import {_axisLabelSize} from '../theme'

export function _buildLineOption(results, roleMap, chartType, base, textColor) {
    const isPercent = chartType === 'line_percent';
    const stack = isPercent ? 'total' : undefined;

    const valueCols: ColumnRole[] = roleMap['LINECHART_PERCENT'] || roleMap['LINECHART'] || [];
    const axisCols = roleMap['XAXIS'] || [];
    const categoryCols = roleMap['CATEGORY'] || [];
    const colorCols = roleMap['COLOR'] || [];
    const axisCol = axisCols[0]?.originalName;

    let axisData: string[] = [];
    const series: any[] = [];

    if (categoryCols.length > 0 && valueCols.length > 0) {
        const catCol = categoryCols[0].originalName;
        const valueCol = valueCols[0].originalName;
        const colorCol = colorCols[0]?.originalName;

        axisData = axisCol ? _uniqueOrdered(results, axisCol) : [];
        const categories = _uniqueOrdered(results, catCol);
        const pivotData = _pivot(results, catCol, axisCol || '', valueCol);

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
                type: 'line',
                smooth: true,
                data,
                stack,
                areaStyle: isPercent ? {} : undefined,
                emphasis: { focus: 'series' },
            };
            if (customColors[cat]) s.lineStyle = { color: customColors[cat] };
            series.push(s);
        }
    } else {
        axisData = axisCol ? results.map(r => _str(r[axisCol])) : [];
        const colorCol = colorCols[0]?.originalName;

        for (const vc of valueCols) {
            const customColor = colorCol ? _str(results[0]?.[colorCol]) : undefined;
            const s: any = {
                name: vc.displayName,
                type: 'line',
                smooth: true,
                stack,
                areaStyle: isPercent ? {} : undefined,
                emphasis: { focus: 'series' },
                data: results.map(r => _num(r[vc.originalName])),
            };
            if (customColor) s.lineStyle = { color: customColor };
            series.push(s);
        }
    }

    // Attach markLines
    const markLineData = _buildMarkLines(results, roleMap);
    if (markLineData.length > 0 && series.length > 0) {
        series[0].markLine = {
            symbol: ['none', 'none'],
            data: markLineData,
            label: { show: true },
        };
    }

    // Attach markPoints (LABEL annotations)
    const markPointData = _buildMarkPoints(results, roleMap);
    if (markPointData.length > 0 && series.length > 0) {
        series[0].markPoint = {
            symbol: 'pin',
            symbolSize: 28,
            data: markPointData,
            label: { color: '#fff', fontSize: 9 },
        };
    }

    return {
        ...base,
        tooltip: {
            trigger: 'axis',
            confine: true,
            ...(isPercent ? { formatter: (params) => {
                const name = params[0]?.axisValue || '';
                const lines = params.map(p => `${p.marker}${p.seriesName}: ${_num(p.value).toFixed(1)}%`);
                return [name, ...lines].join('<br/>');
            }} : {}),
        },
        xAxis: { type: 'category', data: axisData, axisLabel: { color: textColor, fontSize: _axisLabelSize() } },
        yAxis: {
            type: 'value',
            axisLabel: {
                color: textColor,
                ...(isPercent ? { formatter: '{value}%' } : {}),
            },
            ...(isPercent ? { max: 100 } : {}),
        },
        series,
    };
}

// ─── Pie / Donut chart ───────────────────────────────────────────────────────

