/**
 * Commandes noyau de sqljob.
 *
 * Elles ne contiennent aucune logique : elles délèguent au contexte projet,
 * ce qui permet de les tester sans monter l'application et de les exposer
 * telles quelles à l'automatisation (`window.sqljob.commands`).
 */
import {z} from 'zod'
import type {CommandRegistry, SqlJobCommand} from './commands'
import {defineCommand} from './commands'

const FormatSchema = z.enum(['json', 'html', 'base64', 'gist'])
const PathSchema = z.array(z.number().int().min(0))

export const appCommands = [
    defineCommand<void, void>({
        id: 'notebook.runAll',
        label: 'Tout exécuter',
        category: 'query',
        permission: 'write',
        execute: async (_input, ctx) => {
            await ctx.project.runAll()
            ctx.ui.notify('Notebook exécuté', 'success')
        },
    }),

    defineCommand<{path: number[]}, void>({
        id: 'notebook.runGroup',
        label: 'Exécuter un groupe',
        category: 'query',
        permission: 'write',
        params: z.object({path: PathSchema.min(1)}),
        execute: async ({path}, ctx) => {
            await ctx.project.runGroup(path)
        },
    }),

    defineCommand<{path: number[]; cellIndex: number}, void>({
        id: 'notebook.runCell',
        label: 'Exécuter une cellule',
        category: 'query',
        permission: 'write',
        params: z.object({path: PathSchema, cellIndex: z.number().int().min(0)}),
        execute: async ({path, cellIndex}, ctx) => {
            await ctx.project.runCell(path, cellIndex)
        },
    }),

    defineCommand<void, void>({
        id: 'page.add',
        label: 'Ajouter une page',
        category: 'project',
        permission: 'write',
        undoable: true,
        execute: async (_input, ctx) => {
            ctx.project.addPage()
        },
    }),

    defineCommand<{index: number}, void>({
        id: 'page.setActive',
        label: 'Afficher une page',
        category: 'project',
        permission: 'read',
        params: z.object({index: z.number().int().min(0)}),
        execute: async ({index}, ctx) => {
            ctx.project.setActivePage(index)
        },
    }),

    defineCommand<{cellType: string}, void>({
        id: 'group.add',
        label: 'Ajouter un groupe',
        category: 'project',
        permission: 'write',
        undoable: true,
        params: z.object({cellType: z.string().min(1)}),
        execute: async ({cellType}, ctx) => {
            ctx.project.addGroup(cellType)
        },
    }),

    defineCommand<{path: number[]}, void>({
        id: 'group.delete',
        label: 'Supprimer un groupe',
        category: 'project',
        permission: 'write',
        undoable: true,
        params: z.object({path: PathSchema.min(1)}),
        execute: async ({path}, ctx) => {
            await ctx.project.deleteGroup(path)
        },
    }),

    defineCommand<{path: number[]; cellType: string}, void>({
        id: 'cell.add',
        label: 'Ajouter une cellule',
        category: 'project',
        permission: 'write',
        undoable: true,
        params: z.object({path: PathSchema, cellType: z.string().min(1)}),
        execute: async ({path, cellType}, ctx) => {
            ctx.project.addCell(path, cellType)
        },
    }),

    defineCommand<{path: number[]; cellIndex: number}, void>({
        id: 'cell.delete',
        label: 'Supprimer une cellule',
        category: 'project',
        permission: 'write',
        undoable: true,
        params: z.object({path: PathSchema, cellIndex: z.number().int().min(0)}),
        execute: async ({path, cellIndex}, ctx) => {
            await ctx.project.deleteCell(path, cellIndex)
        },
    }),

    defineCommand<void, boolean>({
        id: 'history.undo',
        label: 'Annuler',
        category: 'project',
        permission: 'write',
        execute: async (_input, ctx) => {
            const undone = await ctx.history.undo()
            ctx.ui.notify(undone ? 'Action annulée' : 'Rien à annuler', undone ? 'success' : 'info')
            return undone
        },
    }),

    defineCommand<{format: 'json' | 'html' | 'base64' | 'gist'}, void>({
        id: 'export.config',
        label: 'Exporter la configuration',
        category: 'export',
        permission: 'external',
        params: z.object({format: FormatSchema}),
        execute: async ({format}, ctx) => {
            await ctx.project.exportConfig(format)
        },
    }),

    // Alias scriptables des formats les plus utilisés (`sqljob.run('export.html')`).
    defineCommand<void, void>({
        id: 'export.html',
        label: 'Exporter en HTML',
        category: 'export',
        permission: 'external',
        execute: async (_input, ctx) => {
            await ctx.project.exportConfig('html')
        },
    }),

    defineCommand<void, void>({
        id: 'export.json',
        label: 'Exporter en JSON',
        category: 'export',
        permission: 'external',
        execute: async (_input, ctx) => {
            await ctx.project.exportConfig('json')
        },
    }),

    defineCommand<void, void>({
        id: 'gist.save',
        label: 'Enregistrer dans un Gist',
        category: 'export',
        permission: 'external',
        execute: async (_input, ctx) => {
            await ctx.project.exportConfig('gist')
        },
    }),

    defineCommand<void, void>({
        id: 'project.openGist',
        label: 'Ouvrir un Gist',
        category: 'export',
        permission: 'external',
        execute: async (_input, ctx) => {
            ctx.project.openGistUrl()
        },
    }),

    defineCommand<void, void>({
        id: 'db.reset',
        label: 'Réinitialiser la base',
        category: 'data',
        permission: 'write',
        execute: async (_input, ctx) => {
            await ctx.project.resetDatabase()
            ctx.ui.notify('Base réinitialisée', 'success')
        },
    }),

    defineCommand<{sql: string}, unknown>({
        id: 'db.query',
        label: 'Exécuter une requête',
        category: 'query',
        permission: 'read',
        params: z.object({sql: z.string().min(1)}),
        execute: async ({sql}, ctx) => ctx.duckdb.query(sql),
    }),
] as ReadonlyArray<SqlJobCommand<any, any>>

/** Enregistre les commandes noyau une seule fois par registre. */
export function registerAppCommands(registry: CommandRegistry): void {
    for (const command of appCommands) {
        if (!registry.has(command.id)) {
            registry.register(command)
        }
    }
}
