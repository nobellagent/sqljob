import {useState, useCallback, useRef} from 'react'
import {DuckDBManager} from '../../../../../lib/DuckDBManager'
import {stepSql} from '../../../../../lib/SqlBlockService'
import type {SqlBlockAst} from '../../../../../lib/SqlBlockTypes'
import {makeTableRef} from '../session'

export interface DynamicSchema { columns: string[]; colTypes: Record<string, string> }



export function useStepInputSchemas(ast: SqlBlockAst, cellId: string) {
    const [dynamicSchemas, setDynamicSchemas] = useState<Record<number, DynamicSchema>>({})
    const cacheRef = useRef<Map<string, DynamicSchema>>(new Map())
    const astRef = useRef(ast)
    astRef.current = ast

    const fetchSchemaForStep = useCallback(async (stepIdx: number) => {
        // Toujours travailler sur un AST sans chartConfig : le SELECT final avec
        // annotations (CAST(x AS XAXIS)…) ne doit jamais polluer les schémas des étapes.
        const a = { ...astRef.current, chartConfig: undefined }
        if (!a.source) return
        const cacheKey = JSON.stringify({ src: a.source, steps: a.steps.slice(0, stepIdx) })

        const cached = cacheRef.current.get(cacheKey)
        if (cached) {
            setDynamicSchemas(prev => ({ ...prev, [stepIdx]: cached }))
            return
        }

        try {
            let schemaTypes: Record<string, string> | undefined

            // 1. Essaie la table temp déjà matérialisée (makeTableRef(cellId, stepIdx-1))
            //    Elle existe si la matérialisation proactive a tourné.
            if (stepIdx > 0) {
                const tRef = makeTableRef(cellId, stepIdx - 1)
                try {
                    const conn = DuckDBManager.getConnection()
                    if (conn) {
                        const result = await conn.query(`SELECT * FROM ${tRef} LIMIT 0`)
                        schemaTypes = {}
                        for (const field of result.schema.fields) {
                            schemaTypes[field.name] = String(field.type)
                        }
                    }
                } catch { /* table pas encore créée → fallback */ }
            }

            // 2. Fallback : LIMIT 0 directement sur le SQL amont (sans wrapper subquery)
            if (!schemaTypes) {
                const inputSql = stepSql(a, stepIdx - 1)
                if (!inputSql) return
                const bare = inputSql.trimEnd().replace(/;+\s*$/, '')
                const hasLimit = /\bLIMIT\s+\d/i.test(bare.replace(/\([\s\S]*?\)/g, ''))
                const sql0 = hasLimit ? bare : `${bare}\nLIMIT 0`
                const conn = DuckDBManager.getConnection()
                if (!conn) return
                const result = await conn.query(sql0)
                for (const field of result.schema.fields) {
                    if (!schemaTypes) schemaTypes = {}
                    schemaTypes[field.name] = String(field.type)
                }
            }

            if (!schemaTypes) return
            const result: DynamicSchema = { columns: Object.keys(schemaTypes), colTypes: schemaTypes }
            cacheRef.current.set(cacheKey, result)
            setDynamicSchemas(prev => ({ ...prev, [stepIdx]: result }))
        } catch (err) {
            console.warn('[sqlblock input-schema]', err)
        }
    }, [cellId])

    /** Invalide le cache ET l'état dynamicSchemas pour les steps >= dirtyFromStep */
    const invalidateFrom = useCallback((dirtyFromStep: number, a: SqlBlockAst) => {
        for (const [key] of cacheRef.current) {
            try {
                const parsed = JSON.parse(key) as { src: string; steps: unknown[] }
                if (parsed.src !== a.source || parsed.steps.length >= dirtyFromStep)
                    cacheRef.current.delete(key)
            } catch { cacheRef.current.delete(key) }
        }
        // Purge aussi le state React pour éviter d'afficher des données périmées
        setDynamicSchemas(prev => {
            const next: Record<number, DynamicSchema> = {}
            for (const [k, v] of Object.entries(prev)) {
                if (Number(k) < dirtyFromStep) next[Number(k)] = v
            }
            return next
        })
    }, [])

    return { dynamicSchemas, fetchSchemaForStep, invalidateFrom }
}




