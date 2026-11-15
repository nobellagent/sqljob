import type {ThemePreset} from './builders'
import {PRESETS_A} from './presetsA'
import {PRESETS_B} from './presetsB'


export const PRESETS: ThemePreset[] = [...PRESETS_A, ...PRESETS_B]

// ─── Logique de correspondance preset ─────────────────────────────────────────
export function detectPreset(light: string, dark: string): string {
    if (!light.trim() && !dark.trim()) return 'default'
    const match = PRESETS.find(p => p.id !== 'default' && p.light === light && p.dark === dark)
    return match ? match.id : 'custom'
}

