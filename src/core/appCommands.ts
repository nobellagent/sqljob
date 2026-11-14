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

export const appCommands = [
    defineCommand<void, void>({
        id: 'notebook.runAll',
        label: 'Tout exécuter',
        category: 'query',
        permission: 'write',
        undoable: false,
        execute: async (_input, ctx) => {
            await ctx.project.runAll()
            ctx.ui.notify('Notebook exécuté', 'success')
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

    defineCommand<void, void>({
        id: 'db.reset',
        label: 'Réinitialiser la base',
        category: 'data',
        permission: 'write',
        undoable: false,
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
