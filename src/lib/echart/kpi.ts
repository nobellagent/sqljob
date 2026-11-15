// Module extrait de EChartSqlParser.ts — cartes KPI.

import {_esc, _fmtVal, _num, _str} from './helpers'
import {ColumnRole, ParsedColumnRoles} from './roles'

export function buildKpiHtml(results: any[], parsed: ParsedColumnRoles, label?: string, icon?: string): string {
    const row = results[0] || {};
    return _buildKpiHtml(row, parsed.roleMap, label ?? null, icon ?? null);
}

/** KPI: centered card — KPI / LABEL (compat) / PERCENT / COMPARE / TREND */
function _buildKpiHtml(row: any, roleMap: Record<string, ColumnRole[]>, title: string | null, icon: string | null = null): string {
    const parts: string[] = [];

    function _sub(display: string, role: string, fallback = ''): string {
        const raw = display !== role ? display : fallback;
        return raw && raw.toLowerCase() !== 'null' ? raw : '';
    }

    // ICON — priorité au paramètre préfixe, fallback sur la colonne ::ICON du SELECT (legacy)
    const iconCol = (roleMap['ICON'] || [])[0];
    const iconRaw = icon ?? (iconCol ? _str(row[iconCol.originalName]) : null);
    if (iconRaw && iconRaw.toLowerCase() !== 'null') {
        const iconId = iconRaw.includes(':') ? iconRaw : `lucide:${iconRaw}`;
        parts.push(`<div style="display:flex;justify-content:center;margin-bottom:.1rem"><span class="iconify" data-icon="${_esc(iconId)}" style="font-size:clamp(1.5rem,8vw,3rem);color:var(--primary,#555)"></span></div>`);
    }

    // KPI value columns
    for (const col of (roleMap['KPI'] || [])) {
        const val = _str(row[col.originalName]);
        const sublabel = _sub(col.displayName, 'KPI');
        parts.push(`<div style="text-align:center;margin-bottom:.25rem">
  ${sublabel ? `<div style="font-size:clamp(1rem,3vw,1.4rem);color:var(--muted-foreground,#888);margin-bottom:.2rem">${_esc(sublabel)}</div>` : ''}
  <div style="font-size:clamp(1.5rem,8vw,2.5rem);font-weight:700;line-height:1.05;color:var(--foreground,#111)">${_esc(val)}</div>
</div>`);
    }
    // PERCENT / COMPARE / TREND / TREND_PERCENT — côte à côte sur une ligne
    const rowItems: string[] = [];
    const neutralBg = 'rgba(128,128,128,.12)';
    const neutralFg = 'var(--foreground,#111)';

    // PERCENT : fond neutre, pas de flèche
    for (const col of (roleMap['PERCENT'] || [])) {
        const val = _num(row[col.originalName]);
        const lbl = _sub(col.displayName, 'PERCENT');
        const prefix = lbl ? `<span style="color:var(--muted-foreground,#888)">${_esc(lbl)} : </span>` : '';
        rowItems.push(`<span style="white-space:nowrap;font-size:.8rem">${prefix}<span style="background:${neutralBg};color:${neutralFg};border-radius:.35rem;padding:.1rem .45rem;font-weight:700">${val.toFixed(1)}%</span></span>`);
    }

    // COMPARE : texte neutre, pas de fond ni de flèche, tolère texte
    for (const col of (roleMap['COMPARE'] || [])) {
        const raw = row[col.originalName];
        const numVal = typeof raw === 'number' ? raw : (raw !== null && raw !== undefined && !isNaN(Number(raw)) ? Number(raw) : null);
        const display = numVal !== null ? _fmtVal(numVal) : _esc(_str(raw));
        const lbl = _sub(col.displayName, 'COMPARE');
        const prefix = lbl ? `<span style="color:var(--muted-foreground,#888)">${_esc(lbl)} : </span>` : '';
        rowItems.push(`<span style="white-space:nowrap;font-size:.8rem;font-weight:600;color:${neutralFg}">${prefix}${display}</span>`);
    }

    // TREND : fond coloré + flèche
    for (const col of (roleMap['TREND'] || [])) {
        const val = _num(row[col.originalName]);
        const isUp = val > 0; const isNeutral = val === 0;
        const fg = isNeutral ? '#ca8a04' : isUp ? '#16a34a' : '#dc2626';
        const bg = isNeutral ? '#ca8a0418' : isUp ? '#16a34a18' : '#dc262618';
        const arrow = isNeutral ? '→' : isUp ? '↑' : '↓';
        const sign = isUp ? '+' : '';
        const lbl = _sub(col.displayName, 'TREND');
        const prefix = lbl ? `<span style="color:var(--muted-foreground,#888)">${_esc(lbl)} : </span>` : '';
        rowItems.push(`<span style="white-space:nowrap;font-size:.8rem">${prefix}<span style="background:${bg};color:${fg};border-radius:.35rem;padding:.1rem .45rem;font-weight:700">${sign}${val} ${arrow}</span></span>`);
    }

    // TREND_PERCENT : fond coloré + flèche + %
    for (const col of (roleMap['TREND_PERCENT'] || [])) {
        const val = _num(row[col.originalName]);
        const isUp = val > 0; const isNeutral = val === 0;
        const fg = isNeutral ? '#ca8a04' : isUp ? '#16a34a' : '#dc2626';
        const bg = isNeutral ? '#ca8a0418' : isUp ? '#16a34a18' : '#dc262618';
        const arrow = isNeutral ? '→' : isUp ? '↑' : '↓';
        const sign = isUp ? '+' : '';
        const lbl = _sub(col.displayName, 'TREND_PERCENT');
        const prefix = lbl ? `<span style="color:var(--muted-foreground,#888)">${_esc(lbl)} : </span>` : '';
        rowItems.push(`<span style="white-space:nowrap;font-size:.8rem">${prefix}<span style="background:${bg};color:${fg};border-radius:.35rem;padding:.1rem .45rem;font-weight:700">${sign}${val.toFixed(1)}% ${arrow}</span></span>`);
    }

    if (rowItems.length > 0) {
        parts.push(`<div style="display:flex;flex-wrap:wrap;gap:.5rem 1rem;justify-content:center;align-items:center;margin-top:.25rem">${rowItems.join('')}</div>`);
    }

    if (parts.length === 0) return '<div style="padding:1rem;color:#888;font-size:.875rem;text-align:center">Aucune donnée</div>';
    return `<div style="text-align:center">${parts.join('\n')}</div>`;
}

// ─── Table cell HTML builder ──────────────────────────────────────────────────

/**
 * Returns an object mapping column originalName → HTML renderer function.
 * Used by renderTableInContainer to apply special formatting for PERCENT and TREND columns.
 */
