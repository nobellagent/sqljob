import { describe, expect, it } from 'vitest'
import { astToSql, quoteId, sqlToAst, getEffectiveSql } from '../src/lib/SqlBlockService'
import type { SqlBlockAst } from '../src/lib/SqlBlockTypes'

const base = (steps: SqlBlockAst['steps']): SqlBlockAst => ({
    source: 'sales',
    steps,
    materialized: 'view',
})

describe('SqlBlockService — astToSql', () => {
    it('produit un SELECT simple sans étape', () => {
        expect(astToSql(base([]))).toBe('SELECT * FROM sales')
    })

    it('applique une projection de colonnes sans CTE quand une seule étape est anonyme', () => {
        const sql = astToSql(base([{type: 'select_columns', columns: ['a', 'b']}]))
        expect(sql).toBe('SELECT\n  a,\n  b\nFROM sales')
    })

    it('chaîne plusieurs étapes en CTE', () => {
        const sql = astToSql(
            base([
                {type: 'select_columns', columns: ['a', 'b']},
                {type: 'sort', keys: [{column: 'a', direction: 'asc', nulls: 'last'}]},
            ]),
        )
        expect(sql).toContain('WITH')
        expect(sql).toContain('_sqlblock_s0')
        expect(sql).toContain('_sqlblock_s1')
        expect(sql).toContain('ORDER BY')
        expect(sql.trim().startsWith('WITH')).toBe(true)
    })

    it('échappe les identifiants contenant des guillemets', () => {
        expect(quoteId('we"ird')).toBe('"we""ird"')
    })

    it('produit un SQL non vide pour chaque étape P0/P1', () => {
        const steps: SqlBlockAst['steps'] = [
            {type: 'select_columns', columns: ['a']},
            {type: 'exclude_columns', columns: ['b']},
            {type: 'change_type', changes: [{column: 'a', targetType: 'INTEGER'}]},
            {type: 'sort', keys: [{column: 'a', direction: 'desc', nulls: 'first'}]},
            {type: 'top_n', mode: 'limit', n: 10},
            {type: 'rename_columns', renames: [{from: 'a', to: 'b'}]},
            {type: 'derive', columns: [{name: 'c', expr: 'a + 1', replace: false}]},
        ]
        const sql = astToSql(base(steps))
        expect(sql.length).toBeGreaterThan(50)
        expect(sql).toContain('SELECT')
    })
})

describe('SqlBlockService — sqlToAst', () => {
    it('parse un SELECT simple et retrouve la table source', () => {
        const {ast, warnings} = sqlToAst('SELECT a, b FROM sales')
        expect(ast.source).toBe('sales')
        expect(warnings ?? []).toEqual([])
        expect(ast.steps.length).toBeGreaterThanOrEqual(1)
    })

    it('reste stable sur un aller-retour ast → sql → ast', () => {
        const initial = base([{type: 'select_columns', columns: ['a', 'b']}])
        const sql = astToSql(initial)
        const {ast} = sqlToAst(sql)
        expect(ast.source.toLowerCase()).toContain('sales')
    })
})

describe('SqlBlockService — getEffectiveSql', () => {
    it('privilégie manualSql quand le mode dégradé est actif', () => {
        const sql = getEffectiveSql({
            ast: base([]),
            degraded: true,
            manualSql: 'SELECT 42 AS answer',
        })
        expect(sql).toBe('SELECT 42 AS answer')
    })

    it('génère depuis l’AST sinon', () => {
        const sql = getEffectiveSql({ast: base([]), degraded: false, manualSql: null})
        expect(sql).toBe('SELECT * FROM sales')
    })
})
