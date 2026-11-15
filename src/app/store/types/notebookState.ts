// État complet du store notebook (interface historique, non découpée).

import type {DuckdbTableInfo, NotebookCell, NotebookGroup, NotebookPage, RoomFile, CellTypeDescriptor, ExportModal} from '../types'

export interface CustomNotebookState {
    // ── État initial (buildInitialState) ──────────────────────────────────────
    pages: NotebookPage[]
    activePageIndex: number
    isLoading: boolean
    status: string
    statusType: string
    devMode: boolean
    showLayout: boolean
    availableThemes: string[]
    currentTheme: string
    dbEngine: string
    showDbEngineModal: boolean
    directedAcyclicGraph: boolean

    // GitHub Gist
    githubToken: string
    gistShareUrl: string
    showGistModal: boolean
    gistWasEncrypted: boolean
    gistPassphraseToShare: string
    showGistTokenModal: boolean
    showJsonPassphraseModal: boolean
    jsonPassphrase: string
    jsonPassphraseError: string
    jsonPassphraseLoading: boolean
    _pendingEncryptedJson: unknown

    // Export modal
    exportModal: ExportModal

    // DAG
    _dagDebounceTimer: ReturnType<typeof setTimeout> | null
    _dagDebounceDelay: number
    _pagesInitialized: Set<string>

    // Drag & drop pages
    draggedPageIndex: number | null
    dragOverPageIndex: number | null

    // Modals
    showAddGroupModal: boolean
    addCellToGroupModal: { open: boolean; path: number[] | null; groupIndex?: number | null }
    insertGroupModal: { open: boolean; atIndex: number | null }
    insertCellModal: { open: boolean; groupIndex?: number | null; atCellIndex: number | null; path?: number[] | null }
    cellConfigModal: { open: boolean; path: number[] | null; cellIndex: number | null }
    childGroupModal: { open: boolean; path: number[] | null; cellIndex: number | null; group: NotebookGroup | null }
    loopConfigModal: { open: boolean; path: number[] | null }
    groupSettingsModal: { open: boolean; path: number[] | null }
    exportDropdownOpen: boolean

    // Loop
    _currentLoopValue: unknown
    _zipFiles: { filename: string; content: unknown; type: string }[]
    _zipMode: boolean

    // Drag & drop cells/groups
    draggedCellPath: number[] | null
    dragOverCellPath: number[] | null
    dragOverGroup: unknown
    draggedChildPath: unknown
    dragOverChildPath: unknown
    draggedTopGroup: unknown

    // Cell types registry
    cellTypes: CellTypeDescriptor[]

    // Runtime tables
    _tables: Record<string, unknown>
    _duckdbTables: Record<string, DuckdbTableInfo>
    _roomFiles: RoomFile[]

    // Clipboard
    _clipboardItem: { type: 'sqljob-cell' | 'sqljob-group'; data: unknown } | null

    // ── Overrides / méthodes store ────────────────────────────────────────────
    addRoomFile: (file: File, tableName: string) => Promise<void>
    closeCellConfig: () => void
    /** Applique un mutateur immer à une cellule ciblée par chemin + index. */
    updateCellAt: (path: number[], cellIndex: number, mutator: (cell: any) => void) => void
    /** Applique un mutateur immer à un groupe ciblé par chemin. */
    updateGroupAt: (path: number[], mutator: (group: any) => void) => void
    /** Applique un mutateur immer à la cellule portant cet identifiant. */
    updateCellById: (cellId: string, mutator: (cell: any) => void) => void
    saveToLocalStorage?: () => void
    initFromConfig: (loadedConfig: unknown) => void
    setPages: (pages: NotebookPage[]) => void
    setActivePageIndex: (i: number) => void
    setIsLoading: (v: boolean) => void
    setDevMode: (v: boolean) => void
    setShowLayout: (v: boolean) => void
    getActivePage: () => NotebookPage
    getGroups: () => NotebookGroup[]
    getLinkGroups: () => NotebookGroup[]

    // ── Slices Zustand purs — méthodes ───────────────────────────────────────

    // pagesSlice
    addPage: () => void
    deletePage: (index: number) => Promise<void>
    startPageDrag: (index: number, event: DragEvent) => void
    onPageDragOver: (index: number, event: DragEvent) => void
    onPageDragLeave: () => void
    onPageDrop: (targetIndex: number, event: DragEvent) => void
    endPageDrag: () => void
    switchPage: (index: number) => void
    activatePage: (index: number) => Promise<void>
    refreshMarkdownCellsForPage: (pageIndex: number) => void
    shouldShowCell: (cell: NotebookCell) => boolean
    shouldShowGroup: (group: NotebookGroup) => boolean

