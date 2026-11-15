// Module extrait de EChartSqlParser.ts — rendu de tableau.

import {_num} from './helpers'
import {ParsedColumnRoles} from './roles'

export function buildTableColumnRenderers(parsed: ParsedColumnRoles): Record<string, (val: any) => string> {
    const { roleMap } = parsed;
    const renderers: Record<string, (val: any) => string> = {};

    for (const col of (roleMap['PERCENT'] || [])) {
        renderers[col.originalName] = (val) => {
            const n = _num(val);
            const color = n >= 75 ? '#22c55e' : n >= 40 ? '#f59e0b' : '#ef4444';
            const barWidth = Math.min(100, Math.max(0, n));
            return `<div style="display:flex;align-items:center;gap:6px;min-width:80px">
                <div style="flex:1;height:6px;background:#e2e8f0;border-radius:3px;overflow:hidden">
                    <div style="height:100%;width:${barWidth}%;background:${color};border-radius:3px"></div>
                </div>
                <span style="color:${color};font-weight:600;white-space:nowrap;min-width:3.5em;text-align:right">${n.toFixed(1)}%</span>
            </div>`;
        };
    }

    for (const col of (roleMap['TREND'] || [])) {
        renderers[col.originalName] = (val) => {
            const n = _num(val);
            const isUp = n > 0;
            const isNeutral = n === 0;
            const arrow = isNeutral ? '→' : isUp ? '↑' : '↓';
            const color = isNeutral ? '#f59e0b' : isUp ? '#22c55e' : '#ef4444';
            const sign = isUp ? '+' : '';
            return `<span style="color:${color};font-weight:600">${arrow} ${sign}${n}</span>`;
        };
    }

    return renderers;
}

/**
 * Returns the display name for a column (strips role suffix from the header).
 */
export function getTableColumnDisplayNames(parsed: ParsedColumnRoles): Record<string, string> {
    const map: Record<string, string> = {};
    for (const col of parsed.roles) {
        if (col.displayName && col.displayName !== col.originalName) {
            map[col.originalName] = col.displayName;
        }
    }
    return map;
}

// ─── Main class export (for Alpine / global access) ──────────────────────────

