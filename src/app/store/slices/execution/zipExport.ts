import {DuckDBManager} from '../../../../lib/DuckDBManager'
import {CDNManager} from '../../../../lib/CDNManager'
import type {StoreApi} from 'zustand'
import type {NotebookStoreState} from '../../types'

export function createZipExport(
    set: StoreApi<NotebookStoreState>['setState'],
    get: StoreApi<NotebookStoreState>['getState'],
) {
    return {
    addFileToZip(filename, content, type = 'blob') {
        if (get()._zipMode) {
            get()._zipFiles.push({ filename, content, type })
            return true
        }
        return false
    },

    downloadOrZipFile(filename, content, mimeType = 'application/octet-stream') {
        if (get()._zipMode) {
            get()._zipFiles.push({ filename, content, type: 'blob' })
            return true
        }
        const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        return false
    },

    async generateAndDownloadZip(group) {
        get().setStatus('Génération du fichier ZIP...', 'loading')

        try {
            let zipFilename = 'export.zip'
            if (group.loop.zipQuery) {
                const parsedZipQuery = get().parseQueryWithParameters(group.loop.zipQuery)
                const zipResults = await DuckDBManager.executeQuery(parsedZipQuery)
                if (zipResults && zipResults.length > 0) {
                    const firstValue = Object.values(zipResults[0])[0]
                    if (firstValue) {
                        zipFilename = String(firstValue)
                        if (!zipFilename.toLowerCase().endsWith('.zip')) {
                            zipFilename += '.zip'
                        }
                    }
                }
            }

            await CDNManager.loadPizZip()
            const zip = new PizZip()

            for (const file of get()._zipFiles) {
                if (file.content instanceof Blob) {
                    const arrayBuffer = await file.content.arrayBuffer()
                    zip.file(file.filename, arrayBuffer)
                } else if (file.content instanceof ArrayBuffer) {
                    zip.file(file.filename, file.content)
                } else if (typeof file.content === 'string') {
                    zip.file(file.filename, file.content)
                } else {
                    zip.file(file.filename, file.content)
                }
            }

            const zipBlob = zip.generate({ type: 'blob' })
            const url = URL.createObjectURL(zipBlob)
            const a = document.createElement('a')
            a.href = url
            a.download = zipFilename
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)

            get().setStatus(`ZIP généré: ${zipFilename} (${get()._zipFiles.length} fichiers)`, 'success')
        } catch (error) {
            console.error('Erreur lors de la génération du ZIP:', error)
            throw new Error('Erreur ZIP: ' + error.message)
        }
    },

    }
}