    // helpersSlice
    hasSourceCells: () => boolean
    canUseDucklings: () => boolean
    switchDbEngine: (newEngine: string) => Promise<void>
    refreshDuckdbTables: () => Promise<void>
    refreshDuckdbSchema: () => Promise<void>
    init: () => Promise<void>
    evaluateGroupIfQuery: (group: NotebookGroup) => Promise<boolean>
    evaluateAllGroupIfQueries: () => Promise<void>
    setStatus: (message: string, type: string) => void
    syncMarkdownToEditor: (path: number[], cellIndex: number) => void
    getCellIcon: (type: string) => string
    generateCellId: () => string
    generateGroupId: () => string
    generatePageId: () => string
    isNameUniqueAcrossPages: (name: string, type: string, excludePageIndex?: number | null, excludePath?: unknown, excludeCellIndex?: number | null) => boolean
    getAllNamesOfType: (type: string) => string[]
    getCell: (groupIndex: number, cellIndex: number) => NotebookCell | undefined
    downloadSourceFile: (pathOrIndex: number | number[], cellIndex: number) => void

    // parametersSlice
    getParameters: () => Record<string, unknown>
    parseQueryWithParameters: (query: string, extraParams?: Record<string, unknown>) => string
    findReferencedParams: (query: string) => string[]
    findDependentCells: (paramName: string) => { cell: NotebookCell; path: number[]; cellIndex: number }[]
    findDependentGroups: (paramName: string) => { group: NotebookGroup; path: number[] }[]
    detectCycleInDAG: () => boolean
    onParameterValueChange: (cell: NotebookCell) => Promise<void>
    _executeDAGRefresh: (paramName: string) => Promise<void>
    generateUniqueParamName: () => string
    isParamNameUsed: (paramName: string, excludeId: string) => boolean
    validateParamName: (pathOrIndex: unknown, cellIndex: number) => void

    // exportSlice
    setTheme: (themeName: string) => void
    buildExportConfig: (options?: { devMode?: boolean; showLayout?: boolean; includeFileData?: boolean }) => Promise<unknown>
    openExportModal: (type: string) => void
    executeExport: () => Promise<void>
    exportHTMLWithConfig: (config: unknown, fileName?: string, passphrase?: string | null, includeFiles?: boolean) => Promise<void>
    copyExportJson: () => Promise<boolean>
    cancelExport: () => void
    saveGithubToken: () => void
    cancelGithubToken: () => void
    copyGistUrl: () => void
    copyGistPassphrase: () => void
    closeGistModal: () => void
    openGistUrl: () => void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    loadConfig: (event: any) => Promise<void>
    cancelJsonPassphraseModal: () => void
    unlockJsonConfig: () => Promise<void>
    applyImportedConfig: (config: unknown) => Promise<void>

    // groupsSlice
    getFlattenedGroups: () => unknown[]
    getFlattenedGroupsForAllPages: () => unknown[]
    getGroupItems: (group: NotebookGroup) => unknown[]
    getGroupAtPath: (path: number[]) => NotebookGroup | null
    getParentGroup: (path: number[]) => NotebookGroup | null
    getCellAtPath: (path: number[], cellIndex: number) => NotebookCell | undefined
    createNewGroup: (direction?: 'row' | 'column') => NotebookGroup
    addNestedGroup: (path: number[]) => void
    toggleGroupDirection: (path: number[]) => void
    openLoopConfigModal: (path: number[]) => void
    openGroupSettingsModal: (path: number[]) => void
    testGroupIfQuery: (path: number[]) => Promise<void>
    toggleAccordion: (path: number[]) => void
    getDefaultLoopQuery: () => string
    getDefaultZipQuery: () => string
    deleteGroupAtPath: (path: number[]) => Promise<void>
    getLinkGroupById: (groupId: string) => NotebookGroup | undefined
    openChildGroupModal: (path: number[], cellIndex: number) => Promise<void>
    closeChildGroupModal: () => void
    deleteChildGroupModal: () => Promise<void>
    moveGroupAtPath: (path: number[], direction: number) => void
    moveCellInGroupAtPath: (path: number[], cellIndex: number, direction: number) => void
    getGroupElementId: (path: number[]) => string
    openAddGroupModal: () => void
    getNextOrder: (group: NotebookGroup) => number
    getSortedCells: (group: NotebookGroup) => { cell: NotebookCell; originalIndex: number }[]
    getSortedChildren: (group: NotebookGroup) => { child: NotebookGroup; originalIndex: number }[]
    getAllItemsSorted: (group: NotebookGroup) => { type: string; item: NotebookCell | NotebookGroup; originalIndex: number; order: number }[]
    getTabName: (tabItem: unknown, tabIdx: number) => string
    moveItemInGroup: (path: number[], itemType: string, originalIndex: number, direction: number) => void
    isFirstInGroup: (group: NotebookGroup, itemType: string, originalIndex: number) => boolean
    isLastInGroup: (group: NotebookGroup, itemType: string, originalIndex: number) => boolean
    getSortedIndex: (group: NotebookGroup, itemType: string, originalIndex: number) => number

