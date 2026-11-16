import {DuckDBManager} from '../../../../lib/DuckDBManager'
import {ConfigManager} from '../../../../lib/ConfigManager'
import {CDNManager} from '../../../../lib/CDNManager'
import {FileHandler} from '../../../../lib/FileHandler'
import type {StoreApi} from 'zustand'
import type {NotebookStoreState} from '../../types'

export function createDocuments(
    set: StoreApi<NotebookStoreState>['setState'],
    get: StoreApi<NotebookStoreState>['getState'],
) {
    return {
    async executePublipostageWordCell(cell) {
        await CDNManager.loadDocxtemplater()

        if (!cell.docxTemplateBase64) {
            console.error('❌ No template loaded')
            throw new Error('Aucun template Word chargé')
        }

        if (!ConfigManager.getCellQuery(cell, 0)?.trim()) {
            console.error('❌ No data query')
            throw new Error('Requête de données manquante')
        }

        if (!ConfigManager.getCellQuery(cell, 1)?.trim()) {
            console.error('❌ No filename query')
            throw new Error('Requête de nom de fichier manquante')
        }

        get().setStatus('Exécution du publipostage Word...', 'loading')

        try {
            const finalQuery = get().parseQueryWithParameters(ConfigManager.getCellQuery(cell, 0) || '', { _name: cell.name || '' })

            get().setStatus('Récupération des données...', 'loading')
            const dataResults = await DuckDBManager.executeQuery(finalQuery)

            if (!dataResults || dataResults.length === 0) {
                cell._resultInfo = 'Aucune donnée à traiter'
                return
            }

            const finalQuery2 = get().parseQueryWithParameters(ConfigManager.getCellQuery(cell, 1) || '', { _name: cell.name || '' })

            get().setStatus('Récupération des noms de fichiers...', 'loading')
            const filenameResults = await DuckDBManager.executeQuery(finalQuery2)

            if (!filenameResults || filenameResults.length === 0) {
                throw new Error('La requête de nom de fichier n\'a retourné aucun résultat')
            }

            if (dataResults.length !== filenameResults.length) {
                throw new Error(`Nombre de lignes différent: ${dataResults.length} données vs ${filenameResults.length} noms de fichiers`)
            }

            const templateArrayBuffer = FileHandler.base64ToUint8Array(cell.docxTemplateBase64).buffer

            get().setStatus('Génération des documents Word...', 'loading')
            let generatedCount = 0

            for (let i = 0; i < dataResults.length; i++) {
                const rowData = dataResults[i]
                const filenameRow = filenameResults[i]
                const filename = String(Object.values(filenameRow)[0] || `document_${i + 1}.docx`)

                let templateData = rowData

                const keys = Object.keys(rowData)
                if (keys.length === 1) {
                    const value = rowData[keys[0]]
                    if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
                        try {
                            templateData = JSON.parse(value)
                        } catch (e) {
                            console.warn('⚠️ Failed to parse JSON, using raw data:', e)
                        }
                    }
                }

                const zip = new PizZip(templateArrayBuffer)
                const doc = new window.docxtemplater(zip, {
                    paragraphLoop: true,
                    linebreaks: true,
                })

                doc.render(templateData)

                const blob = doc.getZip().generate({
                    type: 'blob',
                    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                })

                get().downloadOrZipFile(filename, blob, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
                generatedCount++

                get().setStatus(`Génération ${generatedCount}/${dataResults.length}...`, 'loading')
            }

            cell._resultInfo = `✅ ${generatedCount} document(s) généré(s)`
            get().setStatus(`${generatedCount} documents générés`, 'success')
        } catch (error) {
            throw error
        }
    },

    async executePdfmeCell(cell) {
        get().setStatus('Chargement de pdfme...', 'loading')
        let pdfme
        try {
            pdfme = await CDNManager.loadPdfme()
        } catch (loadErr) {
            console.error('[pdfme] ERREUR chargement du module:', loadErr)
            throw loadErr
        }

        if (!ConfigManager.getCellQuery(cell, 0)?.trim()) {
            console.error('[pdfme] Requête SQL manquante')
            throw new Error('Requête SQL manquante')
        }

        const pdfmeTemplate = typeof cell.json === 'string' ? cell.json : (cell.json ? JSON.stringify(cell.json) : null)
        if (!pdfmeTemplate?.trim()) {
            console.error('[pdfme] Template pdfme manquant')
            throw new Error('Template pdfme manquant')
        }

        get().setStatus('Exécution de la requête SQL...', 'loading')

        try {
            const finalQuery = get().parseQueryWithParameters(ConfigManager.getCellQuery(cell, 0) || '', { _name: cell.name || '' })

            get().setStatus('Récupération des données...', 'loading')
            const data = await DuckDBManager.executeQuery(finalQuery)

            if (!data || data.length === 0) {
                console.warn('[pdfme] Aucune donnée retournée par la requête')
                cell._resultInfo = 'Aucune donnée à exporter'
                return
            }

            let pdfFileName = 'export.pdf'
            if (ConfigManager.getCellQuery(cell, 1)?.trim()) {
                get().setStatus('Récupération du nom de fichier...', 'loading')

                const finalQuery2 = get().parseQueryWithParameters(ConfigManager.getCellQuery(cell, 1) || '', { _name: cell.name || '' })
                const filenameResults = await DuckDBManager.executeQuery(finalQuery2)

                if (filenameResults && filenameResults.length > 0) {
                    const filenameValue = Object.values(filenameResults[0])[0]
                    if (filenameValue) {
                        pdfFileName = String(filenameValue)
                    }
                }
            }

            get().setStatus('Génération du PDF (pdfme)...', 'loading')

            let template
            try {
                template = JSON.parse(pdfmeTemplate)
            } catch (parseErr) {
                console.error('[pdfme] ERREUR parsing template JSON:', parseErr)
                throw new Error('Template JSON invalide: ' + parseErr.message)
            }

            let pluginsConfig
            try {
                pluginsConfig = JSON.parse('{"Text": "text", "Table": "table"}')
            } catch (parseErr) {
                console.error('[pdfme] ERREUR parsing plugins JSON:', parseErr)
                throw new Error('Plugins JSON invalide: ' + parseErr.message)
            }

            const plugins = {}
            for (const [name, path] of Object.entries(pluginsConfig)) {
                const parts = String(path).split('.')
                let obj = pdfme.schemas
                for (const part of parts) {
                    if (obj && obj[part] !== undefined) {
                        obj = obj[part]
                    } else {
                        console.error(`[pdfme] Plugin introuvable: "${path}" partie "${part}"`, 'Clés disponibles:', obj ? Object.keys(obj) : 'obj est null/undefined')
                        throw new Error(`Plugin introuvable: "${path}" (partie "${part}" non trouvée dans @pdfme/schemas). Clés disponibles: ${obj ? Object.keys(obj).join(', ') : 'aucune'}`)
                    }
                }
                plugins[name] = obj
            }

            const fieldNames = new Set()
            if (template.schemas && Array.isArray(template.schemas)) {
                template.schemas.forEach(pageSchemas => {
                    if (Array.isArray(pageSchemas)) {
                        pageSchemas.forEach(s => {
                            if (s.name) fieldNames.add(s.name)
                        })
                    }
                })
            }

            const inputs = data.map((row, i) => {
                const input = {}

                template.schemas.forEach(pageSchemas => {
                    pageSchemas.forEach(s => {
                        if (s.name) {
                            let val = s.content || ''
                            try {
                                const parsed = JSON.parse(val)
                                input[s.name] = (Array.isArray(parsed) || typeof parsed === 'object') ? parsed : String(val)
                            } catch {
                                input[s.name] = String(val)
                            }
                        }
                    })
                })

                for (const [key, value] of Object.entries(row)) {
                    if (typeof value === 'string') {
                        try {
                            const parsed = JSON.parse(value)
                            if (Array.isArray(parsed) || typeof parsed === 'object') {
                                input[key] = parsed
                            } else {
                                input[key] = String(value)
                            }
                        } catch {
                            input[key] = String(value)
                        }
                    } else {
                        input[key] = String(value ?? '')
                    }
                }
                return input
            })

            if (!inputs || !Array.isArray(inputs) || inputs.length === 0) {
                console.warn('[pdfme] Aucun input généré par le mapping')
                cell._resultInfo = 'Aucun input généré par le mapping'
                return
            }

            let pdf
            try {
                pdf = await pdfme.generator.generate({ template, inputs, plugins })
            } catch (genErr) {
                console.error('[pdfme] ERREUR generate():', genErr)
                console.error('[pdfme] generate() stack:', genErr.stack)
                throw genErr
            }

            const pdfBlob = new Blob([pdf], { type: 'application/pdf' })

            if (get()._zipMode) {
                get().downloadOrZipFile(pdfFileName, pdfBlob, 'application/pdf')
            } else {
                const url = URL.createObjectURL(pdfBlob)
                const a = document.createElement('a')
                a.href = url
                a.download = pdfFileName
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                URL.revokeObjectURL(url)
            }

            cell._resultInfo = `✅ PDF généré: ${pdfFileName} (${inputs.length} page(s), ${data.length} ligne(s) SQL)`
            get().setStatus('PDF généré avec succès (pdfme)', 'success')
        } catch (error) {
            console.error('[pdfme] === ERREUR executePdfmeCell ===', error)
            console.error('[pdfme] Stack:', error.stack)
            throw error
        }
    },

    }
}
