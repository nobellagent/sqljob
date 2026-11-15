import type { StoreApi } from 'zustand'
import type { NotebookStoreState } from '../../types'
import { ConfigManager } from '../../../../lib/ConfigManager'
import { STORAGE_LIGHT, STORAGE_DARK, STORAGE_PRESET } from '../../../components/modals/ThemeCustomModal'

/** Application du thème (extrait). */
export function createThemeActions(
    set: StoreApi<NotebookStoreState>['setState'],
    get: StoreApi<NotebookStoreState>['getState'],
) {
    return {
        setTheme(themeName: string) {
            const theme = themeName === 'dark' ? 'dark' : 'light'
            set({ currentTheme: theme })
            document.documentElement.classList.remove('light', 'dark')
            document.documentElement.classList.add(theme)
            localStorage.setItem('sqljob-theme', theme)
        },

        // ─── Config dans le store — remplace ConfigManager.buildConfigFromState(this.pages, ...) ───
        async buildExportConfig(options: {
            devMode?: boolean
            showLayout?: boolean
            includeFileData?: boolean
        } = {}) {
            const s = get()
            const devMode = options.devMode ?? s.devMode
            const showLayout = options.showLayout ?? s.showLayout
            const includeFileData = options.includeFileData ?? false
            const presetName   = localStorage.getItem(STORAGE_PRESET) || 'default'
            const customLight  = presetName === 'custom' ? (localStorage.getItem(STORAGE_LIGHT) || '') : ''
            const customDark   = presetName === 'custom' ? (localStorage.getItem(STORAGE_DARK)  || '') : ''

            // Capturer les snapshots des cellules univerSheet modifiées avant l'export
            try {
                const allCells: any[] = []
                function collectCells(groups: any[]) {
                    for (const g of (groups || [])) {
                        for (const c of (g.cells || [])) allCells.push(c)
                        collectCells(g.children || [])
                    }
                }
                for (const page of (s.pages || [])) {
                    collectCells(page.groups || [])
                    collectCells(page.linkGroups || [])
                }
                for (const cell of allCells) {
                    if (cell.type === 'univerSheet' && cell._univerModified && cell._univerAPI) {
                        await get().captureUniverSnapshot(cell, cell._univerAPI)
                    }
                }
            } catch (e) {
                console.warn('[exportSlice] Erreur capture snapshots Univer:', e)
            }

            return ConfigManager.buildConfigFromState(
                s.pages,
                devMode,
                showLayout,
                includeFileData,
                presetName,
                s.dbEngine,
                s.directedAcyclicGraph,
                customLight,
                customDark
            )
        },

    }
}
