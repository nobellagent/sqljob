import { useState, useEffect } from 'react'
import {
    Button,
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
    Separator,
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@sqlrooms/ui'
import { Icon } from '../../../lib/icons'

// ─── Storage keys (exportés pour exportSlice) ─────────────────────────────────
export const STORAGE_LIGHT  = 'sqljob-custom-theme-light'
export const STORAGE_DARK   = 'sqljob-custom-theme-dark'
export const STORAGE_PRESET = 'sqljob-custom-theme-preset'
const STYLE_ID = 'sqljob-custom-theme'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function css(vars: Record<string, string>): string {
    return Object.entries(vars).map(([k, v]) => `  --${k}: ${v};`).join('\n')
}

export function applyCustomTheme(light: string, dark: string) {
    let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null
    if (!el) {
        el = document.createElement('style')
        el.id = STYLE_ID
        document.head.appendChild(el)
    }
    const parts: string[] = []
    if (light.trim()) parts.push(`:root {\n${light.trim()}\n}`)
    if (dark.trim())  parts.push(`.dark {\n${dark.trim()}\n}`)
    el.textContent = parts.join('\n')
}

/** Réapplique le thème sauvegardé au démarrage */
export function initCustomTheme() {
    const light = localStorage.getItem(STORAGE_LIGHT) || ''
    const dark  = localStorage.getItem(STORAGE_DARK)  || ''
    if (light || dark) applyCustomTheme(light, dark)
}

/**
 * Applique le thème (preset nommé, custom ou default) depuis un objet config.ui.
 * Appelé à l'init (buildInitialState) ET à l'import (applyImportedConfig).
 */
export function applyThemeFromConfig(ui: any) {
    const preset = ui?.theme
    if (!preset || preset === 'light' || preset === 'dark') return  // compat backward : géré séparément
    if (preset === 'default') {
        localStorage.removeItem(STORAGE_LIGHT)
        localStorage.removeItem(STORAGE_DARK)
        localStorage.removeItem(STORAGE_PRESET)
        applyCustomTheme('', '')
    } else if (preset === 'custom') {
        const l = ui?.customThemeLight || ''
        const d = ui?.customThemeDark  || ''
        localStorage.setItem(STORAGE_LIGHT, l)
        localStorage.setItem(STORAGE_DARK,  d)
        localStorage.setItem(STORAGE_PRESET, 'custom')
        applyCustomTheme(l, d)
    } else {
        // Preset nommé — PRESETS[] est toujours chargé avant l'appel (modules ES)
        const found = PRESETS.find((p: any) => p.id === preset)
        if (found) {
            localStorage.setItem(STORAGE_LIGHT, found.light)
            localStorage.setItem(STORAGE_DARK,  found.dark)
            localStorage.setItem(STORAGE_PRESET, found.id)
            applyCustomTheme(found.light, found.dark)
        }
    }
}

// ─── Définition des thèmes ────────────────────────────────────────────────────

import { PRESETS, detectPreset } from './theme/presets'
// ─── Modal ────────────────────────────────────────────────────────────────────
interface Props { open: boolean; onClose: () => void }

export function ThemeCustomModal({ open, onClose }: Props) {
    const [preset, setPreset] = useState('default')
    const [light, setLight]   = useState('')
    const [dark, setDark]     = useState('')

    useEffect(() => {
        if (!open) return
        const l = localStorage.getItem(STORAGE_LIGHT) || ''
        const d = localStorage.getItem(STORAGE_DARK)  || ''
        setLight(l)
        setDark(d)
        setPreset(detectPreset(l, d))
    }, [open])

    function handleSelectPreset(id: string) {
        const found = PRESETS.find(p => p.id === id)
        if (!found) return
        setPreset(id)
        setLight(found.light)
        setDark(found.dark)
    }

    function handleLightChange(val: string) {
        setLight(val)
        const d = dark
        if (val.trim() && d.trim()) setPreset('custom')
        else if (!val.trim() && !d.trim()) setPreset('default')
    }

    function handleDarkChange(val: string) {
        setDark(val)
        const l = light
        if (l.trim() && val.trim()) setPreset('custom')
        else if (!l.trim() && !val.trim()) setPreset('default')
    }

    function handleSave() {
        localStorage.setItem(STORAGE_LIGHT, light)
        localStorage.setItem(STORAGE_DARK, dark)
        localStorage.setItem(STORAGE_PRESET, preset)
        applyCustomTheme(light, dark)
        onClose()
    }

    function handleReset() {
        setLight(''); setDark(''); setPreset('default')
        localStorage.removeItem(STORAGE_LIGHT)
        localStorage.removeItem(STORAGE_DARK)
        localStorage.removeItem(STORAGE_PRESET)
        applyCustomTheme('', '')
    }

    const isCustom = preset === 'custom'
    const hasContent = !!(light.trim() || dark.trim())

    return (
        <Dialog open={open} onOpenChange={v => !v && onClose()}>
            <DialogContent aria-describedby={undefined} className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Icon name="palette" size={20} />
                        Personnalisation du thème
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 text-sm">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Thème</label>
                        <Select value={preset} onValueChange={handleSelectPreset}>
                            <SelectTrigger className="h-9">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {PRESETS.map(p => (
                                    <SelectItem key={p.id} value={p.id}>
                                        {p.emoji} {p.label}
                                    </SelectItem>
                                ))}
                                {isCustom && (
                                    <SelectItem value="custom">✏️ Personnalisé</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <Separator />

                    <p className="text-muted-foreground text-xs">
                        Variables CSS surchargeant le thème (format HSL sans <code>hsl()</code>).{' '}
                        <a href="https://ui.shadcn.com/themes#themes" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                            Référence shadcn/ui
                        </a>
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-medium">☀️ Mode clair</label>
                            <textarea
                                className="w-full h-48 text-xs font-mono rounded-md border border-border bg-background p-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                                placeholder={"--primary: 262.1 83.3% 57.8%;\n--background: 0 0% 100%;\n--foreground: 240 10% 3.9%;"}
                                value={light}
                                onChange={e => handleLightChange(e.target.value)}
                                spellCheck={false}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium">🌙 Mode sombre</label>
                            <textarea
                                className="w-full h-48 text-xs font-mono rounded-md border border-border bg-background p-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                                placeholder={"--primary: 263.4 70% 50.4%;\n--background: 224 71.4% 4.1%;\n--foreground: 210 20% 98%;"}
                                value={dark}
                                onChange={e => handleDarkChange(e.target.value)}
                                spellCheck={false}
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    {hasContent && (
                        <Button variant="ghost" size="sm" onClick={handleReset} className="mr-auto text-destructive hover:text-destructive">
                            Réinitialiser
                        </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={onClose}>Annuler</Button>
                    <Button size="sm" onClick={handleSave}>Appliquer</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
