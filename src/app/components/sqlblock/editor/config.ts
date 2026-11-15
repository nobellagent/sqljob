import {astToSql, buildDisplaySql} from '../../../../lib/SqlBlockService'
import type {SqlBlockConfig, SqlBlockAst} from '../../../../lib/SqlBlockTypes'
import {computeStepSchemas} from './schema'

export function getOrInitConfig(cell: any): SqlBlockConfig {
    const q: any = cell.queries?.[0] ?? {}
    // Migration depuis cell.json (anciens sqlBlock), en lecture
    const legacy = cell.json?.ast && !q.ast ? cell.json : null
    const ast = q.ast ?? legacy?.ast ?? { source: '', steps: [], materialized: cell.materialized ?? 'ephemeral' }
    return {
        ...q,
        ast,
        degraded: q.degraded ?? legacy?.degraded ?? false,
        manualSql: q.manualSql ?? legacy?.manualSql ?? null,
    } as SqlBlockConfig
}

/**
 * Écriture de la configuration SQL block, à n'utiliser que dans un brouillon
 * immer (`apply(c => …)`) : garantit queries[0] puis applique `fn`.
 */

export function mutateSqlBlockConfig(cell: any, fn: (cfg: any) => void) {
    if (!cell.queries?.length) {
        cell.queries = [{ name: 'main', sql: '', engine: 'sql', showQueryEditor: false }]
    }
    const q = cell.queries[0]
    if (cell.json?.ast && !q.ast) {
        q.ast = cell.json.ast
        q.degraded = cell.json.degraded ?? false
        q.manualSql = cell.json.manualSql ?? null
        delete cell.json
    }
    if (!q.ast) q.ast = { source: '', steps: [], materialized: cell.materialized ?? 'ephemeral' }
    if (q.degraded === undefined) q.degraded = false
    if (q.manualSql === undefined) q.manualSql = null
    fn(q)
}


type ApplyCell = (fn: (cell: any) => void) => void


export function commitAstUpdate(cell: any, newAst: Partial<SqlBlockAst>, apply: ApplyCell) {
    apply(c => mutateSqlBlockConfig(c, (cfg: any) => {
        cfg.ast = { ...cfg.ast, ...newAst }
        cfg.degraded = false
        cfg.manualSql = null
        // Stocker le SQL avec DDL si view/table — cohérent avec l'éditeur SQL en mode non-UI
        // L'exécution stripe le préfixe DDL avant de ré-appliquer via cell.materialize
        const selectSql = astToSql(cfg.ast)
        cfg.sql = buildDisplaySql(cell.name, selectSql, cfg.ast.materialized ?? 'ephemeral')
    }))
    // Sync cell.materialized avec l'AST
    if (newAst.materialized !== undefined) apply(c => { c.materialized = newAst.materialized })
}

// ─── computeStepSchemas ───────────────────────────────────────────────────────
// Dérive statiquement le schéma INPUT de chaque étape (colonnes/types disponibles
// en entrée de l'étape i = sortie de l'étape i-1).

