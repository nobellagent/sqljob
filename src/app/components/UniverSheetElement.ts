/**
 * Web component Lit encapsulant Univer Sheets.
 * Utilise les packages npm (@univerjs/presets, @univerjs/preset-sheets-core)
 * au lieu du chargement CDN/UMD, ce qui évite le conflit AMD
 * "Can only have one anonymous define call per script file".
 *
 * Pattern inspiré du showcase : https://docs.univer.ai/showcase/sheets/lit
 */
import { LitElement, html } from 'lit'
import '@univerjs/preset-sheets-core/lib/index.css'
import '@univerjs/preset-sheets-table/lib/index.css'
import { ConfigManager } from '../../lib/ConfigManager'

// ─── Helper ────────────────────────────────────────────────────────────────────

import {_buildWorkbookFromRows, _parseUniverDocsSyntax, _escapeCSV, _excelSerialToISO, _detectColKind, _extractSheetData, type UniverInitParams, buildWorkbookData} from './univer/workbook'
import {resolveLocaleEntry} from './univer/locales'
class UniverSheetElement extends LitElement {
    private _univer: any = null
    private _univerAPI: any = null

    /** Désactive le Shadow DOM : la CSS Univer (globale) s'applique directement. */
    override createRenderRoot() { return this }

    override render() {
        return html`<div id="uc" style="height:100%;width:100%;"></div>`
    }

    getAPI() { return this._univerAPI }

