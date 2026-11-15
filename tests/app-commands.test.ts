import {describe, expect, it, vi} from 'vitest'
import {CommandRegistry, type CommandContext} from '../src/core/commands'
import {appCommands, registerAppCommands} from '../src/core/appCommands'

interface TestContext extends CommandContext {
    undo: ReturnType<typeof vi.fn>
}

function makeContext(overrides: Partial<CommandContext['project']> = {}): TestContext {
    const stack: unknown[] = []
    const ctx = {
        project: {
            runAll: vi.fn(async () => {}),
            runGroup: vi.fn(async () => {}),
            runCell: vi.fn(async () => {}),
            addPage: vi.fn(),
            setActivePage: vi.fn(),
            addGroup: vi.fn(),
            deleteGroup: vi.fn(async () => {}),
            addCell: vi.fn(),
            deleteCell: vi.fn(async () => {}),
            exportConfig: vi.fn(async () => {}),
            openGistUrl: vi.fn(),
            resetDatabase: vi.fn(async () => {}),
            snapshot: vi.fn(() => ({pages: ['copie']})),
            restore: vi.fn(),
            ...overrides,
        },
        duckdb: {query: vi.fn(async () => [])},
        ui: {notify: vi.fn()},
        history: {
            record: vi.fn((entry: {snapshot: unknown}) => stack.push(entry.snapshot)),
            undo: vi.fn(async () => {
                const last = stack.pop()
                if (last === undefined) return false
                return true
            }),
            canUndo: () => stack.length > 0,
            size: () => stack.length,
        },
    }
    return {...ctx, undo: ctx.history.undo as unknown as ReturnType<typeof vi.fn>}
}

function registry(): CommandRegistry {
    const r = new CommandRegistry()
    registerAppCommands(r)
    return r
}

describe('commandes noyau', () => {
    it('enregistre chaque commande une seule fois (idempotent)', () => {
        const r = new CommandRegistry()
        registerAppCommands(r)
        registerAppCommands(r)
        expect(r.list()).toHaveLength(appCommands.length)
    })

    it('expose au moins douze commandes documentées', () => {
        const ids = registry().list().map(c => c.id)
        expect(ids.length).toBeGreaterThanOrEqual(12)
        for (const id of ['notebook.runAll', 'notebook.runCell', 'cell.add', 'cell.delete',
            'group.add', 'group.delete', 'page.add', 'page.setActive', 'history.undo',
            'export.config', 'db.reset', 'db.query']) {
            expect(ids).toContain(id)
        }
    })

    it('notebook.runAll délègue au projet et notifie', async () => {
        const ctx = makeContext()
        await registry().execute('notebook.runAll', undefined, ctx)
        expect(ctx.project.runAll).toHaveBeenCalledOnce()
        expect(ctx.ui.notify).toHaveBeenCalledWith('Notebook exécuté', 'success')
    })

    it('notebook.runCell valide l’index de cellule', async () => {
        const ctx = makeContext()
        await registry().execute('notebook.runCell', {path: [0], cellIndex: 2}, ctx)
        expect(ctx.project.runCell).toHaveBeenCalledWith([0], 2)

        await expect(registry().execute('notebook.runCell', {path: [0], cellIndex: -1}, ctx))
            .rejects.toThrow(/Paramètres invalides/)
    })

    it('notebook.runGroup refuse un chemin vide', async () => {
        const ctx = makeContext()
        await expect(registry().execute('notebook.runGroup', {path: []}, ctx))
            .rejects.toThrow(/Paramètres invalides/)
        await registry().execute('notebook.runGroup', {path: [1, 2]}, ctx)
        expect(ctx.project.runGroup).toHaveBeenCalledWith([1, 2])
    })

    it('export.config valide le format', async () => {
        const ctx = makeContext()
        await registry().execute('export.config', {format: 'json'}, ctx)
        expect(ctx.project.exportConfig).toHaveBeenCalledWith('json')

        await expect(registry().execute('export.config', {format: 'docx'}, ctx))
            .rejects.toThrow(/Paramètres invalides/)
        expect(ctx.project.exportConfig).toHaveBeenCalledTimes(1)
    })

    it('db.reset réinitialise la base', async () => {
        const ctx = makeContext()
        await registry().execute('db.reset', undefined, ctx)
        expect(ctx.project.resetDatabase).toHaveBeenCalledOnce()
    })

    it('db.query exige un SQL non vide', async () => {
        const ctx = makeContext()
        await expect(registry().execute('db.query', {sql: ''}, ctx)).rejects.toThrow(/Paramètres invalides/)
        await registry().execute('db.query', {sql: 'SELECT 1'}, ctx)
        expect(ctx.duckdb.query).toHaveBeenCalledWith('SELECT 1')
    })

    it('déclare des permissions cohérentes', () => {
        const byId = Object.fromEntries(appCommands.map(c => [c.id, c.permission]))
        expect(byId['notebook.runAll']).toBe('write')
        expect(byId['db.query']).toBe('read')
        expect(byId['export.config']).toBe('external')
        expect(byId['project.openGist']).toBe('external')
        expect(byId['page.setActive']).toBe('read')
        expect(byId['db.reset']).toBe('write')
    })
})

describe('annulation', () => {
    it('enregistre un instantané avant une commande annulable', async () => {
        const ctx = makeContext()
        await registry().execute('cell.add', {path: [0], cellType: 'sql'}, ctx)

        expect(ctx.project.snapshot).toHaveBeenCalledOnce()
        expect(ctx.history.record).toHaveBeenCalledWith({id: 'cell.add', snapshot: {pages: ['copie']}})
        expect(ctx.project.addCell).toHaveBeenCalledWith([0], 'sql')
    })

    it('n’enregistre rien pour une commande non annulable', async () => {
        const ctx = makeContext()
        await registry().execute('notebook.runAll', undefined, ctx)
        expect(ctx.project.snapshot).not.toHaveBeenCalled()
        expect(ctx.history.record).not.toHaveBeenCalled()
    })

    it('history.undo restaure le dernier instantané', async () => {
        const ctx = makeContext()
        const r = registry()
        await r.execute('page.add', undefined, ctx)
        expect(ctx.history.size()).toBe(1)

        await r.execute('history.undo', undefined, ctx)
        expect(ctx.undo).toHaveBeenCalled()
        expect(ctx.history.size()).toBe(0)

        await r.execute('history.undo', undefined, ctx)
        expect(ctx.ui.notify).toHaveBeenLastCalledWith('Rien à annuler', 'info')
    })
})
