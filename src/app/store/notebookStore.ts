/**
 * Store Zustand principal — remplace notebookApp.ts + tous les mixins Alpine.
 *
 * Tous les mixins Alpine ont été convertis en slices Zustand purs.
 * Toute écriture passe par une mise à jour immuable (voir `store/mutations.ts`) :
 * une branche modifiée change de référence, React re-rend sans compteur de version.
 * createRoomShellSlice ajoute le système de layout mosaic (RoomShell).
 */
import { z } from 'zod'
import { createRoomShellSlice, createRoomStore, persistSliceConfigs, LayoutConfig } from '@sqlrooms/room-shell'
import type { NotebookStoreState } from './types'
import { createBaseDuckDbConnector } from '@sqlrooms/duckdb-core'
import { createSqlEditorSlice, createDefaultSqlEditorConfig } from '@sqlrooms/sql-editor'
import { DatabaseIcon } from 'lucide-react'
// Panel components (lazy import safe — utilisés uniquement au rendu, pas à l'évaluation)
import { NotebookPanel } from '../components/NotebookPanel'
import { DataSourcesPanel } from '../components/DataSourcesPanel'
import '@iconify/iconify'
// Slices Zustand purs (convertis depuis les mixins Alpine)
import { createPagesSlice } from './slices/pagesSlice'
import { createHelpersSlice } from './slices/helpersSlice'
import { createParametersSlice } from './slices/parametersSlice'
import { createExportSlice } from './slices/exportSlice'
import { createGroupsSlice } from './slices/groupsSlice'
import { createCellsSlice } from './slices/cellsSlice'
import { createFilesSlice } from './slices/filesSlice'
import { createExecutionSlice } from './slices/executionSlice'
import { createCopyPasteSlice } from './slices/copyPasteSlice'
import { createUpdateSlice } from './slices/updateSlice'
import { ConfigManager, exportConfigToJson } from '../../lib/ConfigManager'
import { applyThemeFromConfig, initCustomTheme } from '../components/modals/ThemeCustomModal'
import { DuckDBManager } from '../../lib/DuckDBManager'
import { CellConfigService, initializeCell } from '../../lib/CellConfigService'
import { EChartSqlParser } from '../../lib/EChartSqlParser'
import { GistEncrypt } from '../../lib/GistEncrypt'
import { GitHubGistManager } from '../../lib/GitHubGistManager'
import { FileHandler } from '../../lib/FileHandler'
import { CDNManager } from '../../lib/CDNManager'
import { CELL_TYPE_SCHEMAS, CELL_TYPE_HANDLERS } from '../../lib/cellTypeSchemas'
import { formatValueForInputType } from '../../lib/utils'


// L'état est immuable : immer gèle les objets produits, donc toute écriture
// directe hors `produce()` échoue bruyamment au lieu de passer inaperçue.

// Dernière configuration chargée (Gist, JSON, URL). Module-scoped : aucun état
// applicatif sur `window` — la valeur ne sert qu'à reconstruire le store.

// ─── Construction de l'état initial (repris de notebookApp.ts) ───────────────
import {buildInitialState, setLoadedConfigSource} from './initialState'


// ─── Panel IDs (Zod enum — typage statique + sécurité à l'exécution) ─────────
const PanelTypes = z.enum(['main', 'data'] as const)
type PanelTypes = z.infer<typeof PanelTypes>

// ─── Connecteur DuckDB ponté vers DuckDBManager ───────────────────────────────
// Permet à SqlEditorModal (et state.db) d'utiliser la même instance DuckDB
// que les cells sqljob, sans dupliquer la connexion.
const duckdbManagerConnector = createBaseDuckDbConnector(
    { dbPath: ':memory:' },
    {
        initializeInternal: async () => {
            // DuckDB est déjà initialisé par helpersMixin.init() — rien à faire
        },
        executeQueryInternal: async (sql: string) => {
            if (DuckDBManager.currentEngine === 'ducklings') return null
            if (!DuckDBManager.connInstance) {
                // DuckDB pas encore prêt : retourne un Arrow table vide pour que
                // refreshTableSchemas() ne plante pas sur .getChild()
                return { schema: { fields: [] }, numRows: 0, getChild: () => null, toArray: () => [] }
            }
            try {
                const result = await DuckDBManager.executeQueryArrow(sql)
                return result
            } catch (err) {
                console.error('[duckdbBridge] error:', err)
                throw err
            }
        },
    }
)

