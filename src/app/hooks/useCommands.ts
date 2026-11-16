import {useEffect, useMemo} from 'react'
import {commandRegistry, executeCommand, setCommandContext} from '../../core/commands'
import type {CommandContext, CommandHistory} from '../../core/commands'
import {registerAppCommands} from '../../core/appCommands'
import {useNotebookStore} from '../store/notebookStore'
import type {NotebookPage} from '../store/types'
import {sanitizeForStorage} from '../store/serializeProject'
import {DuckDBManager} from '../../lib/DuckDBManager'

const UNDO_LIMIT = 25

/** Copie profonde stockable : les cellules portent des refs DOM non clonables. */
function clonePages(pages: NotebookPage[]): NotebookPage[] {
    return sanitizeForStorage(pages) as NotebookPage[]
}

/**
 * Pile d'annulation du document. Elle vit dans l'hôte, pas dans le registre :
 * le registre ne manipule que des instantanés opaques.
 */
function createHistory(restore: (snapshot: unknown) => void): CommandHistory {
    const stack: Array<{id: string; snapshot: unknown}> = []
    return {
        record(entry) {
            stack.push(entry)
            if (stack.length > UNDO_LIMIT) stack.shift()
        },
        async undo() {
            const entry = stack.pop()
            if (!entry) return false
            restore(entry.snapshot)
            return true
        },
        canUndo: () => stack.length > 0,
        size: () => stack.length,
    }
}

/** Attend que DuckDB soit prêt (les commandes `db.*` peuvent arriver par URL). */
async function waitForDuckDb(timeoutMs = 20_000): Promise<void> {
    const started = Date.now()
    while (!DuckDBManager.getConnection()) {
        if (Date.now() - started > timeoutMs) {
            throw new Error('DuckDB non initialisé après 20 s')
        }
        await new Promise(resolve => setTimeout(resolve, 250))
    }
}

/**
 * Exécute `#cmd=<id>` ou `#cmd=<id>&input=<json>` au démarrage.
 * Retourne true si une commande a été lancée.
 */
async function runCommandFromHash(): Promise<boolean> {
    const hash = window.location.hash.replace(/^#/, '')
    if (!hash.startsWith('cmd=')) return false
    const params = new URLSearchParams(hash)
    const id = params.get('cmd')
    if (!id) return false

    const rawInput = params.get('input')
    let input: unknown
    if (rawInput) {
        try {
            input = JSON.parse(rawInput)
        } catch {
            throw new Error(`#cmd : input n'est pas du JSON valide (${rawInput.slice(0, 60)})`)
        }
    }
    if (id.startsWith('db.')) {
        await waitForDuckDb()
    }
    await executeCommand(id, input)
    // La commande ne doit pas se relancer sur un simple rechargement.
    history.replaceState(null, '', window.location.pathname + window.location.search)
    return true
}

/**
 * Branche le Command Registry sur l'application :
 * - enregistre les commandes noyau ;
 * - expose `window.sqljob.commands.execute(id, input)` (seul global légitime) ;
 * - fournit le contexte étroit (projet / db / ui / historique) aux commandes.
 */
export function useCommands(): void {
    const context = useMemo<CommandContext>(() => {
        const store = () => useNotebookStore.getState()

        const history = createHistory(snapshot => {
            store().setPages(snapshot as NotebookPage[])
        })

        return {
            project: {
                runAll: async () => {
                    await store().runAllGroups()
                },
                runGroup: async path => {
                    await store().runGroup(path)
                },
                runCell: async (path, cellIndex) => {
                    await store().runCellAt(path, cellIndex)
                },
                addPage: () => {
                    store().addPage()
                },
                setActivePage: index => {
                    store().setActivePageIndex(index)
                },
                addGroup: cellType => {
                    store().addGroup(cellType)
                },
                deleteGroup: async path => {
                    store().deleteGroup(path)
                },
                addCell: (path, cellType) => {
                    store().addCellToGroup(path, cellType)
                },
                deleteCell: async (path, cellIndex) => {
                    await store().deleteCellAt(path, cellIndex)
                },
                exportConfig: async format => {
                    // Les formats fichier passent par la modale d'export existante :
                    // elle gère le nom de fichier, les options et le téléchargement.
                    store().openExportModal(format)
                },
                openGistUrl: () => {
                    store().openGistUrl()
                },
                resetDatabase: async () => {
                    await DuckDBManager.destroy((message, kind) => {
                        store().setStatus(message, kind)
                    })
                    await DuckDBManager.initDuckDB(undefined)
                },
                snapshot: () => clonePages(store().pages),
                restore: snapshot => {
                    store().setPages(snapshot as NotebookPage[])
                },
            },
            duckdb: {
                query: sql => DuckDBManager.executeQueryArrow(sql),
            },
            ui: {
                notify: (message, kind = 'info') => {
                    store().setStatus(message, kind === 'error' ? 'error' : kind)
                },
            },
            history,
        }
    }, [])

    useEffect(() => {
        registerAppCommands(commandRegistry)
        setCommandContext(context)

        const api = {
            /** Raccourci scriptable : `sqljob.run('export.html')`. */
            run: (id: string, input?: unknown) => executeCommand(id, input),
            commands: {
                execute: (id: string, input?: unknown) => executeCommand(id, input),
                undo: () => executeCommand<undefined, boolean>('history.undo'),
                list: () => commandRegistry.list().map(c => ({
                    id: c.id,
                    label: c.label,
                    category: c.category,
                    permission: c.permission,
                    undoable: !!c.undoable,
                })),
            },
        }
        ;(window as unknown as {sqljob?: typeof api}).sqljob = api

        runCommandFromHash().catch(err => {
            console.error('[sqljob] #cmd a échoué :', err)
            context.ui.notify(String(err?.message ?? err), 'error')
        })

        return () => setCommandContext(null)
    }, [context])
}
