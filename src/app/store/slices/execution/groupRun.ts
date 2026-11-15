import {DuckDBManager} from '../../../../lib/DuckDBManager'
import {ConfigManager} from '../../../../lib/ConfigManager'
import type {StoreApi} from 'zustand'
import type {NotebookStoreState} from '../../types'

export function createGroupRun(
    set: StoreApi<NotebookStoreState>['setState'],
    get: StoreApi<NotebookStoreState>['getState'],
) {
    return {
    async runGroupAtPath(path) {
        const group = get().getGroupAtPath(path)
        if (!group) return { stopped: false }

        const useLoop = !!(group.loop && group.loop.enabled && group.loop.query)

        if (useLoop) {
            return await get().runGroupWithLoop(path, group)
        } else {
            return await get().runGroupOnce(path, group)
        }
    },

    isCellSkippedInAutoFlow(cell) {
        if (!cell || cell.type === 'buttonRunNextCells') return false
        if (get()._zipMode) return false
        return !!(cell.buttonLabel && String(cell.buttonLabel).trim() !== '')
    },

    async runGroupOnce(path, group) {
        if (ConfigManager.getGroupIfQuery(group)) {
            get().setStatus('Évaluation de la condition ifQuery...', 'loading')
            const ifQueryResult = await get().evaluateGroupIfQuery(group)
            get().updateGroupById(group._id, (g: any) => { g._ifQueryResult = ifQueryResult })

            if (!ifQueryResult) {
                get().setStatus('Groupe ignoré (ifQuery = false)', 'info')
                return { stopped: false }
            }
        }

        get().setStatus('Exécution du groupe...', 'loading')

        const orderedItems = get().getAllItemsSorted(group)
        for (const item of orderedItems) {
            if (item.type === 'child') {
                const result = await get().runGroupAtPath([...path, item.originalIndex])
                if (result?.stopped) return result
                continue
            }

            const cell = item.item as import('../../types').NotebookCell
            if (cell.type === 'buttonRunNextCells') {
                get().setStatus('Arrêt : bouton "Exécuter les cellules suivantes" rencontré', 'info')
                return { stopped: true, reason: 'buttonRunNextCells' }
            }
            if (get().isCellSkippedInAutoFlow(cell)) continue
            if (cell.type === 'source') {
                if (!cell._fileName || !cell._currentFile || !cell._loaded) {
                    get().setStatus(`Source "${cell.name || 'source'}" sans fichier chargé — exécution interrompue`, 'warning')
                    return { stopped: true, reason: 'source_no_file', cellName: cell.name }
                }
                if (cell._status === 'error') {
                    get().setStatus(`Erreur source "${cell.name || 'source'}" — exécution interrompue`, 'error')
                    return { stopped: true, reason: 'source_error', cellName: cell.name }
                }
                continue
            }
            await get().runCellAt(path, item.originalIndex)
        }

        get().setStatus('Groupe exécuté', 'success')
        return { stopped: false }
    },

    async runGroupWithLoop(path, group) {
        if (ConfigManager.getGroupIfQuery(group)) {
            get().setStatus('Évaluation de la condition ifQuery...', 'loading')
            const ifQueryResult = await get().evaluateGroupIfQuery(group)
            get().updateGroupById(group._id, (g: any) => { g._ifQueryResult = ifQueryResult })

            if (!ifQueryResult) {
                get().setStatus('Groupe ignoré (ifQuery = false)', 'info')
                return { stopped: false }
            }
        }

        get().setStatus('Initialisation de la boucle...', 'loading')

        const zipEnabled = group.loop.zip === true
        if (zipEnabled) {
            set({ _zipMode: true, _zipFiles: [] })
        }

        try {
            const loopQuery = group.loop.query
            const parsedLoopQuery = get().parseQueryWithParameters(loopQuery)
            const loopResults = await DuckDBManager.executeQuery(parsedLoopQuery)

            if (!loopResults || loopResults.length === 0) {
                get().setStatus('Boucle: aucune valeur trouvée', 'warning')
                set({ _zipMode: false, _zipFiles: [] })
                return { stopped: false }
            }

            const firstColumnName = Object.keys(loopResults[0])[0]
            const loopValues = loopResults.map(row => row[firstColumnName])

            get().setStatus(`Boucle: ${loopValues.length} itérations`, 'loading')

            for (let i = 0; i < loopValues.length; i++) {
                const loopValue = loopValues[i]
                set({ _currentLoopValue: loopValue })
                get().setStatus(`Boucle ${i + 1}/${loopValues.length}: {{ _loop }} = ${loopValue}`, 'loading')

                const orderedItems = get().getAllItemsSorted(group)
                for (const item of orderedItems) {
                    if (item.type === 'child') {
                        const result = await get().runGroupAtPath([...path, item.originalIndex])
                        if (result?.stopped) return result
                        continue
                    }

                    const cell = item.item as import('../../types').NotebookCell
                    if (cell.type === 'buttonRunNextCells') {
                        get().setStatus('Arrêt : bouton "Exécuter les cellules suivantes" rencontré', 'info')
                        return { stopped: true, reason: 'buttonRunNextCells' }
                    }
                    if (get().isCellSkippedInAutoFlow(cell)) continue
                    if (cell.type === 'source') {
                        if (!cell._fileName || !cell._currentFile || !cell._loaded) {
                            return { stopped: true, reason: 'source_no_file', cellName: cell.name }
                        }
                        if (cell._status === 'error') {
                            return { stopped: true, reason: 'source_error', cellName: cell.name }
                        }
                        continue
                    }
                    await get().runCellAt(path, item.originalIndex)
                }
            }

            set({ _currentLoopValue: null })

            if (zipEnabled && get()._zipFiles.length > 0) {
                await get().generateAndDownloadZip(group)
            }

            get().setStatus(`Boucle terminée: ${loopValues.length} itérations` + (zipEnabled ? ` - ${get()._zipFiles.length} fichier(s) zippé(s)` : ''), 'success')
            return { stopped: false }

        } catch (error) {
            set({ _currentLoopValue: null })
            get().setStatus('Erreur boucle: ' + error.message, 'error')
            return { stopped: true }
        } finally {
            set({ _zipMode: false, _zipFiles: [] })
        }
    },

    async runGroup(pathOrIndex) {
        const path = Array.isArray(pathOrIndex) ? pathOrIndex : [pathOrIndex]
        return await get().runGroupAtPath(path)
    },

    async runAllGroups() {
        set({ isLoading: true })
        get().setStatus('Exécution de tous les groupes...', 'loading')

        await get().evaluateAllGroupIfQueries()

        const groups = get().getGroups()
        for (let groupIndex = 0; groupIndex < groups.length; groupIndex++) {
            const result = await get().runGroup(groupIndex)
            if (result?.stopped) {
                set({ isLoading: false })
                if (get().statusType === 'loading') {
                    get().setStatus('Exécution interrompue', 'warning')
                }
                return
            }
        }

        set({ isLoading: false })
        get().setStatus('Toutes les cellules de la page exécutées', 'success')
    },
    async runGroupsFromIndex(startGroupIndex) {
        const groups = get().getGroups()
        for (let groupIndex = startGroupIndex; groupIndex < groups.length; groupIndex++) {
            await get().runGroup(groupIndex)
        }
    },

    async runGroupsFromIndexWithStopConditions(startGroupIndex) {
        const groups = get().getGroups()
        for (let groupIndex = startGroupIndex; groupIndex < groups.length; groupIndex++) {
            const result = await get().runGroupWithStopConditions([groupIndex])
            if (result.stopped) {
                return result
            }
        }
        return { stopped: false }
    },

    async runGroupWithStopConditions(path) {
        const group = get().getGroupAtPath(path)
        if (!group) return { stopped: false }

        if (ConfigManager.getGroupIfQuery(group)) {
            get().setStatus('Évaluation de la condition ifQuery...', 'loading')
            const ifQueryResult = await get().evaluateGroupIfQuery(group)
            get().updateGroupById(group._id, (g: any) => { g._ifQueryResult = ifQueryResult })

            if (!ifQueryResult) {
                get().setStatus('Groupe ignoré (ifQuery = false)', 'info')
                return { stopped: false }
            }
        }

        const orderedItems = get().getAllItemsSorted(group)
        for (const item of orderedItems) {
            if (item.type === 'child') {
                const result = await get().runGroupWithStopConditions([...path, item.originalIndex])
                if (result.stopped) return result
                continue
            }

            const cell = item.item as import('../../types').NotebookCell

            if (cell.type === 'buttonRunNextCells') {
                return { stopped: true, reason: 'buttonRunNextCells' }
            }
            if (get().isCellSkippedInAutoFlow(cell)) continue

            if (cell.type === 'source') {
                if (!cell._fileName || !cell._currentFile || !cell._loaded) {
                    return { stopped: true, reason: 'source_no_file', cellName: cell.name }
                }
                if (cell._status === 'error') {
                    get().setStatus(`Arrêt : la source "${cell.name}" a une erreur de chargement`, 'info')
                    return { stopped: true, reason: 'source_error', cellName: cell.name }
                }
                continue
            }

            try {
                cell._status = 'running'
                await get().runCellAt(path, item.originalIndex)

                if (cell._status === 'error') {
                    get().setStatus(`Arrêt : erreur lors de l'exécution d'une cellule`, 'error')
                    return { stopped: true, reason: 'cell_error' }
                }
            } catch (error) {
                cell._status = 'error'
                get().setStatus(`Arrêt : erreur - ${error.message}`, 'error')
                return { stopped: true, reason: 'execution_error', error: error.message }
            }
        }

        return { stopped: false }
    },

    async runCellsAfterWithStopConditions(path, cellIndex, cellId = null) {
        const group = get().getGroupAtPath(path)
        if (!group) return { stopped: false }

        const orderedItems = get().getAllItemsSorted(group)
        const startIndex = orderedItems.findIndex(item =>
            item.type === 'cell' &&
            (cellId ? item.item?._id === cellId : item.originalIndex === cellIndex)
        )
        if (startIndex === -1) return { stopped: false }

        for (let i = startIndex + 1; i < orderedItems.length; i++) {
            const item = orderedItems[i]

            if (item.type === 'child') {
                const result = await get().runGroupWithStopConditions([...path, item.originalIndex])
                if (result.stopped) return result
                continue
            }

            const cell = item.item as import('../../types').NotebookCell

            if (cell.type === 'buttonRunNextCells') {
                get().setStatus('Arrêt : bouton "Exécuter les cellules suivantes" rencontré', 'info')
                return { stopped: true, reason: 'buttonRunNextCells' }
            }
            if (get().isCellSkippedInAutoFlow(cell)) continue

            if (cell.type === 'source') {
                if (!cell._fileName || !cell._currentFile || !cell._loaded) {
                    get().setStatus(`Arrêt : la source "${cell.name}" n'a pas de fichier chargé`, 'info')
                    return { stopped: true, reason: 'source_no_file', cellName: cell.name }
                }
                if (cell._status === 'error') {
                    get().setStatus(`Arrêt : la source "${cell.name}" a une erreur de chargement`, 'info')
                    return { stopped: true, reason: 'source_error', cellName: cell.name }
                }
                continue
            }

            try {
                cell._status = 'running'
                await get().runCellAt(path, item.originalIndex)

                if (cell._status === 'error') {
                    get().setStatus(`Arrêt : erreur lors de l'exécution d'une cellule`, 'error')
                    return { stopped: true, reason: 'cell_error' }
                }
            } catch (error) {
                cell._status = 'error'
                get().setStatus(`Arrêt : erreur - ${error.message}`, 'error')
                return { stopped: true, reason: 'execution_error', error: error.message }
            }
        }

        let currentPath = [...path]
        while (currentPath.length > 1) {
            const childIndexInParent = currentPath[currentPath.length - 1]
            currentPath = currentPath.slice(0, -1)
            const parentGroup = get().getGroupAtPath(currentPath)
            if (!parentGroup) break

            const parentOrderedItems = get().getAllItemsSorted(parentGroup)
            const childPos = parentOrderedItems.findIndex(item =>
                item.type === 'child' && item.originalIndex === childIndexInParent
            )
            if (childPos === -1) break

            for (let i = childPos + 1; i < parentOrderedItems.length; i++) {
                const item = parentOrderedItems[i]

                if (item.type === 'child') {
                    const result = await get().runGroupWithStopConditions([...currentPath, item.originalIndex])
                    if (result.stopped) return result
                    continue
                }

                const cell = item.item as import('../../types').NotebookCell

                if (cell.type === 'buttonRunNextCells') {
                    get().setStatus('Arrêt : bouton "Exécuter les cellules suivantes" rencontré', 'info')
                    return { stopped: true, reason: 'buttonRunNextCells' }
                }
                if (get().isCellSkippedInAutoFlow(cell)) continue

                if (cell.type === 'source') {
                    if (!cell._fileName || !cell._currentFile || !cell._loaded) {
                        get().setStatus(`Arrêt : la source "${cell.name}" n'a pas de fichier chargé`, 'info')
                        return { stopped: true, reason: 'source_no_file', cellName: cell.name }
                    }
                    if (cell._status === 'error') {
                        get().setStatus(`Arrêt : la source "${cell.name}" a une erreur de chargement`, 'info')
                        return { stopped: true, reason: 'source_error', cellName: cell.name }
                    }
                    continue
                }

                try {
                    cell._status = 'running'
                    await get().runCellAt(currentPath, item.originalIndex)
                    if (cell._status === 'error') {
                        get().setStatus(`Arrêt : erreur lors de l'exécution d'une cellule`, 'error')
                        return { stopped: true, reason: 'cell_error' }
                    }
                } catch (error) {
                    cell._status = 'error'
                    get().setStatus(`Arrêt : erreur - ${error.message}`, 'error')
                    return { stopped: true, reason: 'execution_error', error: error.message }
                }
            }
        }

        if (currentPath.length === 1) {
            const rootGroupIndex = currentPath[0]
            const result = await get().runGroupsFromIndexWithStopConditions(rootGroupIndex + 1)
            if (result.stopped) return result
        }

        return { stopped: false }
    },

    async runCellsAfter(path, cellIndex) {
        set({ isLoading: true })
        get().setStatus('Exécution des cellules suivantes...', 'loading')

        try {
            const group = get().getGroupAtPath(path)
            if (!group) return

            const orderedItems = get().getAllItemsSorted(group)
            const startIndex = orderedItems.findIndex(
                item => item.type === 'cell' && item.originalIndex === cellIndex
            )
            if (startIndex === -1) return

            for (let i = startIndex + 1; i < orderedItems.length; i++) {
                const item = orderedItems[i]
                if (item.type === 'child') {
                    await get().runGroupAtPath([...path, item.originalIndex])
                    continue
                }
                const cell = item.item as import('../../types').NotebookCell
                if (cell?.type === 'buttonRunNextCells') break
                if (get().isCellSkippedInAutoFlow(cell)) continue
                await get().runCellAt(path, item.originalIndex)
            }

            if (path.length === 1) {
                const rootGroupIndex = path[0]
                await get().runGroupsFromIndex(rootGroupIndex + 1)
            }

            get().setStatus('Exécution terminée', 'success')
        } catch (error) {
            get().setStatus('Erreur: ' + error.message, 'error')
        } finally {
            set({ isLoading: false })
        }
    },

    }
}
