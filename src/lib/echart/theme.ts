// Module extrait de EChartSqlParser.ts — thème et couleurs.

export function _cssClampPx(clampExpr: string, fallback: number): number {
    if (typeof document === 'undefined') return fallback;
    const el = document.createElement('div');
    el.style.cssText = `position:fixed;visibility:hidden;pointer-events:none;font-size:${clampExpr}`;
    document.body.appendChild(el);
    const px = parseFloat(getComputedStyle(el).fontSize);
    document.body.removeChild(el);
    return isNaN(px) ? fallback : px;
}

/** Responsive axis label size: clamp(9px, 1vw, 12px) */
export function _axisLabelSize(): number { return _cssClampPx('clamp(9px,1vw,12px)', 11); }

// ─── ECharts default colors (aligned with DaisyUI palette) ──────────────────

export const DEFAULT_COLORS = [
    '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de',
    '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc',
];

/**
 * Returns the chart color palette:
 * 1. Explicit --chart-1…--chart-5 CSS variables (defined in every theme preset)
 * 2. Auto-generated from --primary hue (rotates around the color wheel) — for 'default' or custom themes
 * 3. DEFAULT_COLORS fallback
 */
export function _getChartColors(): string[] {
    if (typeof document === 'undefined') return DEFAULT_COLORS;
    const style = getComputedStyle(document.documentElement);

    // shadcn/ui stores HSL as "H S% L%" (no hsl() wrapper, space-separated).
    // ECharts/zrender only understands comma-separated hsl(H, S%, L%) — use that.
    const toHsl = (raw: string) => {
        const p = raw.trim().split(/\s+/)
        return p.length >= 3 ? `hsl(${p[0]}, ${p[1]}, ${p[2]})` : raw
    }

    // 1. Explicit --chart-N overrides
    const explicit: string[] = [];
    for (let i = 1; i <= 8; i++) {
        const v = style.getPropertyValue(`--chart-${i}`).trim();
        if (v) explicit.push(v.includes(' ') ? toHsl(v) : v);
    }
    if (explicit.length >= 3) return explicit;

    // 2. Derive from --primary (shadcn/ui format: "H S% L%")
    const primaryRaw = style.getPropertyValue('--primary').trim();
    if (primaryRaw) {
        const parts = primaryRaw.split(/\s+/).map(parseFloat);
        if (parts.length >= 3 && !isNaN(parts[0])) {
            const [h, s, l] = parts;
            const offsets = [0, 150, 270, 60, 210, 120, 330, 30];
            const sat = Math.round(Math.min(Math.max(s * 0.85, 45), 78));
            const lit = Math.round(Math.min(Math.max(l > 55 ? l - 10 : l < 35 ? l + 18 : l, 40), 65));
            return offsets.map(o => `hsl(${Math.round((h + o) % 360)}, ${sat}%, ${lit}%)`);
        }
    }

    return DEFAULT_COLORS;
}

// ─── Dark theme detection ────────────────────────────────────────────────────

export const DARK_THEMES = new Set([
    'dark', 'synthwave', 'halloween', 'forest', 'luxury',
    'dracula', 'business', 'night', 'coffee', 'dim', 'sunset', 'black',
    'abyss', 'aqua',
]);

export function _isDark(): boolean {
    if (typeof document === 'undefined') return false;
    return document.documentElement.classList.contains('dark') ||
        (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
}

// ─── Column role parsing ─────────────────────────────────────────────────────

// columnTypes: { colName -> DuckDB type string } obtenu via DESCRIBE (ex: 'XAXIS', 'BARCHART')
// Quand fourni, le TYPE DuckDB de la colonne est prioritaire sur le nom de colonne.
