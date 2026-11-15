// Module extrait de EChartSqlParser.ts — jauges.

import {_num} from '../helpers'
import {ColumnRole} from '../roles'
import {_getChartColors, _isDark} from '../theme'

export function _buildGaugeOption(results, roleMap, chartType, base, textColor) {
    const isPercent = chartType === 'gauge_percent';
    const valueCols: ColumnRole[] = roleMap['GAUGE_PERCENT'] || roleMap['GAUGE'] || [];
    const valueCol = valueCols[0]?.originalName;
    // GAUGE_PERCENT: fraction 0.22 → 22; whole number 75 → 75 (leave as-is)
    const rawValue = _num(results[0]?.[valueCol]);
    const value = isPercent && rawValue >= 0 && rawValue <= 1 ? rawValue * 100 : rawValue;
    const label = valueCols[0]?.displayName || '';

    // Helper: convert Arrow Vector / typed-array / plain Array to a JS Array
    const _toJSArr = (v: unknown): unknown[] | null => {
        if (Array.isArray(v)) return v;
        if (v == null || typeof v === 'string') return null;
        if (typeof (v as any)[Symbol.iterator] === 'function') return Array.from(v as Iterable<unknown>);
        return null;
    };

    // RANGE column: [min, max] OR [v0, v1, v2, ..., vN] for a segmented gauge
    const rangeCols = roleMap['RANGE'] || [];
    const rangeCol = rangeCols[0]?.originalName;
    let min = 0, max = 100;
    let rangeThresholds: number[] = []; // segment boundaries excluding min (used for COLORS/LABELS)
    if (rangeCol && results[0]?.[rangeCol] != null) {
        const r = results[0][rangeCol];
        let arr: number[] | null = null;
        const r_arr = _toJSArr(r);
        if (r_arr && r_arr.length >= 2) {
            arr = r_arr.map(_num);
        } else if (typeof r === 'string') {
            try {
                const parsed = JSON.parse(r);
                const p_arr = _toJSArr(parsed);
                if (p_arr && p_arr.length >= 2) arr = p_arr.map(_num);
            } catch (_) {}
        }
        if (arr) {
            min = arr[0];
            max = arr[arr.length - 1];
            rangeThresholds = arr.slice(1); // everything after min; last = max
        }
    }

    // COLORS column: either ECharts format [[fraction, color], ...] or simple ['#c1', '#c2', ...]
    const colorsCols = roleMap['COLORS'] || [];
    const colorsCol = colorsCols[0]?.originalName;
    let gaugeColors: any[] | undefined;
    if (colorsCol && results[0]?.[colorsCol] != null) {
        const raw = results[0][colorsCol];
        try {
            const raw_parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
            const parsed = _toJSArr(raw_parsed);
            if (parsed && parsed.length > 0) {
                if (Array.isArray(parsed[0])) {
                    // Already ECharts format [[fraction, color], ...]
                    gaugeColors = parsed as any[];
                } else {
                    // Simple string array ['#color1', '#color2', ...] → convert to ECharts format
                    const range = max - min || 1;
                    if (rangeThresholds.length === parsed.length) {
                        // Map each color to its corresponding threshold fraction
                        gaugeColors = rangeThresholds.map((threshold, i) => [
                            (threshold - min) / range,
                            parsed[i],
                        ]);
                    } else {
                        // Equal distribution across the gauge
                        gaugeColors = parsed.map((color, i) => [
                            (i + 1) / parsed.length,
                            color,
                        ]);
                    }
                }
            }
        } catch (_) {}
    }

    // LABELS column: [{value, label}, ...] OR simple ['label1', 'label2', ...]
    const labelsCols = roleMap['LABELS'] || [];
    const labelsCol = labelsCols[0]?.originalName;
    let gaugeAxisLabels: { value: number; label: string }[] | undefined;
    if (labelsCol && results[0]?.[labelsCol] != null) {
        const raw = results[0][labelsCol];
        try {
            const raw_parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
            const parsed = _toJSArr(raw_parsed);
            if (parsed && parsed.length > 0) {
                if (parsed[0] && typeof parsed[0] === 'object' && 'value' in (parsed[0] as object)) {
                    // Already {value, label} format
                    gaugeAxisLabels = parsed as any[];
                } else if (rangeThresholds.length === parsed.length) {
                    // Simple string array aligned with range thresholds
                    gaugeAxisLabels = rangeThresholds.map((threshold, i) => ({
                        value: threshold,
                        label: String(parsed[i]),
                    }));
                } else {
                    // Fallback: equal distribution across range (e.g. RANGE=[min,max] with N labels)
                    const rng = max - min || 1;
                    gaugeAxisLabels = parsed.map((lbl, i) => ({
                        value: min + rng * (i + 1) / parsed.length,
                        label: String(lbl),
                    }));
                }
            }
        } catch (_) {}
    }

    // Gauge visual constants — matching taleshape reference design
    const barWidth = 40;
    const startAngle = 180; // pure semicircle
    const endAngle = 0;
    const center = ['50%', '75%']; // shift center down so arc fills upper area
    const radius = '70%';

    // Build axisLine color config
    const axisLineStyle: any = { width: barWidth };
    if (gaugeColors) {
        axisLineStyle.color = gaugeColors;
    } else if (gaugeAxisLabels) {
        // Labels without explicit colors: use theme chart colors, one per zone
        const themeColors = _getChartColors();
        const rangeSpan = max - min || 1;
        axisLineStyle.color = gaugeAxisLabels.map((item, i) => [
            Math.min((item.value - min) / rangeSpan, 1),
            themeColors[i % themeColors.length],
        ]);
        // Clamp last fraction to exactly 1
        axisLineStyle.color[axisLineStyle.color.length - 1][0] = 1;
    } else {
        // Simple gauge: neutral arc using theme border color
        const _style = typeof document !== 'undefined' ? getComputedStyle(document.documentElement) : null;
        const borderRaw = _style?.getPropertyValue('--border').trim();
        let arcColor = _isDark() ? '#4a5568' : '#e0e0e0';
        if (borderRaw) {
            const p = borderRaw.split(/\s+/);
            arcColor = p.length >= 3 ? `hsl(${p[0]}, ${p[1]}, ${p[2]})` : borderRaw;
        }
        axisLineStyle.color = [[1, arcColor]];
    }

    // Default: simple gauge with standard numeric labels
    let splitNumber = 5;
    let innerLabelFmt: any = isPercent ? '{value}%' : '{value}';
    let outerSeries: any = null;   // non-active zone labels (outside arc, normal weight)
    let boldSeries: any = null;    // active zone label (outside arc, bold)

    if (gaugeAxisLabels) {
        // splitNumber = N*4 covers both zone midpoints and threshold positions
        const N = gaugeAxisLabels.length;
        splitNumber = N * 4;
        const tickInterval = (max - min) / splitNumber;
        const snapToTick = (pos: number) => Math.round((pos - min) / tickInterval) * tickInterval + min;
        const eps = tickInterval * 1e-4;

        const zoneBoundaries = [min, ...gaugeAxisLabels.map(item => item.value)];
        const zoneMidpoints = gaugeAxisLabels.map((_, i) => (zoneBoundaries[i] + zoneBoundaries[i + 1]) / 2);
        const activeZoneIdx = gaugeAxisLabels.findIndex((item, i) => value >= zoneBoundaries[i] && value <= item.value);

        const thresholdMap = new Map<number, string>();
        zoneBoundaries.forEach(pos => thresholdMap.set(snapToTick(pos), String(pos)));

        const zoneMap = new Map<number, { text: string; isActive: boolean }>();
        zoneMidpoints.forEach((pos, i) => {
            const snap = snapToTick(pos);
            if (!thresholdMap.has(snap))
                zoneMap.set(snap, { text: gaugeAxisLabels![i].label, isActive: i === activeZoneIdx });
        });

        const findInMap = <T>(map: Map<number, T>, val: number): T | null => {
            for (const [k, v] of map.entries())
                if (Math.abs(val - k) < eps) return v;
            return null;
        };

        // Series 1 (main): threshold boundary values just inside inner arc edge (distance 38)
        innerLabelFmt = (val: number) => findInMap(thresholdMap, val) ?? '';

        // Series 2: non-active zone labels outside arc (negative distance = away from center)
        const outerFmt = (val: number) => {
            const item = findInMap(zoneMap, val);
            return (item && !item.isActive) ? item.text : '';
        };
        outerSeries = {
            type: 'gauge', min, max, startAngle, endAngle, splitNumber,
            center, radius: '85%', z: 2,
            pointer: { show: false }, axisLine: { show: false },
            axisTick: { show: false }, splitLine: { show: false },
            axisLabel: { color: textColor, fontSize: 11, distance: -20, rotate: 'tangential', formatter: outerFmt },
            detail: { show: false }, data: [],
        };

        // Series 3: active zone label only, bold
        const activeFmt = (val: number) => {
            const item = findInMap(zoneMap, val);
            return (item && item.isActive) ? item.text : '';
        };
        boldSeries = {
            type: 'gauge', min, max, startAngle, endAngle, splitNumber,
            center, radius: '85%', z: 2,
            pointer: { show: false }, axisLine: { show: false },
            axisTick: { show: false }, splitLine: { show: false },
            axisLabel: { color: textColor, fontSize: 13, fontWeight: 'bold', distance: -20, rotate: 'tangential', formatter: activeFmt },
            detail: { show: false }, data: [],
        };
    }

    const mainSeries: any = {
        type: 'gauge', min, max, startAngle, endAngle, splitNumber,
        center, radius,
        pointer: { show: false },
        title: { show: false },
        axisLine: { lineStyle: axisLineStyle },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { color: textColor, fontSize: 11, distance: 25, formatter: innerLabelFmt },
        // Progress bar for simple gauges (no explicit labels/colors) — like reference
        progress: {
            show: !gaugeAxisLabels && !gaugeColors,
            width: barWidth,
            itemStyle: { color: _getChartColors()[0] },
        },
        detail: {
            fontSize: 20, fontWeight: 'bold', color: textColor,
            width: 120, height: 40,
            formatter: isPercent ? '{value}%' : '{value}',
            offsetCenter: [0, '-20%'],
        },
        data: [{ value, name: label }],
    };

    // Pointer in its own series rendered last so it always appears above the colored arc
    const pointerSeries: any = {
        type: 'gauge', min, max, startAngle, endAngle, splitNumber,
        center, radius,
        pointer: {
            show: !!colorsCol,
            icon: 'triangle',
            length: 14,
            width: 12,
            offsetCenter: [0, '-62%'],
            itemStyle: { color: textColor },
        },
        axisLine: { show: false }, axisTick: { show: false },
        splitLine: { show: false }, axisLabel: { show: false },
        progress: { show: false }, detail: { show: false },
        title: { show: false },
        data: [{ value, name: label }],
    };

    return {
        ...base,
        tooltip: { formatter: '{b}: {c}' + (isPercent ? '%' : '') },
        series: boldSeries
            ? [mainSeries, outerSeries, boldSeries, pointerSeries]
            : [mainSeries, pointerSeries],
    };
}

// ─── Boxplot ─────────────────────────────────────────────────────────────────

