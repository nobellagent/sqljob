/**
 * types.ts — Types partagés pour le store Zustand sqljob.
 *
 * NotebookStoreState est composé par intersection des slice state types sqlrooms
 * et de CustomNotebookState (état propre à sqljob).
 * Les types NotebookCell, NotebookGroup, NotebookPage modélisent les entités métier.
 */

import type { PivotConfig, PivotField } from '@sqlrooms/pivot'
import type { RoomShellSliceState } from '@sqlrooms/room-shell'
import type { SqlEditorSliceState } from '@sqlrooms/sql-editor'

// ─── Entités métier ────────────────────────────────────────────────────────────

/** Informations sur une table DuckDB (DataSourcesPanel, PivotBody) */
export type DuckdbTableInfo = {
    rowCount: number
    columns: PivotField[]
    schema?: string
}

/** Requête associée à une cellule (SQL, moteur, affichage) */
export type CellQuery = {
    name: string
    sql: string
    engine: string
    showQueryEditor?: boolean
    showQueryResult?: boolean
    ast?: Record<string, unknown>
    degraded?: boolean
    manualSql?: string
}

/** Option d'un paramètre dropdown */
export type DropdownOption = {
    value: string
    label: string
}

/** Cellule notebook — propriétés persistées + propriétés runtime (préfixées _) */
export type NotebookCell = {
    _id: string
    type: string
    name?: string
    title?: string
    buttonLabel?: string
    queries?: CellQuery[]
    json?: Record<string, unknown>
    materialized?: string
    maxRows?: number
    paramType?: string
    inputType?: string
    rangeMin?: number
    rangeMax?: number
    rangeStep?: number
    userVisible?: boolean
    userEditable?: boolean
    preserveUserValue?: boolean
    referenceName?: string
    childGroupId?: string
    docxTemplateBase64?: string | null
    docxTemplateFileName?: string
    snapshot?: string
    readOnly?: boolean
    icon?: string
    subtitle?: string

    // Runtime (mutable, non persisté)
    _status?: string | null
    _results?: Record<string, unknown>[] | null
    _resultInfo?: string | null
    _markdownContent?: string
    _htmlContent?: string
    _statValue?: string
    _echartsOption?: unknown
    _kpiHtml?: string | null
    _kpiLabel?: string | null
    _sublabel?: string | null
    _kpiIcon?: string | null
    _columnTypes?: Record<string, string>
    _schemaTypes?: Record<string, string>
    _value?: unknown
    _options?: DropdownOption[]
    _initialized?: boolean
    _userModified?: boolean
    _paramError?: string | null
    _fileName?: string
    _currentFile?: File | null
    _isDragging?: boolean
    _loaded?: boolean
    _importFailed?: boolean
    _loadedViaFallback?: boolean
    _mainQueryError?: string | null
    _fallbackQueryError?: string | null
    _rejectErrorsCount?: number
    _rejectedCellsCount?: number
    _rowCount?: number
    _queryBuilder?: string | null
    _pendingFileLoad?: boolean
    _perspectiveReady?: boolean
    _perspectiveScheduled?: boolean
    _perspectiveRendering?: boolean
    _perspectiveWorker?: unknown
    _perspectiveTable?: unknown
    _perspectiveQuery?: string
    _arrowTable?: unknown
    _univerReady?: boolean
    _univerRunId?: number
    _univerRows?: Record<string, unknown>[] | null
    _univerCellTypes?: number[] | null
    _univerColumnFormats?: (string | null)[] | null
    _univerSnapshotPending?: string | null
    _univerModified?: boolean
    _univerAPI?: unknown
    _easyMDEcli?: unknown
    _easyMDE?: unknown
    _renderedHtml?: string
    _order?: number
    [key: string]: unknown
}

/** Configuration de boucle d'un groupe */
export type GroupLoop = {
    enabled: boolean
    query: string
    zip: boolean
    zipQuery: string
}

/** Groupe de cellules */
export type NotebookGroup = {
    _id: string
    _type?: string
    direction: 'row' | 'column'
    style?: string
    _order?: number
    cells: NotebookCell[]
    children?: NotebookGroup[]
    loop?: GroupLoop
    accordion?: boolean
    title?: string
    accordionOpen?: boolean
    tabsChild?: boolean
    name?: string
    queries?: CellQuery[]
    _ifQueryResult?: boolean | null
    [key: string]: unknown
}

/** Page du notebook */
export type NotebookPage = {
    _id: string
    name: string
    groups: NotebookGroup[]
    linkGroups: NotebookGroup[]
}

/** Fichier chargé (dropzone ou cellule source) */
export type RoomFile = {
    name: string
    tableName: string
    size: number
    source: 'dropzone' | 'source-cell'
}

/** Type d'une cellule (icône + label) */
export type CellTypeDescriptor = {
    type: string
    label: string
    icon: string
}

/** Modal d'export */
export type ExportModal = {
    show: boolean
    type: string
    fileName: string
    description: string
    devMode: boolean | null
    showLayout: boolean | null
    encryptGist: boolean
    gistPassphrase: string
    includeFiles?: boolean
}

// ─── État custom sqljob (hors slices sqlrooms) ────────────────────────────────

/**
 * CustomNotebookState — propriétés propres à sqljob non couvertes par les slice
 * state types sqlrooms (buildInitialState + 9 slices Zustand purs).
 */
import type {CustomNotebookState} from './types/notebookState'

export type {CustomNotebookState} from './types/notebookState'

// ─── Type public du store ──────────────────────────────────────────────────────

/**
 * NotebookStoreState — type complet du store Zustand sqljob.
 *
 * Composé par intersection :
 *   - Slice state types sqlrooms (roomShell, sqlEditor, cells, notebook, canvas)
 *   - CustomNotebookState (état propre à sqljob)
 *
 * Ce pattern suit les exemples officiels sqlrooms (ex: notebook/src/store.ts)
 * où RoomState = RoomShellSliceState & ArtifactsSliceState & ... & { custom }
 */
export type NotebookStoreState =
    RoomShellSliceState &
    SqlEditorSliceState &
    CustomNotebookState
