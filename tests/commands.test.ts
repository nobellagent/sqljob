import {describe, expect, it, vi} from 'vitest'
import {z} from 'zod'
import {
    CommandAlreadyRegisteredError,
    CommandNotFoundError,
    CommandRegistry,
    CommandValidationError,
    defineCommand,
    type CommandContext,
} from '../src/core/commands'

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

const readCommand = defineCommand({
    id: 'db.ping',
    label: 'Ping',
    category: 'data',
    permission: 'read',
    execute: async (_input: unknown, ctx) => {
        await ctx.duckdb.query('SELECT 1')
        return 'pong'
    },
})

describe('CommandRegistry', () => {
    it('enregistre et exécute une commande', async () => {
        const registry = new CommandRegistry()
        registry.register(readCommand)
        const ctx = makeContext()
        await expect(registry.execute('db.ping', undefined, ctx)).resolves.toBe('pong')
        expect(ctx.duckdb.query).toHaveBeenCalledWith('SELECT 1')
    })

    it('refuse un identifiant mal formé', () => {
        const registry = new CommandRegistry()
        expect(() => registry.register({...readCommand, id: 'ping'})).toThrow(/invalide/)
    })

    it('refuse un doublon', () => {
        const registry = new CommandRegistry()
        registry.register(readCommand)
        expect(() => registry.register(readCommand)).toThrow(CommandAlreadyRegisteredError)
    })

    it('lève une erreur explicite sur commande inconnue', async () => {
        const registry = new CommandRegistry()
        await expect(registry.execute('db.nope', undefined, makeContext())).rejects.toBeInstanceOf(CommandNotFoundError)
    })

    it('valide les paramètres avant exécution', async () => {
        const registry = new CommandRegistry()
        const run = vi.fn(async () => 'ok')
        registry.register({
            id: 'notebook.runCell',
            label: 'Exécuter une cellule',
            category: 'query',
            permission: 'write',
            params: z.object({cellId: z.string().min(1)}),
            execute: run,
        })

        await expect(registry.execute('notebook.runCell', {cellId: ''}, makeContext())).rejects.toBeInstanceOf(CommandValidationError)
        expect(run).not.toHaveBeenCalled()

        await expect(registry.execute('notebook.runCell', {cellId: 'c1'}, makeContext())).resolves.toBe('ok')
        expect(run).toHaveBeenCalledWith({cellId: 'c1'}, expect.anything())
    })

    it('transmet les paramètres parsés (valeurs par défaut appliquées)', async () => {
        const registry = new CommandRegistry()
        const run = vi.fn(async (input: {limit: number}) => input.limit)
        registry.register({
            id: 'db.sample',
            label: 'Échantillon',
            category: 'data',
            permission: 'read',
            params: z.object({limit: z.number().default(10)}),
            execute: run,
        })

        await expect(registry.execute('db.sample', {}, makeContext())).resolves.toBe(10)
    })

    it('liste et filtre par catégorie', () => {
        const registry = new CommandRegistry()
        registry.register(readCommand)
        registry.register({
            id: 'export.json',
            label: 'Export JSON',
            category: 'export',
            permission: 'external',
            execute: async () => undefined,
        })
        expect(registry.list()).toHaveLength(2)
        expect(registry.listByCategory('export').map(c => c.id)).toEqual(['export.json'])
        expect(registry.has('db.ping')).toBe(true)
        expect(registry.has('db.nope')).toBe(false)
    })

    it('expose les métadonnées de permission et d’annulation', () => {
        const registry = new CommandRegistry()
        registry.register({...readCommand, id: 'project.deletePage', permission: 'write', undoable: true})
        const command = registry.get('project.deletePage')
        expect(command.permission).toBe('write')
        expect(command.undoable).toBe(true)
    })
})
