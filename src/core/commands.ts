/**
 * Command Registry — point d'entrée unique pour les actions de l'application.
 *
 * Inspiré de RustGIS (« everything is a command ») : les boutons de l'interface,
 * les exports, l'automatisation et — plus tard — les plugins passent tous par
 * le même contrat. Un bouton ne contient plus de logique métier : il appelle
 * `commands.execute(id, input)`.
 *
 * Trois garanties :
 * - les paramètres sont validés par un schéma zod avant exécution ;
 * - chaque commande déclare sa permission (`read` / `write` / `external`) ;
 * - le contexte expose des capacités étroites, jamais le store Zustand brut.
 */
import type {ZodType} from 'zod'

export type CommandCategory = 'query' | 'project' | 'export' | 'data'

/**
 * - `read`     : ne modifie rien (requête, aperçu)
 * - `write`    : modifie le projet (undoable ou non)
 * - `external` : effet hors de l'application (téléchargement, réseau, presse-papier)
 */
type CommandPermission = 'read' | 'write' | 'external'

interface CommandUi {
    notify(message: string, kind?: 'info' | 'success' | 'error'): void
}

/** Capacités projet exposées aux commandes. Volontairement minimales. */
interface CommandProjectAccess {
    runAll(): Promise<void>
    runGroup(path: number[]): Promise<void>
    runCell(path: number[], cellIndex: number): Promise<void>
    addPage(): void
    setActivePage(index: number): void
    addGroup(cellType: string): void
    deleteGroup(path: number[]): Promise<void>
    addCell(path: number[], cellType: string): void
    deleteCell(path: number[], cellIndex: number): Promise<void>
    exportConfig(format: 'json' | 'html' | 'base64' | 'gist'): Promise<void>
    openGistUrl(): void
    resetDatabase(): Promise<void>
    /** Instantané du document avant une commande annulable. */
    snapshot(): unknown
    /** Restaure un instantané produit par `snapshot()`. */
    restore(snapshot: unknown): void
}

/** Pile d'annulation fournie par l'hôte ; le registre ne connaît pas son contenu. */
export interface CommandHistory {
    record(entry: {id: string; snapshot: unknown}): void
    undo(): Promise<boolean>
    canUndo(): boolean
    size(): number
}

interface CommandDuckDb {
    query(sql: string): Promise<unknown>
}

/** Le contexte ne donne accès ni au store Zustand, ni à l'objet DuckDB brut. */
export interface CommandContext {
    project: CommandProjectAccess
    duckdb: CommandDuckDb
    ui: CommandUi
    history: CommandHistory
}

export interface SqlJobCommand<I = unknown, O = unknown> {
    id: string
    label: string
    category: CommandCategory
    permission: CommandPermission
    /** true si l'action peut être annulée par l'utilisateur */
    undoable?: boolean
    /** Validé avant exécution ; l'entrée typée en découle */
    params?: ZodType<I>
    execute(input: I, ctx: CommandContext): Promise<O>
}

export class CommandNotFoundError extends Error {
    constructor(id: string) {
        super(`Commande inconnue : ${id}`)
        this.name = 'CommandNotFoundError'
    }
}

export class CommandAlreadyRegisteredError extends Error {
    constructor(id: string) {
        super(`Commande déjà enregistrée : ${id}`)
        this.name = 'CommandAlreadyRegisteredError'
    }
}

export class CommandValidationError extends Error {
    constructor(id: string, detail: string) {
        super(`Paramètres invalides pour ${id} : ${detail}`)
        this.name = 'CommandValidationError'
    }
}

const ID_PATTERN = /^[a-z][a-zA-Z0-9]*(\.[a-z][a-zA-Z0-9]*)+$/

export class CommandRegistry {
    private readonly commands = new Map<string, SqlJobCommand<never, unknown>>()

    register<I, O>(command: SqlJobCommand<I, O>): void {
        if (!ID_PATTERN.test(command.id)) {
            throw new Error(`Identifiant de commande invalide : ${command.id} (attendu : domaine.action)`)
        }
        if (this.commands.has(command.id)) {
            throw new CommandAlreadyRegisteredError(command.id)
        }
        this.commands.set(command.id, command as unknown as SqlJobCommand<never, unknown>)
    }

    has(id: string): boolean {
        return this.commands.has(id)
    }

    get(id: string): SqlJobCommand<never, unknown> {
        const command = this.commands.get(id)
        if (!command) throw new CommandNotFoundError(id)
        return command
    }

    list(): SqlJobCommand<never, unknown>[] {
        return [...this.commands.values()]
    }

    listByCategory(category: CommandCategory): SqlJobCommand<never, unknown>[] {
        return this.list().filter(c => c.category === category)
    }

    async execute<I, O>(id: string, input: I, ctx: CommandContext): Promise<O> {
        const command = this.get(id) as unknown as SqlJobCommand<I, O>
        let parsed = input
        if (command.params) {
            const result = command.params.safeParse(input)
            if (!result.success) {
                throw new CommandValidationError(id, result.error.issues.map(i => `${i.path.join('.') || '(racine)'}: ${i.message}`).join('; '))
            }
            parsed = result.data as I
        }
        // L'instantané est pris AVANT l'exécution : après, il est trop tard.
        const snapshot = command.undoable ? ctx.project.snapshot() : undefined
        const output = await command.execute(parsed, ctx)
        if (command.undoable) {
            ctx.history.record({id, snapshot})
        }
        return output
    }
}

/** Registre global de l'application. */
export const commandRegistry = new CommandRegistry()

/**
 * Contexte actif, installé une fois au démarrage par l'hôte (`useCommands`).
 * Il évite de faire descendre le contexte dans chaque composant : un bouton
 * appelle `executeCommand('notebook.runAll')` sans connaître le store.
 */
let activeContext: CommandContext | null = null

export function setCommandContext(context: CommandContext | null): void {
    activeContext = context
}

function getCommandContext(): CommandContext {
    if (!activeContext) {
        throw new Error('Contexte de commandes non initialisé : appeler setCommandContext() au démarrage.')
    }
    return activeContext
}

/** Exécute une commande avec le contexte actif (usage UI / automatisation). */
export function executeCommand<I = unknown, O = unknown>(id: string, input?: I): Promise<O> {
    return commandRegistry.execute<I, O>(id, input as I, getCommandContext())
}

/** Déclaration typée d'une commande (sucre syntaxique + inférence). */
export function defineCommand<I, O>(command: SqlJobCommand<I, O>): SqlJobCommand<I, O> {
    return command
}
