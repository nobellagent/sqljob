import {useState, useRef, useEffect} from 'react'
import {useNotebookStore} from '../../../store/notebookStore'
import {DuckDBManager} from '../../../../lib/DuckDBManager'
import {generateMaterializeQuery, stepSql, quoteId} from '../../../../lib/SqlBlockService'
import type {SqlBlockAst} from '../../../../lib/SqlBlockTypes'
import {SUBCELL_LIMIT, ensureSqlblockSchema, makeTableRef} from './session'

export interface EyeEntry {
    rows: Record<string, any>[]
    schemaTypes: Record<string, string>
    hash: string
}


export function useStepEyeData(cell: any, ast: SqlBlockAst, modalOpen?: boolean) {
    const [eyeOpen, setEyeOpenState] = useState<number | 'source' | null>(null)
    const [loading, setLoading] = useState(false)
    const [, bumpRender] = useState(0)

    // Accès direct au store pour appeler refreshDuckdbSchema après matérialisation
    const refreshDuckdbSchema = useNotebookStore(s => s.refreshDuckdbSchema)

    // Refs pour accéder aux valeurs fraîches sans stale-closure
    const astRef = useRef(ast)
    astRef.current = ast
    const cellRef = useRef(cell)
    cellRef.current = cell
    const eyeOpenRef = useRef<number | 'source' | null>(null)

    // Cache : stepIndex | 'source' → résultats + hash upstream
    const cache = useRef<Map<number | 'source', EyeEntry>>(new Map())

    function getHash(idx: number | 'source'): string {
        const a = astRef.current
        if (idx === 'source') return JSON.stringify({ src: a.source })
        return JSON.stringify({ src: a.source, steps: a.steps.slice(0, idx + 1) })
    }

    const cellTableRef = (idx: number) => makeTableRef(cellRef.current._id, idx)

    /**
     * Matérialise le step idx dans une table temp DuckDB.
     * Toujours créée en TABLE avec LIMIT, indépendamment de ast.materialize.
     * On append simplement LIMIT N à la fin du SQL généré (CTE ou SELECT plat),
     * sans wrapper subquery qui pose problème avec les CTEs inline dans DuckDB WASM.
     */
    async function doLoad(idx: number | 'source', silent = false) {
        const hash = getHash(idx)
        if (cache.current.get(idx)?.hash === hash) return  // Cache valide

        if (!silent) setLoading(true)
        try {
            const a = astRef.current
            if (idx === 'source') {
                if (!a.source) return
                const conn = DuckDBManager.getConnection()
                if (!conn) return
                const result = await conn.query(`SELECT * FROM ${quoteId(a.source)} LIMIT ${SUBCELL_LIMIT}`)
                const rows = result.toArray().map((row: any) => Object.fromEntries(row))
                const schemaTypes: Record<string, string> = {}
                for (const field of result.schema.fields) schemaTypes[field.name] = String(field.type)
                cache.current.set('source', { rows, schemaTypes, hash })
                bumpRender(n => n + 1)
                return
            }
            await ensureSqlblockSchema()
            if (!a.source && !a.steps?.length) return
            const tRef = cellTableRef(idx)
            // Toujours sans chartConfig : la table temp doit contenir les données brutes,
            // pas les colonnes annotées CAST(x AS XAXIS) du SELECT de visualisation.
            const sql = stepSql({ ...a, chartConfig: undefined }, idx)
            if (!sql) return
            // Append LIMIT directement — fonctionne pour SELECT plat et CTE chain.
            // On strip un éventuel ; final et on n'ajoute pas de second LIMIT si déjà présent.
            const bare = sql.trimEnd().replace(/;+\s*$/, '')
            const hasLimit = /\bLIMIT\s+\d/i.test(bare.replace(/\([\s\S]*?\)/g, ''))
            // Même pattern que generateMaterializeQuery : sql enveloppé dans des parenthèses.
            // Le LIMIT est injecté à l'intérieur avant de fermer la parenthèse.
            const innerSql = hasLimit ? bare : `${bare}\nLIMIT ${SUBCELL_LIMIT}`
            await DuckDBManager.executeQuery(
                `CREATE OR REPLACE TABLE ${tRef} AS (\n${innerSql}\n)`
            )
            const conn = DuckDBManager.getConnection()
            const result = await conn.query(`SELECT * FROM ${tRef}`)
            const rows = result.toArray().map((row: any) => Object.fromEntries(row))
            const schemaTypes: Record<string, string> = {}
            for (const field of result.schema.fields) {
                schemaTypes[field.name] = String(field.type)
            }
            cache.current.set(idx, { rows, schemaTypes, hash })
            bumpRender(n => n + 1)
        } catch (err) {
            console.error('[sqlblock eye]', err)
        } finally {
            if (!silent) setLoading(false)
        }
    }

    function toggleEye(idx: number | 'source') {
        const next = eyeOpenRef.current === idx ? null : idx
        eyeOpenRef.current = next
        setEyeOpenState(next)
        if (next !== null) doLoad(next)
    }

    // ── Matérialisation proactive en arrière-plan ─────────────────────────
    // Dès que la source ou les steps changent, on (re)matérialise toutes les
    // étapes séquentiellement (silent=true → pas de spinner global).
    // Résultat : eye instant, schéma toujours à jour, indépendant du mode VIEW/TABLE.
    // modalOpen inclus dans bgKey pour forcer le re-run à chaque ouverture
    const bgKey = JSON.stringify({ src: ast.source, steps: ast.steps, open: !!modalOpen })
    useEffect(() => {
        if (!modalOpen) return  // Ne matérialiser que quand la modale est visible
        if (!ast.source && !ast.steps.length) return
        let cancelled = false
        const run = async () => {
            await ensureSqlblockSchema()
            for (let i = 0; i < astRef.current.steps.length; i++) {
                if (cancelled) break
                await doLoad(i, true)   // silent : pas de setLoading
            }
            // Rafraîchir le schéma DuckDB affiché dans le layout (panel + autocomplete)
            if (!cancelled) {
                try { await refreshDuckdbSchema?.() } catch { /* ignore */ }
            }
        }
        run()
        return () => { cancelled = true }
    }, [bgKey])     // eslint-disable-line react-hooks/exhaustive-deps

    // Auto-refresh si l'œil est ouvert et que les prédécesseurs changent
    const upstreamKey = typeof eyeOpen === 'number'
        ? JSON.stringify([ast.source, ...ast.steps.slice(0, eyeOpen + 1)])
        : eyeOpen === 'source' ? ast.source
        : null

    useEffect(() => {
        if (eyeOpen === null) return
        doLoad(eyeOpen)
    }, [upstreamKey, eyeOpen])  // eslint-disable-line react-hooks/exhaustive-deps

    return {
        eyeOpen,
        toggleEye,
        loading,
        getEyeData: (idx: number | 'source'): EyeEntry | null => cache.current.get(idx) ?? null,
        cellTableRef,
    }
}

// ─── Icônes SVG inline ────────────────────────────────────────────────────────