// ─── Store Zustand ────────────────────────────────────────────────────────────
const { roomStore: _roomStore, useRoomStore: _useNotebookStore } = createRoomStore<NotebookStoreState>(
  persistSliceConfigs(
    {
      name: 'sqljob-layout-state-v1',
      sliceConfigSchemas: { layout: LayoutConfig },
    },
    (set, get, store) => {
    // === Slice SqlEditor ===
    const sqlEditorState = createSqlEditorSlice({ config: createDefaultSqlEditorConfig() })(set, get, store)

    // === Slice RoomShell : layout en arbre (modèle 0.29) + panels ===
    const roomShellState = createRoomShellSlice({
        config: { title: 'SQLjob', dataSources: [] },
        connector: duckdbManagerConnector,
        layout: {
            config: {
                type: 'panel',
                id: PanelTypes.enum.main,
                panel: PanelTypes.enum.main,
            } satisfies LayoutConfig,
            panels: {
                [PanelTypes.enum.main]: {
                    title: 'Notebook',
                    icon: () => null,
                    component: NotebookPanel,
                },
                [PanelTypes.enum.data]: {
                    title: 'Sources',
                    icon: DatabaseIcon,
                    component: DataSourcesPanel,
                    placement: 'sidebar',
                },
            },
        },
    })(set, get, store)

    const initialState = buildInitialState()

    // Slices Zustand purs (convertis depuis les mixins Alpine)
    const pagesActions = createPagesSlice(set, get)
    const helpersActions = createHelpersSlice(set, get)
    const parametersActions = createParametersSlice(set, get)
    const exportActions = createExportSlice(set, get)
    const groupsActions = createGroupsSlice(set, get)
    const cellsActions = createCellsSlice(set, get)
    const filesActions = createFilesSlice(set, get)
    const executionActions = createExecutionSlice(set, get)
    const copyPasteActions = createCopyPasteSlice(set, get)
    const updateActions = createUpdateSlice(set, get)

    // Helper : parcourt l'arbre de layout (modèle 0.29) et cherche une clé de panneau
    function layoutHasPanel(node: any, key: string): boolean {
        if (!node) return false
        if (typeof node === 'string') return node === key
        if (node.type === 'panel') return node.id === key || node.panel === key
        if (Array.isArray(node.children)) return node.children.some((c: any) => layoutHasPanel(c, key))
        if (node.root) return layoutHasPanel(node.root, key)
        return false
    }

    function isDataPanelVisible() {
        return layoutHasPanel(get().layout?.config, PanelTypes.enum.data)
    }

    // Override togglePanel pour mobile (< 768px) :
    // ouvre le panneau 'data' en plein écran au lieu du layout splitté
    const originalTogglePanel = roomShellState.layout.togglePanel
    const mobileTogglePanel = (panel: string, show?: boolean) => {
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
        if (isMobile && panel === PanelTypes.enum.data) {
            const dataVisible = isDataPanelVisible()
            const target = dataVisible ? PanelTypes.enum.main : PanelTypes.enum.data
            roomShellState.layout.setConfig({ type: 'panel', id: target, panel: target })
            return
        }
        originalTogglePanel(panel, show)
    }

    return {
        ...sqlEditorState,
        ...roomShellState,
        layout: {
            ...roomShellState.layout,
            togglePanel: mobileTogglePanel,
        },
        ...initialState,
        ...pagesActions,
        ...helpersActions,
        ...parametersActions,
        ...exportActions,
        ...groupsActions,
        ...cellsActions,
        ...filesActions,
        ...executionActions,
        ...copyPasteActions,
        ...updateActions,

        // db.schemaTrees démarre undefined dans DuckDbSlice.
        // deepEquals([], []) bloque la mise à jour si aucune table → schemaTrees reste undefined.
        // On force [] pour que TableStructurePanel render même quand la base est vide.
        db: { ...roomShellState.db, schemaTrees: [] },

        // Override addRoomFile : redirige vers DuckDBManager au lieu du connecteur sqlrooms
        // pour partager une seule instance DuckDB avec toutes les cells sqljob.
        addRoomFile: async (file: File, tableName: string) => {
            const ext = (file.name.split('.').pop() ?? '').toLowerCase();
            await DuckDBManager.registerFile(file.name, file);
            let query: string;
            if (ext === 'csv' || ext === 'tsv') {
                query = `CREATE OR REPLACE TABLE "${tableName}" AS SELECT * FROM read_csv('${file.name}', HEADER = true, AUTO_DETECT = true, SAMPLE_SIZE = -1)`;
            } else if (ext === 'parquet') {
                query = `CREATE OR REPLACE TABLE "${tableName}" AS SELECT * FROM read_parquet('${file.name}')`;
            } else if (ext === 'json') {
                query = `CREATE OR REPLACE TABLE "${tableName}" AS SELECT * FROM read_json_auto('${file.name}')`;
            } else {
                query = `CREATE OR REPLACE TABLE "${tableName}" AS SELECT * FROM '${file.name}'`;
            }
            await DuckDBManager.executeQuery(query);
            set((s: any) => {
                const existing = s._roomFiles ?? [];
                const alreadyPresent = existing.some((f: any) => f.tableName === tableName);
                if (alreadyPresent) return {};
                return { _roomFiles: [...existing, { name: file.name, tableName, size: file.size, source: 'dropzone' }] };
            });
            await get().refreshDuckdbTables();
            if (DuckDBManager.currentEngine !== 'ducklings') {
                try { await get().db.refreshTableSchemas(); } catch { /* ignore */ }
            }
        },

        // Overrides de méthodes mixin qui font des mutations profondes (this.X.Y = val)
        // que le proxy ne peut pas intercepter — on remplace par des set() Zustand directs.
        closeCellConfig: () => set((s: any) => ({ cellConfigModal: { ...s.cellConfigModal, open: false } })),

        // Ré-initialise le store depuis une config chargée (ex: après déchiffrement Gist)
        initFromConfig(loadedConfig: unknown) {
            setLoadedConfigSource(loadedConfig)
            const newState = buildInitialState()
            set(newState as Partial<NotebookStoreState>)
        },

        // Setters directs pour le state exposé aux composants React
        setPages: (pages: any[]) => set({ pages }),
        setActivePageIndex: (i: number) => set({ activePageIndex: i }),
        setIsLoading: (v: boolean) => set({ isLoading: v }),
        setDevMode: (v: boolean) => set({ devMode: v }),
        setShowLayout: (v: boolean) => set({ showLayout: v }),

        // Getters computés (exposés pour les composants React)
        getActivePage: () => {
            const s = get()
            return s.pages[s.activePageIndex] || s.pages[0]
        },
        getGroups: () => {
            const ap = get().getActivePage()
            return ap?.groups || []
        },
        getLinkGroups: () => {
            const ap = get().getActivePage()
            return ap?.linkGroups || []
        },
    }
  })
)

// ─── Exports publics ──────────────────────────────────────────────────────────
export const roomStore = _roomStore
export const useNotebookStore = _useNotebookStore
