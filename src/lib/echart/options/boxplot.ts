// Module extrait de EChartSqlParser.ts — boîtes à moustaches.

import {_num, _str} from '../helpers'
import {_axisLabelSize} from '../theme'

export function _buildBoxplotOption(results, roleMap, base, textColor) {
    const axisCols = roleMap['XAXIS'] || [];
    const valueCols = roleMap['BOXPLOT'] || [];
    const colorCols = roleMap['COLOR'] || [];
    const axisCol = axisCols[0]?.originalName;
    const colorCol = colorCols[0]?.originalName;

    let categories: string[] = [];
    let boxData: number[][] = [];
    let outlierData: [number, number][] = []; // [catIndex, value]

    // If 5+ BOXPLOT columns, treat as direct [min, q1, median, q3, max] — no outlier detection
    if (valueCols.length >= 5) {
        for (const row of results) {
            categories.push(axisCol ? _str(row[axisCol]) : '');
            boxData.push([
                _num(row[valueCols[0].originalName]),
                _num(row[valueCols[1].originalName]),
                _num(row[valueCols[2].originalName]),
                _num(row[valueCols[3].originalName]),
                _num(row[valueCols[4].originalName]),
            ]);
        }
    } else {
        // Group raw values by XAXIS category, compute quantiles + Tukey outliers
        const valueCol = valueCols[0]?.originalName;
        const groups: Record<string, number[]> = {};
        const catOrder: string[] = [];
        for (const row of results) {
            const cat = axisCol ? _str(row[axisCol]) : '_';
            if (!groups[cat]) { groups[cat] = []; catOrder.push(cat); }
            groups[cat].push(_num(row[valueCol]));
        }

        const q = (sorted: number[], p: number) => {
            const idx = p * (sorted.length - 1);
            const lo = Math.floor(idx), hi = Math.ceil(idx);
            return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
        };

        for (let catIdx = 0; catIdx < catOrder.length; catIdx++) {
            const cat = catOrder[catIdx];
            const sorted = [...groups[cat]].sort((a, b) => a - b);
            const q1 = q(sorted, 0.25);
            const median = q(sorted, 0.5);
            const q3 = q(sorted, 0.75);
            const iqr = q3 - q1;

            // Tukey fences
            const lowerFence = q1 - 1.5 * iqr;
            const upperFence = q3 + 1.5 * iqr;

            // Whiskers: nearest actual data point within the fences
            const lowerWhisker = sorted.find(v => v >= lowerFence) ?? sorted[0];
            let upperWhisker = sorted[0];
            for (const v of sorted) { if (v <= upperFence) upperWhisker = v; }

            categories.push(cat);
            boxData.push([lowerWhisker, q1, median, q3, upperWhisker]);

            // Collect outliers (values beyond the fences)
            for (const v of sorted) {
                if (v < lowerFence || v > upperFence) {
                    outlierData.push([catIdx, v]);
                }
            }
        }
    }

    // Build custom item styles per category if COLOR column is present
    const itemStyles = boxData.map((_, idx) => {
        if (!colorCol) return undefined;
        const row = results.find(r => axisCol ? _str(r[axisCol]) === categories[idx] : true);
        if (row && row[colorCol]) return { color: _str(row[colorCol]) };
        return undefined;
    });

    const boxSeries: any[] = [{
        type: 'boxplot',
        data: boxData.map((d, i) => itemStyles[i] ? { value: d, itemStyle: itemStyles[i] } : d),
        emphasis: { focus: 'series' },
        tooltip: {
            formatter: (param) => {
                const v = param.data?.value || param.data;
                if (!Array.isArray(v)) return '';
                return `${param.name}<br/>
                    Max: ${v[4]}<br/>
                    Q3: ${v[3]}<br/>
                    Médiane: ${v[2]}<br/>
                    Q1: ${v[1]}<br/>
                    Min: ${v[0]}`;
            },
        },
    }];

    // Add outlier scatter series if there are outliers
    if (outlierData.length > 0) {
        boxSeries.push({
            name: 'Valeurs aberrantes',
            type: 'scatter',
            data: outlierData,
            tooltip: {
                formatter: (param) => `${categories[param.data[0]]}: ${param.data[1]}`,
            },
            symbolSize: 6,
            itemStyle: { color: '#ee6666', opacity: 0.7 },
        });
    }

    return {
        ...base,
        tooltip: { trigger: 'item', confine: true },
        xAxis: { type: 'category', data: categories, axisLabel: { color: textColor, fontSize: _axisLabelSize() } },
        yAxis: { type: 'value', axisLabel: { color: textColor, fontSize: _axisLabelSize() } },
        series: boxSeries,
    };
}

// ─── KPI card HTML builder (not an ECharts option) ───────────────────────────

