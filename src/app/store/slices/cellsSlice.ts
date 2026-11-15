import type { StoreApi } from 'zustand'
import { rawTableDataStore as _rawTableDataStore } from '../../../lib/tableDataStore'
import { ConfigManager } from '../../../lib/ConfigManager'
import { CellConfigService, initializeCell } from '../../../lib/CellConfigService'
import { CELL_TYPE_SCHEMAS } from '../../../lib/cellTypeSchemas'
import { useConfirmModal } from '../uiStores'
import type { NotebookStoreState } from '../types'
import { createCellSizingActions } from './cells/sizing'
import { produce } from 'immer'

/** `produce` typé large : le slice reçoit l'état complet, immer rend le suivant. */
const immer = (state: any, fn: (draft: any) => void) => produce(state, fn) as any
import { getCellInState, getGroupInState } from '../mutations'

export const createCellsSlice = (
    set: StoreApi<NotebookStoreState>['setState'],
    get: StoreApi<NotebookStoreState>['getState'],
) => ({

        ...createCellSizingActions(set, get),

    createNewCell(type: string) {
        const newCell: any = {
            _id: get().generateCellId(),
            _status: null,
            _results: null,
            _resultInfo: null,
            _order: 0,
            type
        }
        const baseName = get().generateUniqueCellName(type)
        newCell.name = baseName
        CellConfigService.ensureCellFromSchema(newCell, type, { baseName })
        if (type === 'source') {
            newCell._fileName = ''
            newCell._currentFile = null
            newCell._isDragging = false
            newCell._loaded = false
        }
        if (type === 'uiParameter') {
            newCell._value = ''
            newCell._options = []
            newCell._initialized = false
            newCell._userModified = false
        }
        if (type === 'publipostageWord') {
            newCell.docxTemplateBase64 = null
            newCell.docxTemplateFileName = ''
            newCell._isDragging = false
        }
        if (type === 'pdfme') {
            if (!newCell.json || typeof newCell.json !== 'string' || newCell.json.length < 50) {
                newCell.json = JSON.stringify({
                    basePdf: { width: 210, height: 297, padding: [20, 20, 9, 20], staticSchema: [
                        { name: 'page_header', type: 'text', position: { x: 20, y: 5 }, width: 170, height: 8, content: '{date}', fontSize: 9, fontColor: '#888888', alignment: 'right', readOnly: true },
                        { name: 'footer', type: 'text', position: { x: 20, y: 288 }, width: 170, height: 10, content: 'PIED DE PAGE - Page {currentPage} / {totalPages}', fontSize: 10, fontColor: '#888888', alignment: 'center', readOnly: true }
                    ]},
                    schemas: [[
                        { name: 'header', type: 'text', position: { x: 20, y: 20 }, width: 170, height: 10, content: 'ENTÊTE DU DOCUMENT', fontSize: 16, fontColor: '#6366f1', alignment: 'center' },
                        { name: 'datatable', type: 'table', position: { x: 20, y: 35 }, width: 170, height: 50, content: '[[\"A\",\"B\",\"C\"]]', showHead: true, repeatHead: true, head: ['Col1', 'Col2', 'Col3'], headWidthPercentages: [33, 33, 34], tableStyles: { borderWidth: 0.3, borderColor: '#000000' }, headStyles: { fontSize: 10, fontColor: '#ffffff', backgroundColor: '#6366f1' }, bodyStyles: { fontSize: 9, fontColor: '#333333', alternateBackgroundColor: '#f5f5f5' }, columnStyles: {} }
                    ]]
                }, null, 2)
            }
        }
        if (type === 'perspective') {
            newCell._perspectiveReady = false
            newCell._perspectiveWorker = null
            newCell._perspectiveTable = null
        }
return newCell
    },

    addGroup(cellType: string) {
        const newGroup = get().createNewGroup('row')
        newGroup.cells = [get().createNewCell(cellType)]
        set((state: any) => immer(state, (draft: any) => {
            const groups = draft.pages[draft.activePageIndex].groups
            const maxOrder = groups.length > 0 ? Math.max(...groups.map((g: any) => g._order ?? 0)) : -1
            newGroup._order = maxOrder + 1
            groups.push(newGroup)
            draft.showAddGroupModal = false
        }))
    },

    addCellToGroup(pathOrIndex: any, cellType: string) {
        const path = Array.isArray(pathOrIndex) ? pathOrIndex : [pathOrIndex]
        const newCell = get().createNewCell(cellType)
        set((state: any) => immer(state, (draft: any) => {
            const group = getGroupInState(draft, path)
            if (group) {
                if (!group.cells) group.cells = []
                newCell._order = get().getNextOrder(group)
                group.cells.push(newCell)
            }
            draft.addCellToGroupModal = { open: false, path: null }
        }))
    },

    openAddCellToGroupModal(pathOrIndex: any) {
        const path = Array.isArray(pathOrIndex) ? pathOrIndex : [pathOrIndex]
        set({ addCellToGroupModal: { open: true, path } })
    },

    openInsertGroupModal(atIndex: number) {
        set({ insertGroupModal: { open: true, atIndex } })
    },

    insertGroupAt(atIndex: number, cellType: string) {
        const newGroup = get().createNewGroup('row')
        newGroup.cells = [get().createNewCell(cellType)]
        set((state: any) => immer(state, (draft: any) => {
            const groups = draft.pages[draft.activePageIndex].groups
            // Renuméroter les groupes existants par ordre trié, puis décaler
            // ceux à partir de atIndex pour faire de la place au nouveau.
            const sorted = [...groups].sort((a: any, b: any) => (a._order ?? 0) - (b._order ?? 0))
            sorted.forEach((g: any, i: number) => { g._order = i >= atIndex ? i + 1 : i })
            newGroup._order = atIndex
            groups.push(newGroup)
            draft.insertGroupModal = { open: false, atIndex: null }
        }))
    },

    openInsertCellModal(pathOrIndex: any, atCellIndex: number) {
        const path = Array.isArray(pathOrIndex) ? pathOrIndex : [pathOrIndex]
        set({ insertCellModal: { open: true, path, atCellIndex } })
    },

    insertCellAt(pathOrIndex: any, atCellIndex: number, cellType: string) {
        const path = Array.isArray(pathOrIndex) ? pathOrIndex : [pathOrIndex]
        const newCell = get().createNewCell(cellType)
        set((state: any) => immer(state, (draft: any) => {
            const group = getGroupInState(draft, path)
            if (group) {
                if (!group.cells) group.cells = []
                newCell._order = get().getNextOrder(group)
                group.cells.splice(atCellIndex, 0, newCell)
            }
            draft.insertCellModal = { open: false, path: null, atCellIndex: null }
        }))
    },

    deleteGroup(pathOrIndex: any) {
        const path = Array.isArray(pathOrIndex) ? pathOrIndex : [pathOrIndex]
        get().deleteGroupAtPath(path)
    },

    moveGroup(pathOrIndex: any, direction: number) {
        const path = Array.isArray(pathOrIndex) ? pathOrIndex : [pathOrIndex]
        get().moveGroupAtPath(path, direction)
    },

    async deleteCellAt(pathOrIndex: any, cellIndex: number) {
        const path = Array.isArray(pathOrIndex) ? pathOrIndex : [pathOrIndex]
        const group = get().getGroupAtPath(path)
        if (!group || !group.cells) return

        const hasChildren = group.children && group.children.length > 0

        if (group.cells.length === 1 && !hasChildren) {
            await get().deleteGroupAtPath(path)
        } else {
            if (await useConfirmModal.getState().show('Supprimer cette cellule ?')) {
                const cell = group.cells[cellIndex]
                await get().cleanupSourceCell(cell)
                _rawTableDataStore.delete(cell._id)
                const { _tables } = get()
                if (_tables && _tables[cell._id]) {
                    (_tables[cell._id] as any).destroy()
                    delete _tables[cell._id]
                }
                set((state: any) => immer(state, (draft: any) => {
                    const target = getGroupInState(draft, path)
                    if (target?.cells) target.cells.splice(cellIndex, 1)
                }))
                if (cell.type === 'source') await get().refreshDuckdbTables()
            }
        }
    },

    moveCellInGroup(pathOrIndex: any, cellIndex: number, direction: number) {
        const path = Array.isArray(pathOrIndex) ? pathOrIndex : [pathOrIndex]
        get().moveCellInGroupAtPath(path, cellIndex, direction)
    },

    ensureCellName(pathOrIndex: any, cellIndex: number) {
        const path = Array.isArray(pathOrIndex) ? pathOrIndex : [pathOrIndex]
        const cell = get().getCellAtPath(path, cellIndex)
        if (!cell || !cell.type) return
        let name = cell.name != null ? String(cell.name).trim() : ''
        if (cell.type === 'uiParameter' && cell.referenceName && !name) {
            name = String(cell.referenceName).trim()
        }
        if (!name) name = get().generateUniqueCellName(cell.type, cell._id)
        if (name !== cell.name) get().updateCellById(cell._id, (c: any) => { c.name = name })
    },

    ensureAllCellsHaveNames() {
        const renames: Array<{ id: string; name: string }> = []
        const visit = (groups: any[]) => {
            for (const group of groups || []) {
                for (const cell of group.cells || []) {
                    if (!cell || !cell.type) continue
                    let name = cell.name != null ? String(cell.name).trim() : ''
                    if (cell.type === 'uiParameter' && cell.referenceName && !name) {
                        name = String(cell.referenceName).trim()
                    }
                    if (!name) name = get().generateUniqueCellName(cell.type, cell._id)
                    if (name !== cell.name) renames.push({ id: cell._id, name })
                }
                if (group.children) visit(group.children)
            }
        }
        for (const page of get().pages) {
            visit(page.groups || [])
            if (page.linkGroups) visit(page.linkGroups)
        }
        for (const { id, name } of renames) {
            get().updateCellById(id, (c: any) => { c.name = name })
        }
    },

    openCellConfig(pathOrIndex: any, cellIndex: number) {
        const path = Array.isArray(pathOrIndex) ? pathOrIndex : [pathOrIndex]
        get().ensureCellName(path, cellIndex)
        set({ cellConfigModal: { open: true, path, cellIndex } })
        setTimeout(() => {
            const modal = document.querySelector('[aria-labelledby="modal-cell-config-title"]')
            const cell = get().getCellAtPath(path, cellIndex)
            if (!modal || !cell) return
            const selects = modal.querySelectorAll('select')
            if (selects[0]) selects[0].value = cell.type
            if (['markdown', 'iframe', 'uiParameter'].includes(cell.type) && selects[1]) {
                const engine = ConfigManager.getCellEngine(cell, 'main')
                if (engine && selects[1].value !== engine) selects[1].value = engine
            }
        }, 50)
    },

    getCommonParamsForType(type: string) { return CellConfigService.getCommonParamsForType(type) },
    getCommonParamsExcludingName(type: string) { return (CellConfigService.getCommonParamsForType(type) ?? []).filter((p: any) => p !== 'name') },
    getCommonParamDef(paramKey: string, type: string) { return CellConfigService.getCommonParamDef(paramKey, type) },
    getSpecificParamsForType(type: string) { return CellConfigService.getSpecificParamsForType(type) },
    isSpecificParamVisible(param: any, cell: any) { return CellConfigService.isSpecificParamVisible(param, cell) },
    getQueryLabelForType(type: string, indexOrName: any) {
        const schema = CELL_TYPE_SCHEMAS.types[type]
        const name = typeof indexOrName === 'string' ? indexOrName : schema?.queryNames?.[indexOrName]
        return schema?.queryLabels?.[name] || schema?.queryLabels?.[indexOrName] || CELL_TYPE_SCHEMAS.common.queries?.label || 'Requête SQL'
    },
    getQueryCountForType(type: string) { return CELL_TYPE_SCHEMAS.types[type]?.queryCount ?? 1 },
    getCellValueByPath(cell: any, path: string) { return CellConfigService.getCellValueByPath(cell, path) },
    setCellValueByPath(cell: any, path: string, value: any) { CellConfigService.setCellValueByPath(cell, path, value) },

    onCellTypeChange(pathOrIndex: any, cellIndex: number, oldType: string) {
        const path = Array.isArray(pathOrIndex) ? pathOrIndex : [pathOrIndex]
        const current = get().getCellAtPath(path, cellIndex)
        if (!current) return
        _rawTableDataStore.delete(current._id)
        set((state: any) => immer(state, (draft: any) => {
        const cell = getCellInState(draft, path, cellIndex)
        if (!cell) return

        cell._results = null
        cell._resultInfo = null

        const newType = cell.type
        const baseName = cell.name && String(cell.name).trim() ? cell.name : get().generateUniqueCellName(newType)
        if (!cell.name || !String(cell.name).trim()) cell.name = baseName

        CellConfigService.applyDefaultsOnTypeChange(cell, newType, { oldType, baseName })

        if (cell.type === 'source') {
            if (!cell.name) cell.name = get().generateUniqueSourceName()
            else if (!ConfigManager.getCellQuery(cell, 'main')?.trim()) ConfigManager.setCellQuery(cell, 'main', `CREATE OR REPLACE TABLE ${cell.name} AS SELECT * FROM '{{_fileName}}'`)
            if (!ConfigManager.getCellQuery(cell, 'fallback')?.trim()) ConfigManager.setCellQuery(cell, 'fallback', (CELL_TYPE_SCHEMAS.types.source?.defaults?.queries?.find((q: any) => q.name === 'fallback')?.sql || CELL_TYPE_SCHEMAS.types.source?.defaults?.queries?.[1]?.sql || `CREATE OR REPLACE TABLE ${cell.name} AS SELECT * FROM '{{_fileName}}'`))
            if (cell._fileName === undefined) cell._fileName = ''
            if (cell._currentFile === undefined) cell._currentFile = null
            if (cell._isDragging === undefined) cell._isDragging = false
            if (cell._loaded === undefined) cell._loaded = false
        }
        if (cell.type === 'uiParameter') {
            if (cell.referenceName && (!cell.name || !String(cell.name).trim())) cell.name = String(cell.referenceName).trim()
            if (!ConfigManager.getCellReferenceName(cell)) cell.name = get().generateUniqueCellName('uiParameter', cell._id)
            if (cell._value === undefined) cell._value = ''
            if (!cell._options) cell._options = []
            cell._initialized = false
            cell._userModified = false
        }
        if (cell.type === 'publipostageWord') {
            if (cell.docxTemplateBase64 === undefined) cell.docxTemplateBase64 = null
            if (cell.docxTemplateFileName === undefined) cell.docxTemplateFileName = ''
            if (cell._isDragging === undefined) cell._isDragging = false
        }
        if (cell.type === 'perspective') {
            cell._perspectiveReady = false
            cell._perspectiveWorker = null
            cell._perspectiveTable = null
        }
        }))
    },

    generateUniqueCellName(type: string, excludeId: string | null = null) {
        const existingNames = new Set<string>()
        const collectNames = (groups: any[]) => {
            for (const group of groups) {
                for (const cell of (group.cells || [])) {
                    if (cell.name && String(cell.name).trim() && cell._id !== excludeId) {
                        existingNames.add(String(cell.name).trim())
                    }
                }
                if (group.children) collectNames(group.children)
            }
        }
        for (const page of get().pages) {
            collectNames(page.groups || [])
            if (page.linkGroups) collectNames(page.linkGroups)
        }
        const prefix = CELL_TYPE_SCHEMAS?.types[type]?.defaultNamePrefix ?? 'cell'
        let num = 1
        while (existingNames.has(prefix + num)) num++
        return prefix + num
    },

    isCellNameUsed(name: string, excludeId: string | null = null) {
        const trimmed = name && String(name).trim()
        if (!trimmed) return false
        const collectFromGroups = (groups: any[]): boolean => {
            for (const group of groups) {
                for (const cell of (group.cells || [])) {
                    if (cell._id !== excludeId && cell.name && String(cell.name).trim() === trimmed) return true
                }
                if (group.children && collectFromGroups(group.children)) return true
            }
            return false
        }
        for (const page of get().pages) {
            if (collectFromGroups(page.groups || [])) return true
            if (page.linkGroups && collectFromGroups(page.linkGroups)) return true
        }
        return false
    },

    generateUniqueSourceName() {
        return get().generateUniqueCellName('source')
    },

    validateCellName(path: any, cellIndex: number) {
        const cell = get().getCellAtPath(path, cellIndex)
        if (!cell) return
        const rename = (name: string) => get().updateCellById(cell._id, (c: any) => { c.name = name })
        const currentName = cell.name != null ? String(cell.name).trim() : ''
        if (!currentName) {
            get().setStatus('Le nom ne peut pas être vide', 'error')
            rename(get().generateUniqueCellName(cell.type, cell._id))
            return
        }
        if (currentName.startsWith('_')) {
            get().setStatus('Le nom ne peut pas commencer par _ (réservé aux variables système {{ _xxx }})', 'error')
            rename(get().generateUniqueCellName(cell.type, cell._id))
            return
        }
        if (!ConfigManager.isCellNameValid(cell, currentName)) {
            get().setStatus('Le nom doit commencer par une lettre et ne contenir que des lettres, chiffres et _', 'error')
            rename(currentName.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^[^a-zA-Z]/, 'c'))
            return
        }
        if (get().isCellNameUsed(currentName, cell._id)) {
            get().setStatus(`Le nom "${currentName}" est déjà utilisé par une autre cellule`, 'error')
            rename(get().generateUniqueCellName(cell.type, cell._id))
        }
    },

    validateSingleSourceName(pathOrIndex: any, cellIndex: number) {
        const path = Array.isArray(pathOrIndex) ? pathOrIndex : [pathOrIndex]
        const cell = get().getCellAtPath(path, cellIndex)
        if (!cell || cell.type !== 'source') return
        const currentName = cell.name?.trim()
        const rename = (name: string) => get().updateCellById(cell._id, (c: any) => { c.name = name })
        if (!currentName) {
            get().setStatus('Le nom de la source ne peut pas être vide', 'error')
            rename(get().generateUniqueSourceName())
            return
        }
        if (currentName.startsWith('_')) {
            get().setStatus('Le nom ne peut pas commencer par _ (réservé aux variables système)', 'error')
            rename(get().generateUniqueSourceName())
            return
        }
        if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(currentName)) {
            get().setStatus('Le nom doit commencer par une lettre et ne contenir que des lettres, chiffres et _', 'error')
            rename(currentName.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^[^a-zA-Z]/, 's'))
            return
        }
        if (!get().isNameUniqueAcrossPages(currentName, 'source', get().activePageIndex, path, cellIndex)) {
            get().setStatus(`Le nom de source "${currentName}" est déjà utilisé dans une autre page`, 'error')
            rename(get().generateUniqueSourceName())
        }
    },
})