    // cellsSlice
    hasCellMinSize: (cell: NotebookCell) => boolean
    hasCellMaxSize: (cell: NotebookCell) => boolean
    hasCellHeight: (cell: NotebookCell) => boolean
    isSqlCellWithEditor: (type: string) => boolean
    bodyDisplayShouldShowSkeleton: (cell: NotebookCell) => boolean
    bodyDisplayShouldShowContent: (cell: NotebookCell) => boolean
    getCellHeightVars: (cell: NotebookCell) => string
    getCellSizeOuterClass: (cell: NotebookCell, isColumn: boolean) => string
    getCellWrapperStyle: (cell: NotebookCell, isColumn: boolean, order: number) => Record<string, unknown>
    getCellSizeInnerClass: () => string
    createNewCell: (type: string) => NotebookCell
    addGroup: (cellType: string) => void
    addCellToGroup: (pathOrIndex: number | number[], cellType: string) => void
    openAddCellToGroupModal: (pathOrIndex: number | number[]) => void
    openInsertGroupModal: (atIndex: number) => void
    insertGroupAt: (atIndex: number, cellType: string) => void
    openInsertCellModal: (pathOrIndex: number | number[], atCellIndex: number) => void
    insertCellAt: (pathOrIndex: number | number[], atCellIndex: number, cellType: string) => void
    deleteGroup: (pathOrIndex: number | number[]) => void
    moveGroup: (pathOrIndex: number | number[], direction: number) => void
    deleteCellAt: (pathOrIndex: number | number[], cellIndex: number) => Promise<void>
    moveCellInGroup: (pathOrIndex: number | number[], cellIndex: number, direction: number) => void
    ensureCellName: (pathOrIndex: number | number[], cellIndex: number) => void
    ensureAllCellsHaveNames: () => void
    openCellConfig: (pathOrIndex: number | number[], cellIndex: number) => void
    getCommonParamsForType: (type: string) => unknown[]
    getCommonParamsExcludingName: (type: string) => unknown[]
    getCommonParamDef: (paramKey: string, type: string) => unknown
    getSpecificParamsForType: (type: string) => unknown[]
    isSpecificParamVisible: (param: unknown, cell: NotebookCell) => boolean
    getQueryLabelForType: (type: string, indexOrName: string | number) => string
    getQueryCountForType: (type: string) => number
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getCellValueByPath: (cell: NotebookCell, path: string) => any
    setCellValueByPath: (cell: NotebookCell, path: string, value: unknown) => void
    onCellTypeChange: (pathOrIndex: number | number[], cellIndex: number, oldType: string) => void
    generateUniqueCellName: (type: string, excludeId?: string | null) => string
    isCellNameUsed: (name: string, excludeId?: string | null) => boolean
    generateUniqueSourceName: () => string
    validateCellName: (path: number[], cellIndex: number) => void
    validateSingleSourceName: (pathOrIndex: number | number[], cellIndex: number) => void

