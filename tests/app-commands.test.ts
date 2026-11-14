import {describe, expect, it, vi} from 'vitest'
import {CommandRegistry, type CommandContext} from '../src/core/commands'
import {appCommands, registerAppCommands} from '../src/core/appCommands'

function makeContext(): CommandContext {
    return {
        project: {
            runAll: vi.fn(async () => {}),
            exportConfig: vi.fn(async () => {}),
            resetDatabase: vi.fn(async () => {}),
        },
        duckdb: {query: vi.fn(async () => [])},
        ui: {notify: vi.fn()},
    }
}

describe('commandes noyau', () => {
    it('enregistre les commandes une seule fois (idempotent)', () => {
        const registry = new CommandRegistry()
        registerAppCommands(registry)
        registerAppCommands(registry)
        expect(registry.list()).toHaveLength(appCommands.length)
    })

    it('notebook.runAll délègue au projet et notifie', async () => {
        const registry = new CommandRegistry()
        registerAppCommands(registry)
        const ctx = makeContext()

        await registry.execute('notebook.runAll', undefined, ctx)

        expect(ctx.project.runAll).toHaveBeenCalledOnce()
        expect(ctx.ui.notify).toHaveBeenCalledWith('Notebook exécuté', 'success')
    })

    it('export.config valide le format', async () => {
        const registry = new CommandRegistry()
        registerAppCommands(registry)
        const ctx = makeContext()

        await registry.execute('export.config', {format: 'json'}, ctx)
        expect(ctx.project.exportConfig).toHaveBeenCalledWith('json')

        await expect(registry.execute('export.config', {format: 'docx'}, ctx)).rejects.toThrow(/Paramètres invalides/)
        expect(ctx.project.exportConfig).toHaveBeenCalledTimes(1)
    })

    it('db.reset réinitialise la base', async () => {
        const registry = new CommandRegistry()
        registerAppCommands(registry)
        const ctx = makeContext()

        await registry.execute('db.reset', undefined, ctx)

        expect(ctx.project.resetDatabase).toHaveBeenCalledOnce()
    })

    it('db.query exige un SQL non vide', async () => {
        const registry = new CommandRegistry()
        registerAppCommands(registry)
        const ctx = makeContext()

        await expect(registry.execute('db.query', {sql: ''}, ctx)).rejects.toThrow(/Paramètres invalides/)
        await registry.execute('db.query', {sql: 'SELECT 1'}, ctx)
        expect(ctx.duckdb.query).toHaveBeenCalledWith('SELECT 1')
    })

    it('déclare des permissions cohérentes', () => {
        const byId = Object.fromEntries(appCommands.map(c => [c.id, c.permission]))
        expect(byId['notebook.runAll']).toBe('write')
        expect(byId['db.query']).toBe('read')
        expect(byId['export.config']).toBe('external')
        expect(byId['db.reset']).toBe('write')
    })
})
