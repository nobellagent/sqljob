export let loadedConfigSource: unknown = null

/** Mémorise la configuration d'origine (restaurée par buildInitialState). */
export function setLoadedConfigSource(value: unknown) {
    loadedConfigSource = value
}

// État initial du notebook (page, modales, listes de types de cellules).

import {ConfigManager} from '../../lib/ConfigManager'
import {applyThemeFromConfig, initCustomTheme} from '../components/modals/ThemeCustomModal'
import {DuckDBManager} from '../../lib/DuckDBManager'
import {initializeCell} from '../../lib/CellConfigService'

export function buildInitialState() {
    const config = loadedConfigSource ?? ConfigManager.getDefaultConfig()

    const initCell = (cell: any, cellIndex: number) => initializeCell(cell, cellIndex)

    const initGroup = (group: any, groupIndex: number): any => {
        const ng = ConfigManager.normalizeGroup({ ...group })
        const newGroup: any = {
            _id: ng.id || ConfigManager.generateGroupId(),
            _type: ng.type || 'core',
            direction: ng.direction || 'row',
            style: ng.style || '',
            _order: ConfigManager.normalizeOrder(ng.order, groupIndex),
            cells: (ng.cells || []).map((cell: any, ci: number) =>
                initCell(ConfigManager.normalizeCell({ ...cell }), ci)),
            loop: ng.loop ? {
                enabled: ng.loop.enabled || false,
                query: ng.loop.query || '',
                zip: ng.loop.zip || false,
                zipQuery: ng.loop.zipQuery || ''
            } : { enabled: false, query: '', zip: false, zipQuery: '' },
            accordion: ng.accordion || false,
            title: ng.title || '',
            accordionOpen: ng.accordionOpen !== false
        }
        newGroup.tabsChild = ng.tabsChild || false
        newGroup.name = ng.name || ''
        if (Array.isArray(ng.queries) && ng.queries.length > 0) {
            newGroup.queries = ng.queries.map((q: any) => ({
                name: q.name || 'main',
                sql: q.sql || '',
                engine: q.engine || 'sql',
                showQueryEditor: (q.showQueryEditor ?? q.clientVisible) === true
            }))
        } else {
            newGroup.queries = []
        }
        if (ng.children && ng.children.length > 0) {
            newGroup.children = ng.children.map((child: any, ci: number) => {
                const init = initGroup(child, ci)
                init._order = ConfigManager.normalizeOrder(child.order, ci)
                return init
            })
        }
        return newGroup
    }

    let initPages: any[] = (config.job?.pages || []).map((page: any, pi: number) => {
        const allGroups = (page.groups || []).map((g: any, gi: number) => initGroup(g, gi))
        return {
            _id: page.id || ConfigManager.generatePageId(),
            name: page.name || `Feuille ${pi + 1}`,
            groups: allGroups.filter((g: any) => g._type === 'core'),
            linkGroups: allGroups.filter((g: any) => g._type === 'link')
        }
    })

    if (initPages.length === 0) {
        initPages = [{
            _id: ConfigManager.generatePageId(),
            name: 'Feuille 1',
            groups: [],
            linkGroups: []
        }]
    }

    const devMode = config.ui?.devMode !== false
    // La barre latérale est cachée par défaut — le logo sqljob dans le header la toggle.
    const showLayout = config.ui?.showLayout ?? false
    const savedTheme = typeof localStorage !== 'undefined' ? localStorage.getItem('sqljob-theme') : null
    const currentTheme = config.ui?.theme || savedTheme || 'light'
    if (typeof document !== 'undefined') {
        const theme = currentTheme === 'dark' ? 'dark' : 'light'
        document.documentElement.classList.remove('light', 'dark')
        document.documentElement.classList.add(theme)
        localStorage.setItem('sqljob-theme', theme)
        // Appliquer le preset ou CSS custom issu de la config (gist URL, import JSON…)
        if (config.ui?.theme) applyThemeFromConfig(config.ui)
        else initCustomTheme() // config vide → relire le preset/custom depuis localStorage
    }
    const savedDbEngine = typeof localStorage !== 'undefined' ? localStorage.getItem('sqljob-dbEngine') : null
    const initialDbEngine = config.ui?.dbEngine || savedDbEngine || 'duckdb-wasm'
    DuckDBManager.setEngine(initialDbEngine)

    return {
        pages: initPages,
        activePageIndex: 0,
        isLoading: false,
        status: '',
        statusType: '',
        devMode,
        showLayout,
        availableThemes: ['light', 'dark'],
        currentTheme,
        dbEngine: initialDbEngine,
        showDbEngineModal: false,
        directedAcyclicGraph: config.ui?.directedAcyclicGraph === true,

        // GitHub Gist
        githubToken: '',
        gistShareUrl: '',
        showGistModal: false,
        gistWasEncrypted: false,
        gistPassphraseToShare: '',
        showGistTokenModal: false,
        showJsonPassphraseModal: false,
        jsonPassphrase: '',
        jsonPassphraseError: '',
        jsonPassphraseLoading: false,
        _pendingEncryptedJson: null,

        // Export modal
        exportModal: {
            show: false,
            type: '',
            fileName: 'notebook-config.json',
            description: 'sqljob Notebook Configuration',
            devMode: null,
            showLayout: null,
            encryptGist: false,
            gistPassphrase: ''
        },

        // DAG
        _dagDebounceTimer: null,
        _dagDebounceDelay: 200,
        _pagesInitialized: new Set<string>(),

        // Drag & drop pages
        draggedPageIndex: null,
        dragOverPageIndex: null,

        // Modals
        showAddGroupModal: false,
        addCellToGroupModal: { open: false, path: null },
        insertGroupModal: { open: false, atIndex: null },
        insertCellModal: { open: false, groupIndex: null, atCellIndex: null },
        cellConfigModal: { open: false, path: null, cellIndex: null },
        childGroupModal: { open: false, path: null, cellIndex: null, group: null },
        loopConfigModal: { open: false, path: null },
        groupSettingsModal: { open: false, path: null },
        exportDropdownOpen: false,

        // Loop
        _currentLoopValue: null,
        _zipFiles: [],
        _zipMode: false,

        // Drag & drop cells/groups
        draggedCellPath: null,
        dragOverCellPath: null,
        dragOverGroup: null,
        draggedChildPath: null,
        dragOverChildPath: null,
        draggedTopGroup: null,

        // Cell types — icon = nom material-symbols-light (sans préfixe), rendu par CellTypeIcon (lucide)
        cellTypes: [
            { type: 'markdown',           label: 'Markdown',                icon: 'edit-note' },
            { type: 'source',             label: 'Source',                   icon: 'folder-open' },
            { type: 'uiParameter',        label: 'Paramètre UI',             icon: 'tune' },
            { type: 'buttonRunNextCells', label: 'Bouton Exécuter',          icon: 'play-circle' },
            { type: 'sql',  label: 'SQL',                      icon: 'storage' },

            { type: 'iframe',             label: 'HTML/Iframe',              icon: 'web' },
            { type: 'sqlStat',            label: 'Stat SQL',                 icon: 'monitoring' },
            { type: 'pivot',              label: 'Pivot',                    icon: 'pivot-table-chart' },
            { type: 'publipostageWord',   label: 'Publipostage Word',        icon: 'description' },
            { type: 'pdfme',              label: 'PDF (pdfme)',               icon: 'picture-as-pdf' },
            { type: 'perspective',        label: 'Perspective Viewer',       icon: 'analytics' },
            { type: 'univerSheet',        label: 'Univer Sheet',             icon: 'table-chart' },
        ],

        _tables: {},
        _duckdbTables: {} as Record<string, { rowCount: number, columns: {name: string, type: string}[] }>,
        _roomFiles: [] as {name: string, tableName: string, size: number, source: 'dropzone' | 'source-cell'}[],
    }
}

