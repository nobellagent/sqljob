/**
 * Actions de mise à jour immuable du document.
 *
 * Elles remplacent le motif « mutation en place puis re-render forcé » :
 * le mutateur reçoit un brouillon immer, et l'état rendu est un nouvel objet
 * dont seules les branches touchées changent. React voit donc le changement
 * par référence, sans compteur de version.
 */
import type { StoreApi } from 'zustand'
import type { NotebookStoreState } from '../types'
import { updateCellByIdInState, updateCellInState, updateGroupByIdInState, updateGroupInState } from '../mutations'

export function createUpdateSlice(
    set: StoreApi<NotebookStoreState>['setState'],
    _get: StoreApi<NotebookStoreState>['getState'],
) {
    return {
        /** Applique `mutator` à la cellule `cellIndex` du groupe situé à `path`. */
        updateCellAt(path: number[], cellIndex: number, mutator: (cell: any) => void) {
            set((state: any) => updateCellInState(state, path, cellIndex, mutator) as Partial<NotebookStoreState>)
        },

        /** Applique `mutator` au groupe portant `_id`, où qu'il soit. */
        updateGroupById(groupId: string, mutator: (group: any) => void) {
            set((state: any) => updateGroupByIdInState(state, groupId, mutator) as Partial<NotebookStoreState>)
        },

        /** Applique `mutator` au groupe situé à `path`. */
        updateGroupAt(path: number[], mutator: (group: any) => void) {
            set((state: any) => updateGroupInState(state, path, mutator) as Partial<NotebookStoreState>)
        },

        /** Applique `mutator` à la cellule portant `_id`, où qu'elle soit dans le document. */
        updateCellById(cellId: string, mutator: (cell: any) => void) {
            set((state: any) => updateCellByIdInState(state, cellId, mutator) as Partial<NotebookStoreState>)
        },
    }
}