    // filesSlice
    loadEmbeddedFiles: () => Promise<void>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handleSingleSourceDrop: (e: any, path: number[], cellIndex: number) => void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handleSingleSourceFileSelect: (e: any, path: number[], cellIndex: number) => void
    loadSingleSourceFile: (file: File, path: number[], cellIndex: number, options?: Record<string, unknown>) => Promise<void>
    executeSourceCell: (cell: NotebookCell, path: number[], cellIndex: number) => Promise<void>
    cleanupSourceCell: (cell: NotebookCell) => Promise<void>
    removeSingleSourceFile: (path: number[], cellIndex: number) => Promise<void>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handleDocxTemplateDrop: (e: any, path: number[], cellIndex: number) => void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handleDocxTemplateFileSelect: (e: any, path: number[], cellIndex: number) => void
    loadDocxTemplate: (file: File, path: number[], cellIndex: number) => Promise<void>
    downloadDocxTemplate: (path: number[], cellIndex: number) => void
    removeDocxTemplate: (path: number[], cellIndex: number) => void
    loadPendingSourceFiles: () => Promise<void>

    // executionSlice
    runGroupAtPath: (path: number[]) => Promise<{ stopped: boolean; reason?: string; cellName?: string }>
    isCellSkippedInAutoFlow: (cell: NotebookCell) => boolean
    runGroupOnce: (path: number[], group: NotebookGroup) => Promise<{ stopped: boolean }>
    addFileToZip: (filename: string, content: unknown, type?: string) => boolean
    downloadOrZipFile: (filename: string, content: unknown, mimeType?: string) => boolean
    runGroupWithLoop: (path: number[], group: NotebookGroup) => Promise<{ stopped: boolean }>
    generateAndDownloadZip: (group: NotebookGroup) => Promise<void>
    runCellAt: (pathOrIndex: number | number[], cellIndex: number) => Promise<void>
    runGroup: (pathOrIndex: number | number[]) => Promise<{ stopped: boolean }>
    executeSqlRecursiveParseCell: (cell: NotebookCell) => Promise<void>
    showSqlEditorVisible: (cell: NotebookCell) => boolean
    showQueryResult: (cell: NotebookCell) => boolean
    isSqlResultTabular: (cell: NotebookCell) => boolean
    isSqlResultText: (cell: NotebookCell) => boolean
    getSqlResultAsText: (cell: NotebookCell) => string
    executeMarkdownCell: (cell: NotebookCell) => Promise<void>
    executeIframeCell: (cell: NotebookCell) => Promise<void>
    renderIframeInContainer: (cell: NotebookCell) => void
    executeSqlStatCell: (cell: NotebookCell) => Promise<void>
    executePivotCell: (cell: NotebookCell) => Promise<void>
    executeUiParameterCell: (cell: NotebookCell) => Promise<void>
    executePublipostageWordCell: (cell: NotebookCell) => Promise<void>
    executePdfmeCell: (cell: NotebookCell) => Promise<void>
    executePerspectiveCell: (cell: NotebookCell) => Promise<void>
    renderPerspectiveInContainer: (cell: NotebookCell) => Promise<void>
    executeUniverSheetCell: (cell: NotebookCell) => Promise<void>
    captureUniverSnapshot: (cell: NotebookCell, univerAPI: unknown) => Promise<void>
    exportUniverToXlsx: (univerAPI: unknown, cellName: string) => Promise<void>
    runGroupsFromIndex: (startGroupIndex: number) => Promise<void>
    runGroupsFromIndexWithStopConditions: (startGroupIndex: number) => Promise<{ stopped: boolean }>
    runGroupWithStopConditions: (path: number[]) => Promise<{ stopped: boolean; reason?: string }>
    runCellsAfterWithStopConditions: (path: number[], cellIndex: number, cellId?: string | null) => Promise<{ stopped: boolean }>
    runCellsAfter: (path: number[], cellIndex: number) => Promise<void>
    runAllGroups: () => Promise<void>

    // copyPasteSlice
    hasClipboardItem: () => boolean
    _safeSerialize: (obj: unknown) => unknown
    _cloneCellForCopy: (cell: NotebookCell) => Partial<NotebookCell>
    _cloneGroupForCopy: (group: NotebookGroup) => Partial<NotebookGroup>
    _collectUsedCellNames: () => Set<string>
    _makeUniqueName: (baseName: string, usedNames: Set<string>) => string
    _prepareGroupForPaste: (group: NotebookGroup, usedNames: Set<string>) => void
    copyCellAt: (pathOrIndex: number | number[], cellIndex: number) => void
    copyGroupAtPath: (pathOrIndex: number | number[]) => void
    pasteToGroup: (pathOrIndex: number | number[]) => void

    // ── Index signature pour les méthodes sqlrooms non réexportées ───────────
    [key: string]: unknown
}

