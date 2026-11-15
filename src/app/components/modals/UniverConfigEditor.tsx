// Éditeur de configuration des cellules Univer Sheet.

const UNIVER_LOCALES = [
    { value: 'en-US', label: 'English (US)' },
    { value: 'fr-FR', label: 'Français' },
    { value: 'zh-CN', label: '中文 (简体)' },
    { value: 'zh-TW', label: '中文 (繁體)' },
    { value: 'ru-RU', label: 'Русский' },
    { value: 'ja-JP', label: '日本語' },
    { value: 'es-ES', label: 'Español' },
    { value: 'ca-ES', label: 'Català' },
    { value: 'sk-SK', label: 'Slovenčina' },
    { value: 'fa-IR', label: 'فارسی' },
]


import {useNotebookStore} from '../../store/notebookStore'
import {CELL_TYPE_SCHEMAS} from '../../../lib/cellTypeSchemas'
import {Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Checkbox} from '@sqlrooms/ui'

export function UniverConfigEditor({ cell, apply }: { cell: any; apply: (fn: (c: any) => void) => void }) {
    const dbEngine = useNotebookStore(s => s.dbEngine)
    const isDucklings = dbEngine === 'ducklings'
    const getRawCfg = (): Record<string, any> => {
        const v = cell.json?.univerConfig
        if (!v) return {}
        if (typeof v === 'object') return v
        try { return JSON.parse(v) } catch { return {} }
    }
    const setKey = (key: string, val: any) => {
        apply(c => {
            if (!c.json) c.json = {}
            const cur = c.json.univerConfig
            const config: Record<string, any> = (cur && typeof cur === 'object')
                ? { ...cur }
                : (typeof cur === 'string' ? JSON.parse(cur || '{}') : {})
            if (val === undefined) { delete config[key] } else { config[key] = val }
            c.json.univerConfig = config
        })
    }
    const setFooterKey = (key: string, val: boolean) => {
        const cur = getRawCfg()
        const footerObj = typeof cur.footer === 'object' ? { ...cur.footer } : {}
        if (val) { delete footerObj[key] } else { footerObj[key] = false }
        setKey('footer', footerObj)
    }

    const cfg = getRawCfg()
    const toolbarOn = cfg.toolbar !== false
    const footerEnabled = cfg.footer !== false
    const footerCfg: Record<string, any> = typeof cfg.footer === 'object' ? cfg.footer : {}

    return (
        <div className="space-y-3">
            {/* Locale */}
            <div className="space-y-1">
                <Label className="text-sm">Langue</Label>
                <Select
                    value={cfg.locale || 'fr-FR'}
                    onValueChange={v => setKey('locale', v === 'fr-FR' ? undefined : v)}
                >
                    <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {UNIVER_LOCALES.map(l => (
                            <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Section Interface */}
            <div className="space-y-2 border border-border rounded-md p-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Interface</p>

                {/* Toolbar + ribbonType */}
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <Checkbox
                            checked={toolbarOn}
                            onCheckedChange={v => setKey('toolbar', v ? undefined : false)}
                        />
                        <Label className="cursor-pointer text-sm">Toolbar</Label>
                    </div>
                    {toolbarOn && (
                        <div className="ml-7">
                            <Select
                                value={cfg.ribbonType || 'classic'}
                                onValueChange={v => setKey('ribbonType', v === 'classic' ? undefined : v)}
                            >
                                <SelectTrigger className="h-7 text-xs w-36">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="classic">Classic</SelectItem>
                                    <SelectItem value="collapsed">Collapsed</SelectItem>
                                    <SelectItem value="simple">Simple</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>

                {([
                    { key: 'formulaBar', label: 'Barre de formule' },
                    { key: 'header', label: 'En-tête' },
                    { key: 'contextMenu', label: 'Menu contextuel' },
                    { key: 'disableAutoFocus', label: "Désactiver l'auto-focus", invert: true },
                ] as { key: string; label: string; invert?: boolean }[]).map(({ key, label, invert }) => (
                    <div key={key} className="flex items-center gap-3">
                        <Checkbox
                            checked={invert ? !cfg[key] : cfg[key] !== false}
                            onCheckedChange={v => {
                                const enabled = invert ? !v : !!v
                                setKey(key, enabled ? undefined : (invert ? true : false))
                            }}
                        />
                        <Label className="cursor-pointer text-sm">{label}</Label>
                    </div>
                ))}
            </div>

            {/* Section Apparence de la feuille */}
            <div className="space-y-2 border border-border rounded-md p-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Apparence de la feuille</p>
                {([
                    { key: 'showGridlines', label: 'Quadrillage' },
                    { key: 'showRowHeader', label: 'Numéros de lignes (1, 2, 3…)' },
                    { key: 'showColumnHeader', label: 'Lettres de colonnes (A, B, C…)' },
                ] as { key: string; label: string }[]).map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-3">
                        <Checkbox
                            checked={cfg[key] !== false}
                            onCheckedChange={v => setKey(key, v ? undefined : false)}
                        />
                        <Label className="cursor-pointer text-sm">{label}</Label>
                    </div>
                ))}
            </div>

            {/* Section Dimensions */}
            <div className="space-y-2 border border-border rounded-md p-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Dimensions</p>
                <div className="flex items-center gap-3">
                    <Checkbox
                        checked={!!cfg.fitDimensions}
                        onCheckedChange={v => setKey('fitDimensions', v ? true : undefined)}
                    />
                    <Label className="cursor-pointer text-sm">Adapter aux données SQL</Label>
                </div>
                <p className="text-xs text-muted-foreground ml-7">
                    Fixe exactement le nombre de lignes et de colonnes au résultat de la requête.
                </p>
                {!cfg.fitDimensions && (
                    <div className="flex gap-4">
                        <div className="flex-1 space-y-1">
                            <Label className="text-xs text-muted-foreground">Lignes max</Label>
                            <Input
                                type="number"
                                className="h-7 text-xs"
                                min={1}
                                placeholder="1000"
                                value={cfg.maxRows ?? ''}
                                onChange={e => {
                                    const n = parseInt(e.target.value)
                                    setKey('maxRows', isNaN(n) || n <= 0 ? undefined : n)
                                }}
                            />
                        </div>
                        <div className="flex-1 space-y-1">
                            <Label className="text-xs text-muted-foreground">Colonnes max</Label>
                            <Input
                                type="number"
                                className="h-7 text-xs"
                                min={1}
                                placeholder="20"
                                value={cfg.maxCols ?? ''}
                                onChange={e => {
                                    const n = parseInt(e.target.value)
                                    setKey('maxCols', isNaN(n) || n <= 0 ? undefined : n)
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Section Pied de page */}
            <div className="space-y-2 border border-border rounded-md p-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pied de page</p>
                <div className="flex items-center gap-3">
                    <Checkbox
                        checked={footerEnabled}
                        onCheckedChange={v => setKey('footer', v ? undefined : false)}
                    />
                    <Label className="cursor-pointer text-sm">Afficher le pied de page</Label>
                </div>
                {footerEnabled && (
                    <div className="ml-7 space-y-1">
                        {([
                            { key: 'sheetBar', label: 'Barre des feuilles' },
                            { key: 'statisticBar', label: 'Statistiques' },
                            { key: 'menus', label: 'Menus' },
                            { key: 'zoomSlider', label: 'Slider de zoom' },
                        ] as { key: string; label: string }[]).map(({ key, label }) => (
                            <div key={key} className="flex items-center gap-3">
                                <Checkbox
                                    checked={footerCfg[key] !== false}
                                    onCheckedChange={v => setFooterKey(key, !!v)}
                                />
                                <Label className="cursor-pointer text-sm text-muted-foreground">{label}</Label>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Section Fonctionnalités */}
            <div className="space-y-2 border border-border rounded-md p-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Fonctionnalités</p>

                <div className="flex items-center gap-3">
                    <Checkbox
                        checked={!!cfg.rawWorkbookJson}
                        onCheckedChange={v => setKey('rawWorkbookJson', v ? true : undefined)}
                    />
                    <Label className="cursor-pointer text-sm">Injection cellData JSON</Label>
                </div>
                <p className="text-xs text-muted-foreground ml-7">
                    La première cellule retourne <code>{"{ cellData, styles? }"}</code>. Les styles (<code>IWorkbookData.styles</code>) sont référencés par id dans les cellules via la clé <code>s</code>.
                </p>

                <div className="flex items-center gap-3">
                    <Checkbox
                        checked={!!cfg.evalFormulas}
                        onCheckedChange={v => setKey('evalFormulas', v ? true : undefined)}
                    />
                    <Label className="cursor-pointer text-sm">Évaluer les formules SQL</Label>
                </div>
                <p className="text-xs text-muted-foreground ml-7">
                    Les valeurs commençant par <code>=</code> retournées par la requête SQL sont interprétées comme des formules Univer (ex. <code>=A2+B2</code>).
                </p>

                <div className="flex items-center gap-3">
                    <Checkbox
                        checked={!!cfg.enableTable}
                        onCheckedChange={v => setKey('enableTable', v ? true : undefined)}
                    />
                    <Label className="cursor-pointer text-sm">Activer les tableaux</Label>
                </div>
                <p className="text-xs text-muted-foreground ml-7">
                    Active le preset <code>@univerjs/preset-sheets-table</code> (tableaux structurés avec filtres, tri…). Nécessite de ré-exécuter la cellule.
                </p>

                <div className="flex items-center gap-3">
                    <Checkbox
                        checked={!!cfg.materializeAsDuckDB}
                        disabled={isDucklings}
                        onCheckedChange={v => !isDucklings && setKey('materializeAsDuckDB', v ? true : undefined)}
                    />
                    <Label className={`text-sm ${isDucklings ? 'text-muted-foreground cursor-not-allowed' : 'cursor-pointer'}`}>
                        Matérialiser en table DuckDB
                    </Label>
                </div>
                {isDucklings ? (
                    <p className="text-xs text-destructive ml-7">
                        ⚠️ Non disponible avec le moteur Ducklings — utilisez DuckDB WASM.
                    </p>
                ) : (
                    <p className="text-xs text-muted-foreground ml-7">
                        Crée/met à jour une table DuckDB (nom = cellule) avec les valeurs évaluées de la feuille. Mise à jour à chaque modification utilisateur.
                    </p>
                )}
            </div>

        </div>
    )
}

// ──────────────────────────────────────────────────────────────────────────────

export function getCommonParamDef(paramKey: string, cellType: string) {
    const schema = CELL_TYPE_SCHEMAS?.types?.[cellType]
    return schema?.commonParams?.find((p: any) => p.key === paramKey) || null
}

export function getCommonParamsExcludingName(cellType: string): string[] {
    const schema = CELL_TYPE_SCHEMAS?.types?.[cellType]
    if (!schema?.commonParams) return []
    return (schema.commonParams as string[]).filter((k: string) => k !== 'name')
}

export function getSpecificParamsForType(cellType: string) {
    const schema = CELL_TYPE_SCHEMAS?.types?.[cellType]
    return schema?.specificParams || []
}

