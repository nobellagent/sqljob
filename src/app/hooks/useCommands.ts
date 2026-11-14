import {useEffect, useMemo} from 'react'
import {commandRegistry, executeCommand, setCommandContext} from '../../core/commands'
import type {CommandContext} from '../../core/commands'
import {registerAppCommands} from '../../core/appCommands'
import {useNotebookStore} from '../store/notebookStore'
import {DuckDBManager} from '../../lib/DuckDBManager'

/**
 * Branche le Command Registry sur l'application :
 * - enregistre les commandes noyau ;
 * - expose `window.sqljob.commands.execute(id, input)` (seul global légitime) ;
 * - fournit le contexte étroit (projet / db / ui) aux commandes.
 */
export function useCommands(): void {
    const runAllGroups = useNotebookStore(s => s.runAllGroups)
    const openExportModal = useNotebookStore(s => s.openExportModal)
    const setStatus = useNotebookStore(s => s.setStatus)

    const context = useMemo<CommandContext>(() => ({
        project: {
            runAll: async () => {
                await runAllGroups()
            },
            exportConfig: async format => {
                if (format === 'gist') {
                    openExportModal('gist')
                    return
                }
                // Les formats fichier passent par la modale d'export existante :
                // elle gère le nom de fichier, les options et le téléchargement.
                openExportModal(format)
            },
            resetDatabase: async () => {
                await DuckDBManager.destroy((message, kind) => {
                    setStatus(message, kind)
                })
                await DuckDBManager.initDuckDB(undefined)
            },
        },
        duckdb: {
            query: sql => DuckDBManager.executeQueryArrow(sql),
        },
        ui: {
            notify: (message, kind = 'info') => setStatus(message, kind === 'error' ? 'error' : kind),
        },
    }), [runAllGroups, openExportModal, setStatus])

    useEffect(() => {
        registerAppCommands(commandRegistry)
        setCommandContext(context)
        const api = {
            commands: {
                execute: (id: string, input?: unknown) => executeCommand(id, input),
                list: () => commandRegistry.list().map(c => ({
                    id: c.id,
                    label: c.label,
                    category: c.category,
                    permission: c.permission,
                })),
            },
        }
        ;(window as unknown as {sqljob?: typeof api}).sqljob = api
        return () => setCommandContext(null)
    }, [context])
}
