import { createGroupRun } from './execution/groupRun'
import { createZipExport } from './execution/zipExport'
import { createSqlExec } from './execution/sqlExec'
import { createSimpleCells } from './execution/simpleCells'
import { createDocuments } from './execution/documents'
import { createRichCells } from './execution/richCells'
import { createPluginCells } from './execution/pluginCells'
import type {StoreApi} from 'zustand'
import type {NotebookStoreState} from '../types'

/**
 * Exécution des cellules : composition des fabriques par domaine.
 */
export const createExecutionSlice = (
    set: StoreApi<NotebookStoreState>['setState'],
    get: StoreApi<NotebookStoreState>['getState'],
) => ({
    ...createGroupRun(set, get),
    ...createZipExport(set, get),
    ...createSqlExec(set, get),
    ...createSimpleCells(set, get),
    ...createDocuments(set, get),
    ...createPluginCells(set, get),
    ...createRichCells(set, get),
})