    /**
     * Initialise (ou réinitialise) l'instance Univer dans le container.
     * À appeler depuis React après que _univerReady devient true.
     */
    async initialize(params: UniverInitParams) {
        // Dispose de l'instance précédente en cas de re-run
        if (this._univer) {
            try { this._univer.dispose?.() } catch (_) {}
            this._univer = null
            this._univerAPI = null
            const prev = this.renderRoot.querySelector('#uc') as HTMLDivElement | null
            if (prev) prev.innerHTML = ''
        }

        // Attendre que Lit ait rendu le container
        await this.updateComplete

        const container = this.renderRoot.querySelector('#uc') as HTMLDivElement
        if (!container) throw new Error('[UniverSheet] Container #uc introuvable')

        // ── Parser la config utilisateur ─────────────────────────────────────────
        // Accepte un objet natif (depuis l'UI), JSON strict, littéral JS,
        // ou la syntaxe copier-collée des docs Univer (LocaleType.XX_XX, etc.).
        let userConfig: any = {}
        const rawConfig = params.config
        if (rawConfig) {
            if (typeof rawConfig === 'object') {
                // Vient de l'UI structurée — objet natif directement
                userConfig = rawConfig
            } else if (typeof rawConfig === 'string' && rawConfig.trim()) {
                const raw = rawConfig.trim()

                // 1. JSON strict
                try { userConfig = JSON.parse(raw) } catch (_) {}

                // 2. Littéral JS pur (clés sans guillemets, virgules finales…)
                if (!userConfig || Object.keys(userConfig).length === 0) {
                    try { userConfig = (new Function(`return (${raw})`))() } catch (_) {} // eslint-disable-line no-new-func
                }

                // 3. Extraction tolérante pour la syntaxe docs Univer
                //    (LocaleType.XX_XX, [LocaleType.XX]: mergeLocales(...), etc.)
                if (!userConfig || Object.keys(userConfig).length === 0) {
                    userConfig = _parseUniverDocsSyntax(raw)
                }
            }
        }

        // Clé spéciale "locale" → détermine la langue de l'interface (ex. "fr-FR")
        // showGridlines / showRowHeader / showColumnHeader → appliqués au workbookData
        // editableRanges → zones éditables en mode client
        // protectedRangeShadow → option preset sheets
        // Le reste → options de UniverSheetsCorePreset.
        const localeStr: string = userConfig.locale || 'fr-FR'
        const {
            locale: _localeKey,
            showGridlines,
            showRowHeader,
            showColumnHeader,
            useSheetProtection: _useSheetProtection,
            protectedRangeShadow,
            enableTable,
            evalFormulas,
            fitDimensions,
            rawWorkbookJson,
            maxRows,
            maxCols,
            materializeAsDuckDB,
            ...presetConfig
        } = userConfig

        // Table des locales supportées (format "xx-XX" → {type, loader, tableLoader, sortLoader})
        const localeEntry = resolveLocaleEntry(localeStr)

        // Import dynamique → Vite génère des chunks séparés (chargement à la demande)
        const [coreResults, tableResults] = await Promise.all([
            Promise.all([
                import('@univerjs/presets'),
                import('@univerjs/preset-sheets-core'),
                localeEntry.loader(),
                import('@univerjs/sheets-numfmt/facade'),
            ]),
            enableTable
                ? Promise.all([
                    import('@univerjs/preset-sheets-table'),
                    import('@univerjs/preset-sheets-sort'),
                    localeEntry.tableLoader(),
                    localeEntry.sortLoader(),
                  ])
                : Promise.resolve([null, null, null, null]),
        ])
        const [{ createUniver, mergeLocales }, { UniverSheetsCorePreset }, { default: localeData }] = coreResults
        const UniverSheetsTablePreset = tableResults[0]?.UniverSheetsTablePreset ?? null
        const UniverSheetsSortPreset  = tableResults[1]?.UniverSheetsSortPreset  ?? null
        const tableLocaleData         = tableResults[2]?.default ?? null
        const sortLocaleData          = tableResults[3]?.default ?? null

        // ── Options du preset ────────────────────────────────────────────────────
        const presetOptions: any = { container, ...presetConfig }

        // protectedRangeShadow → sous-clé sheets du preset
        if (protectedRangeShadow !== undefined) {
            presetOptions.sheets = { ...(presetOptions.sheets || {}), protectedRangeShadow }
        }

        // Le mode readonly force certaines options (priorité sur la config utilisateur)
        if (params.readonly) {
            presetOptions.toolbar = false
            presetOptions.contextMenu = false
            presetOptions.formulaBar = false
            presetOptions.footer = false
        }

        const presets: any[] = [UniverSheetsCorePreset(presetOptions)]
        if (enableTable && UniverSheetsTablePreset) {
            presets.push(UniverSheetsTablePreset())
        }
        if (enableTable && UniverSheetsSortPreset) {
            presets.push(UniverSheetsSortPreset())
        }

        const { univer, univerAPI } = createUniver({
            locale: localeEntry.type as any,
            locales: {
                [localeEntry.type]: mergeLocales(
                    localeData,
                    ...(tableLocaleData ? [tableLocaleData] : []),
                    ...(sortLocaleData  ? [sortLocaleData]  : []),
                ),
            },
            presets,
        })
        this._univer = univer
        this._univerAPI = univerAPI

        // ── Construire le workbook data ───────────────────────────────────────────
        const workbookData = await buildWorkbookData(params, rawWorkbookJson)

        univerAPI.createWorkbook(workbookData)

        // Locale pour le formatage des nombres (séparateurs décimaux, format des dates…)
        univerAPI.getActiveWorkbook()?.setNumfmtLocal?.(localeStr.replace('-', '_') as any)

        // Format des colonnes date/timestamp via setNumberFormat — formats localisés
        if (params.rowColumnFormats?.length && params.rows?.length) {
            const LOCALE_DATE_FMTS: Record<string, { date: string; datetime: string; time: string }> = {
                'fr-FR': { date: 'dd/MM/yyyy',   datetime: 'dd/MM/yyyy HH:mm:ss', time: 'HH:mm:ss' },
                'en-US': { date: 'MM/dd/yyyy',   datetime: 'MM/dd/yyyy HH:mm:ss', time: 'hh:mm:ss' },
                'de-DE': { date: 'dd.MM.yyyy',   datetime: 'dd.MM.yyyy HH:mm:ss', time: 'HH:mm:ss' },
                'zh-CN': { date: 'yyyy/MM/dd',   datetime: 'yyyy/MM/dd HH:mm:ss', time: 'HH:mm:ss' },
                'zh-TW': { date: 'yyyy/MM/dd',   datetime: 'yyyy/MM/dd HH:mm:ss', time: 'HH:mm:ss' },
                'ru-RU': { date: 'dd.MM.yyyy',   datetime: 'dd.MM.yyyy HH:mm:ss', time: 'HH:mm:ss' },
                'ja-JP': { date: 'yyyy/MM/dd',   datetime: 'yyyy/MM/dd HH:mm:ss', time: 'HH:mm:ss' },
                'es-ES': { date: 'dd/MM/yyyy',   datetime: 'dd/MM/yyyy HH:mm:ss', time: 'HH:mm:ss' },
                'ca-ES': { date: 'dd/MM/yyyy',   datetime: 'dd/MM/yyyy HH:mm:ss', time: 'HH:mm:ss' },
                'sk-SK': { date: 'dd.MM.yyyy',   datetime: 'dd.MM.yyyy HH:mm:ss', time: 'HH:mm:ss' },
                'fa-IR': { date: 'yyyy/MM/dd',   datetime: 'yyyy/MM/dd HH:mm:ss', time: 'HH:mm:ss' },
            }
            const localeFmts = LOCALE_DATE_FMTS[localeStr] ?? { date: 'yyyy-MM-dd', datetime: 'yyyy-MM-dd HH:mm:ss', time: 'HH:mm:ss' }
            const resolveFormat = (canonical: string): string => {
                if (canonical === 'yyyy-MM-dd')         return localeFmts.date
                if (canonical === 'yyyy-MM-dd HH:mm:ss') return localeFmts.datetime
                if (canonical === 'HH:mm:ss')           return localeFmts.time
                return canonical
            }
            try {
                const fws = univerAPI.getActiveWorkbook()?.getActiveSheet()
                if (fws) {
                    params.rowColumnFormats.forEach((fmt: string | null, ci: number) => {
                        if (fmt) {
                            fws.getRange(1, ci, params.rows!.length, 1).setNumberFormat(resolveFormat(fmt))
                        }
                    })
                }
            } catch (e) { console.warn('[UniverSheet] setNumberFormat failed:', e) }
        }

        // Appliquer les dimensions via l'API facade
        {
            let targetRows: number | undefined = maxRows
            let targetCols: number | undefined = maxCols
            if (fitDimensions && params.rows?.length) {
                targetRows = params.rows.length + 1  // données + ligne d'en-tête
                targetCols = Object.keys(params.rows[0] || {}).length || undefined
            }
            if (targetRows !== undefined || targetCols !== undefined) {
                const fWorksheet = univerAPI.getActiveWorkbook()?.getActiveSheet()
                if (fWorksheet) {
                    if (targetCols !== undefined) fWorksheet.setColumnCount(targetCols)
                    if (targetRows !== undefined) fWorksheet.setRowCount(targetRows)
                }
            }
        }

        // Créer automatiquement un tableau Univer sur la plage de données
        // Seulement pour les données issues de params.rows (pas les snapshots qui ont déjà leurs tables)
        if (enableTable && params.rows?.length) {
            try {
                const columns = Object.keys(params.rows[0] || {})
                if (columns.length > 0) {
                    const fWorksheet = univerAPI.getActiveWorkbook()?.getActiveSheet()
                    if (fWorksheet) {
                        const tableName = params.name || ('table-' + params.cellId)
                        await fWorksheet.addTable(
                            tableName,
                            {
                                startRow: 0,
                                startColumn: 0,
                                endRow: params.rows.length,
                                endColumn: columns.length - 1,
                            },
                            'table-' + params.cellId,
                        )
                    }
                }
            } catch (_) {}
        }

        // ── Gestion du mode readonly / protection ─────────────────────────────────
        if (params.readonly) {
            // Readonly total : désactiver sélection + droits d'édition
            univerAPI.addEvent(univerAPI.Event.LifeCycleChanged, async ({ stage }: any) => {
                if (stage !== univerAPI.Enum.LifecycleStages.Rendered) return
                try {
                    const fWorkbook = univerAPI.getActiveWorkbook()
                    if (!fWorkbook) return
                    const unitId = fWorkbook.getId?.()
                    fWorkbook.disableSelection?.()
                    const permission = fWorkbook.getPermission?.()
                    if (permission) {
                        permission.setWorkbookEditPermission?.(unitId, false)
                        permission.setPermissionDialogVisible?.(false)
                    }
                } catch (e) { console.error('[UniverSheet] readonly setup error:', e) }
                if (materializeAsDuckDB && params.onMaterialize) {
                    const result = _extractSheetData(univerAPI)
                    if (result !== null) {
                        try { await params.onMaterialize(result.csv, result.columnTypes) } catch (_) {}
                    }
                }
            })
        } else {
            // _materializeTimer déclaré ici pour être partagé entre les closures
            let _materializeTimer: any = null

            // Protection des plages toujours active en mode édition.
            // On interroge RangeProtectionRuleModel pour la géométrie et on bloque
            // les mutations sur les cellules appartenant à une plage protégée.
            univerAPI.addEvent(univerAPI.Event.LifeCycleChanged, async ({ stage }: any) => {
                if (stage !== univerAPI.Enum.LifecycleStages.Rendered) return

                univerAPI.setPermissionDialogVisible?.(false)

                const fWorkbook = univerAPI.getActiveWorkbook()
                const fWorksheet = fWorkbook?.getActiveSheet()
                const unitId = fWorkbook?.getId?.()
                const subUnitId = fWorksheet?.getSheetId?.()
                if (!unitId || !subUnitId) return

                const { RangeProtectionRuleModel } = await import('@univerjs/sheets')
                const injector = (univer as any).__getInjector?.() ?? (univer as any)._injector
                const ruleModel = injector?.get?.(RangeProtectionRuleModel)
                if (!ruleModel) return

                univerAPI.addEvent(univerAPI.Event.BeforeCommandExecute, (event: any) => {
                    const id: string = event.id ?? ''

                    // ── Protection ─────────────────────────────────────────────────────
                    if (id === 'sheet.mutation.set-range-values') {
                        const cellValue = event.params?.cellValue
                        if (cellValue && typeof cellValue === 'object') {
                            const rules: any[] = ruleModel.getSubunitRuleList(unitId, subUnitId) ?? []
                            if (rules.length > 0) {
                                for (const rowStr of Object.keys(cellValue)) {
                                    const row = Number(rowStr)
                                    const cols = (cellValue as any)[rowStr]
                                    if (!cols || typeof cols !== 'object') continue
                                    for (const colStr of Object.keys(cols)) {
                                        const col = Number(colStr)
                                        for (const rule of rules) {
                                            for (const range of (rule.ranges ?? [])) {
                                                if (row >= range.startRow && row <= range.endRow &&
                                                    col >= range.startColumn && col <= range.endColumn) {
                                                    event.cancel = true
                                                    return
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // ── onModified ─────────────────────────────────────────────────────
                    // univer.onCommandExecuted ne fonctionne pas dans cette version ;
                    // BeforeCommandExecute est utilisé à la place.
                    if (params.onModified) params.onModified()

                    // ── Matérialisation DuckDB ─────────────────────────────────────────
                    // BeforeCommandExecute est utilisé car onCommandExecuted ne se
                    // déclenche jamais lors des éditions UI. Le délai de 1 500 ms laisse
                    // le temps à la commande de s'appliquer et au moteur de formules de
                    // recalculer les valeurs avant la lecture via save().
                    if (materializeAsDuckDB && params.onMaterialize) {
                        const isDataMutation = (
                            id === 'sheet.mutation.set-range-values' ||
                            id.includes('insert-row') || id.includes('remove-row') ||
                            id.includes('insert-col') || id.includes('remove-col') ||
                            id.includes('sort-range') || id.includes('move-rows') || id.includes('move-cols')
                        )
                        if (isDataMutation) {
                            clearTimeout(_materializeTimer)
                            _materializeTimer = setTimeout(async () => {
                                const result = _extractSheetData(univerAPI)
                                if (result !== null) {
                                    try { await params.onMaterialize!(result.csv, result.columnTypes) } catch (_) {}
                                }
                            }, 1500)
                        }
                    }
                })

                if (materializeAsDuckDB && params.onMaterialize) {
                    const result = _extractSheetData(univerAPI)
                    if (result !== null) {
                        try { await params.onMaterialize(result.csv, result.columnTypes) } catch (_) {}
                    }
                }
            })
        }
    }

    override disconnectedCallback() {
        super.disconnectedCallback()
        try { this._univer?.dispose?.() } catch (_) {}
        this._univer = null
        this._univerAPI = null
    }
}

customElements.define('univer-sheet', UniverSheetElement)
