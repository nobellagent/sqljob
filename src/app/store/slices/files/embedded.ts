import type { StoreApi } from 'zustand'
import type { NotebookStoreState } from '../../types'
import { FileHandler } from '../../../../lib/FileHandler'
import { ConfigManager } from '../../../../lib/ConfigManager'

/** Chargement des fichiers embarqués dans la page (extrait). */
export function createEmbeddedFilesActions(
    set: StoreApi<NotebookStoreState>['setState'],
    get: StoreApi<NotebookStoreState>['getState'],
) {
    return {
        async loadEmbeddedFiles() {
            const sourceFileScripts = document.querySelectorAll<HTMLElement>('script[id^="sourceFile_"]')
            const docxTemplateScripts = document.querySelectorAll<HTMLElement>('script[id^="docxTemplate_"]')

            if (sourceFileScripts.length === 0 && docxTemplateScripts.length === 0) return

            console.info('📂 ' + (sourceFileScripts.length + docxTemplateScripts.length) + ' fichier(s) embarqué(s) trouvé(s)')

            const findSourceInAllPages = (sourceName: string) => {
                const pages = get().pages
                for (let pi = 0; pi < pages.length; pi++) {
                    const page = pages[pi]
                    const found = findSourceRecursive(page.groups, sourceName, [])
                    if (found) return { ...found, pageIndex: pi }
                }
                return null
            }

            const findSourceRecursive = (groups: any[], sourceName: string, currentPath: number[]) => {
                for (let gi = 0; gi < groups.length; gi++) {
                    const group = groups[gi]
                    const groupPath = [...currentPath, gi]
                    for (let ci = 0; ci < (group.cells || []).length; ci++) {
                        const cell = group.cells[ci]
                        if (cell.type === 'source' && cell.name === sourceName) {
                            return { path: groupPath, cellIndex: ci, source: cell }
                        }
                    }
                    if (group.children && group.children.length > 0) {
                        const found = findSourceRecursive(group.children, sourceName, groupPath)
                        if (found) return found
                    }
                }
                return null
            }

            const findCellByPath = (groups: any[], targetPath: number[]) => {
                try {
                    let current = groups
                    let group = null
                    for (let i = 0; i < targetPath.length - 1; i++) {
                        const index = targetPath[i]
                        if (index === -1) {
                            current = get().getLinkGroups()
                            continue
                        }
                        if (!current[index]) return null
                        group = current[index]
                        current = group.children || []
                    }
                    const cellIndex = targetPath[targetPath.length - 1]
                    const finalGroup = targetPath.length === 1 ? current[targetPath[0]] : group
                    if (!finalGroup || !finalGroup.cells || !finalGroup.cells[cellIndex]) return null
                    return { cell: finalGroup.cells[cellIndex], cellIndex }
                } catch (e) {
                    console.error('Error finding cell by path:', e)
                    return null
                }
            }

            for (const script of sourceFileScripts) {
                const sourceName = script.dataset.sourceName
                const fileName = script.dataset.fileName
                const base64 = script.textContent.trim()
                if (!sourceName || !fileName || !base64) { console.warn('Script source incomplet:', script.id); continue }
                const found = findSourceInAllPages(sourceName)
                if (!found) { console.warn(`Source "${sourceName}" non trouvée dans les cellules`); continue }

                const originalPageIndex = get().activePageIndex
                set({ activePageIndex: found.pageIndex })
                try {
                    get().setStatus(`Chargement de ${sourceName}...`, 'loading')
                    const bytes = FileHandler.base64ToUint8Array(base64)
                    const decompressedBuffer = await FileHandler.decompressGzip(bytes)
                    const blob = new Blob([decompressedBuffer])
                    const file = new File([blob], fileName, { type: FileHandler.getMimeTypeFromFileName(fileName) })
                    await get().loadSingleSourceFile(file, found.path, found.cellIndex, { skipRunNextCells: true })
                } catch (error: any) {
                    console.error(`Erreur chargement fichier embarqué ${sourceName}:`, error)
                    get().setStatus(`Erreur: ${error.message}`, 'error')
                } finally {
                    set({ activePageIndex: originalPageIndex })
                }
            }

            for (const script of docxTemplateScripts) {
                const cellPath = script.dataset.cellPath
                const fileName = script.dataset.fileName
                let base64 = script.textContent.trim()
                if (!cellPath || !fileName || !base64) { console.warn('Script docx template incomplet:', script.id); continue }

                if (script.dataset.compressed === 'true') {
                    try {
                        const bytes = FileHandler.base64ToUint8Array(base64)
                        const decompressed = await FileHandler.decompressGzip(bytes)
                        base64 = FileHandler.arrayBufferToBase64(decompressed)
                    } catch (e) { console.error('Décompression template docx échouée:', e); continue }
                }

                const pathArray = cellPath.split('_').map((n: string) => parseInt(n, 10))
                const found = findCellByPath(get().getGroups(), pathArray)
                if (!found) { console.warn(`Cellule publipostageWord au chemin "${cellPath}" non trouvée`); continue }
                if (found.cell.type !== 'publipostageWord') { console.warn(`La cellule au chemin "${cellPath}" n'est pas de type publipostageWord`); continue }

                try {
                    ConfigManager.setCellFileData(found.cell, { base64, fileName })
                } catch (error: any) {
                    console.error(`Erreur chargement template docx ${cellPath}:`, error)
                }
            }

            get().setStatus('Fichiers embarqués chargés', 'success')
        },

    }
}
