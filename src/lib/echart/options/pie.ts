// Module extrait de EChartSqlParser.ts — camemberts.

import {_num, _str} from '../helpers'
import {ColumnRole} from '../roles'
import {_cssClampPx} from '../theme'

export function _buildPieOption(results, roleMap, chartType, base, textColor, isDonut) {
    const isPercent = chartType.includes('percent');
    const valueCols: ColumnRole[] = (
        roleMap['PIECHART_PERCENT'] ||
        roleMap['PIECHART'] ||
        roleMap['DONUTCHART_PERCENT'] ||
        roleMap['DONUTCHART'] ||
        []
    );
    const categoryCols = roleMap['CATEGORY'] || [];
    const colorCols = roleMap['COLOR'] || [];

    const valueCol = valueCols[0]?.originalName;
    const catCol = categoryCols[0]?.originalName;
    const colorCol = colorCols[0]?.originalName;

    const data = results.map(row => {
        const entry: any = {
            name: catCol ? _str(row[catCol]) : _str(row[valueCol]),
            value: _num(row[valueCol]),
        };
        if (colorCol && row[colorCol]) {
            entry.itemStyle = { color: _str(row[colorCol]) };
        }
        return entry;
    });

    // Radius capped via vmin (shrinks on zoom-in, never exceeds 90px)
    const outerR = Math.round(_cssClampPx('clamp(55px,8vmin,90px)', 80));
    const radius = isDonut ? [Math.round(outerR * 0.58), outerR] : outerR;

    return {
        ...base,
        tooltip: {
            trigger: 'item',
            formatter: isPercent ? '{b}: {d}%' : '{b}: {c}',
        },
        legend: {
            orient: 'horizontal',
            bottom: 0,
            textStyle: { color: textColor },
        },
        series: [{
            type: 'pie',
            radius,
            data,
            label: {
                formatter: isPercent ? '{b}: {d}%' : '{b}: {c}',
                color: textColor,
            },
            emphasis: {
                itemStyle: {
                    shadowBlur: 10,
                    shadowOffsetX: 0,
                    shadowColor: 'rgba(0,0,0,0.4)',
                },
            },
        }],
    };
}

// ─── Gauge ───────────────────────────────────────────────────────────────────

