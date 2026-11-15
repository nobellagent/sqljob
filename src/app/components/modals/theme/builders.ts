// Presets de thème (variables CSS clair/sombre).

import { css } from './css'

export type ThemePreset = { id: string; label: string; emoji: string; light: string; dark: string }

export const T = (light: Record<string,string>, dark: Record<string,string>) =>
    ({ light: css(light), dark: css(dark) })

/* Shorthands pour les blocs standard */
export function base(bg: string, fg: string, card?: string) {
    return {
        background: bg,
        foreground: fg,
        card: card ?? bg,
        'card-foreground': fg,
        popover: card ?? bg,
        'popover-foreground': fg,
    }
}
export function palette(primary: string, primaryFg: string, secondary: string, secondaryFg: string, accent: string, accentFg: string) {
    return { primary, 'primary-foreground': primaryFg, secondary, 'secondary-foreground': secondaryFg, accent, 'accent-foreground': accentFg }
}
export function borders(border: string, ring: string, destructive = '0 84% 60%', destructiveFg = '0 0% 100%') {
    return { border, input: border, ring, destructive, 'destructive-foreground': destructiveFg }
}
export function muted(muted: string, mutedFg: string) {
    return { muted, 'muted-foreground': mutedFg }
}
export function charts(c1: string, c2: string, c3: string, c4: string, c5: string) {
    return { 'chart-1': c1, 'chart-2': c2, 'chart-3': c3, 'chart-4': c4, 'chart-5': c5 }
}

