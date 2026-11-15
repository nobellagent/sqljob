import {useState, useRef, useEffect} from 'react'
import {VarInput} from './varInput'

const DISTINCT_INITIAL_SELECT_LIMIT = 100

const DISTINCT_INITIAL_FROM_LIMIT = 10000

/** Dropdown distinct values — mono (=, between) ou multi (IN, NOT IN) */

function DistinctDropdown({ multi = false, value = '', onChangeSingle, values = [], onChangeMulti, column, fetchDistinctValues, placeholder = 'valeur', className = '' }: {
    multi?: boolean
    value?: string; onChangeSingle?: (v: string) => void
    values?: string[]; onChangeMulti?: (v: string[]) => void
    column: string
    fetchDistinctValues?: (col: string, selectLimit: number, fromLimit: number) => Promise<{ values: string[]; hasMore: boolean }>
    placeholder?: string; className?: string
}) {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState('')
    const [distinctValues, setDistinctValues] = useState<string[]>([])
    const [hasMore, setHasMore] = useState(false)
    // loading = chargement initial (liste vide), refreshing = rechargement (garde la liste)
    const [loading, setLoading] = useState(false)
    const [refreshing, setRefreshing] = useState(false)
    const [selectLim, setSelectLim] = useState(DISTINCT_INITIAL_SELECT_LIMIT)
    const [fromLim, setFromLim] = useState(DISTINCT_INITIAL_FROM_LIMIT)
    const wrapRef = useRef<HTMLDivElement>(null)

    async function load(sl: number, fl: number, isInitial = false) {
        if (!fetchDistinctValues || !column) return
        if (isInitial) setLoading(true); else setRefreshing(true)
        try {
            const res = await fetchDistinctValues(column, sl, fl)
            setDistinctValues(res.values)
            setHasMore(res.hasMore)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        if (open) {
            setDistinctValues([])
            setSelectLim(DISTINCT_INITIAL_SELECT_LIMIT)
            setFromLim(DISTINCT_INITIAL_FROM_LIMIT)
            load(DISTINCT_INITIAL_SELECT_LIMIT, DISTINCT_INITIAL_FROM_LIMIT, true)
        }
    }, [open, column])

    useEffect(() => {
        if (!open) return
        function onMouseDown(e: MouseEvent) {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', onMouseDown)
        return () => document.removeEventListener('mousedown', onMouseDown)
    }, [open])

    function handleLoadMore(e: React.MouseEvent) {
        e.preventDefault(); e.stopPropagation()
        const newSl = selectLim === 0 ? 0 : selectLim * 2
        const newFl = fromLim === 0 ? 0 : fromLim * 10
        setSelectLim(newSl); setFromLim(newFl)
        load(newSl, newFl)
    }

    function handleLoadAll(e: React.MouseEvent) {
        e.preventDefault(); e.stopPropagation()
        setSelectLim(0); setFromLim(0)
        load(0, 0)
    }

    function toggle(v: string) {
        onChangeMulti?.(values.includes(v) ? values.filter(x => x !== v) : [...values, v])
    }

    const filtered = multi
        ? distinctValues.filter(v => !search || v.toLowerCase().includes(search.toLowerCase()))
        : distinctValues.filter(v => !value || v.toLowerCase().includes(value.toLowerCase()))

    return (
        <div ref={wrapRef} className={`relative ${className}`}>
            {/* Déclencheur */}
            {multi ? (
                <div className="min-h-6 flex flex-wrap gap-0.5 items-center rounded border border-border bg-background px-1.5 py-0.5 cursor-pointer text-xs"
                    onClick={() => setOpen(o => !o)}>
                    {values.length === 0
                        ? <span className="text-muted-foreground italic">Sélectionner…</span>
                        : values.map(v => (
                            <span key={v} className="inline-flex items-center gap-0.5 bg-primary/15 text-primary rounded px-1 py-0 font-mono">
                                {v}
                                <button className="hover:text-destructive leading-none"
                                    onMouseDown={e => { e.stopPropagation(); toggle(v) }}>×</button>
                            </span>
                        ))}
                </div>
            ) : (
                <input type="text"
                    className="w-full h-6 rounded border border-border bg-background px-1.5 text-xs font-mono"
                    value={value} onChange={e => onChangeSingle?.(e.target.value)}
                    placeholder={placeholder}
                    onFocus={() => fetchDistinctValues && setOpen(true)} />
            )}

            {/* Dropdown panel */}
            {open && fetchDistinctValues && (
                <div className="absolute z-50 mt-0.5 left-0 right-0 bg-popover border border-border rounded shadow-lg flex flex-col max-h-56 text-xs"
                    onClick={e => e.stopPropagation()}
                    onMouseDown={e => e.stopPropagation()}>
                    {/* Recherche + coche tout/rien (multi seulement) */}
                    {multi && (
                        <div className="px-2 py-1 border-b border-border flex items-center gap-1.5">
                            <input autoFocus className="flex-1 h-5 bg-transparent outline-none placeholder:text-muted-foreground min-w-0"
                                placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} />
                            {filtered.length > 0 && (() => {
                                const allChecked = filtered.every(v => values.includes(v))
                                const someChecked = !allChecked && filtered.some(v => values.includes(v))
                                return (
                                    <button
                                        className="shrink-0 w-4 h-4 flex items-center justify-center rounded border border-border hover:bg-muted"
                                        title={allChecked ? 'Désélectionner tout l\'affiché' : 'Sélectionner tout l\'affiché'}
                                        onMouseDown={e => {
                                            e.preventDefault()
                                            if (allChecked) {
                                                onChangeMulti?.(values.filter(v => !filtered.includes(v)))
                                            } else {
                                                const toAdd = filtered.filter(v => !values.includes(v))
                                                onChangeMulti?.([...values, ...toAdd])
                                            }
                                        }}>
                                        <span className={`text-[10px] leading-none ${allChecked ? 'text-primary' : someChecked ? 'text-primary/50' : 'text-muted-foreground'}`}>
                                            {allChecked ? '✓' : someChecked ? '–' : '☐'}
                                        </span>
                                    </button>
                                )
                            })()}
                        </div>
                    )}
                    {/* Liste */}
                    <div className="overflow-y-auto flex-1">
                        {loading && <div className="px-2 py-1 text-muted-foreground italic">Chargement…</div>}
                        {!loading && filtered.length === 0 && <div className="px-2 py-1 text-muted-foreground italic">Aucune valeur</div>}
                        {!loading && filtered.map(v => multi ? (
                            <button key={v}
                                className={`w-full text-left px-2 py-0.5 flex items-center gap-1.5 hover:bg-muted ${values.includes(v) ? 'font-medium text-primary' : ''}`}
                                onMouseDown={e => { e.preventDefault(); toggle(v) }}>
                                <span className="w-3 shrink-0">{values.includes(v) ? '✓' : ''}</span>
                                <span className="truncate font-mono">{v}</span>
                            </button>
                        ) : (
                            <button key={v} className="w-full text-left px-2 py-0.5 hover:bg-muted truncate font-mono"
                                onMouseDown={e => { e.preventDefault(); onChangeSingle?.(v); setOpen(false) }}>
                                {v}
                            </button>
                        ))}
                    </div>
                    {/* Footer */}
                    <div className="border-t border-border px-2 py-0.5 flex items-center gap-2 text-muted-foreground shrink-0">
                        <span className="text-[10px]">{filtered.length} valeur{filtered.length !== 1 ? 's' : ''}</span>
                        {multi && values.length > 0 && (
                            <span className="text-[10px] text-primary">{values.length} sélectionnée{values.length > 1 ? 's' : ''}</span>
                        )}
                        {refreshing && <span className="text-[10px] italic ml-1">Chargement…</span>}
                        {!loading && hasMore && (
                            <>
                                <button className="ml-auto text-primary hover:underline font-medium" onMouseDown={handleLoadMore}>Charger plus…</button>
                                <button className="text-primary hover:underline font-medium" onMouseDown={handleLoadAll}>Tout</button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}


export function DistinctValueInput({ value, onChange, column, fetchDistinctValues, placeholder = 'valeur', className = '' }: {
    value: string; onChange: (v: string) => void
    column: string
    fetchDistinctValues?: (col: string, selectLimit: number, fromLimit: number) => Promise<{ values: string[]; hasMore: boolean }>
    placeholder?: string; className?: string
}) {
    return <DistinctDropdown value={value} onChangeSingle={onChange} column={column} fetchDistinctValues={fetchDistinctValues} placeholder={placeholder} className={className} />
}


export function DistinctMultiInput({ values, onChange, column, fetchDistinctValues, className = '' }: {
    values: string[]; onChange: (v: string[]) => void
    column: string
    fetchDistinctValues?: (col: string, selectLimit: number, fromLimit: number) => Promise<{ values: string[]; hasMore: boolean }>
    className?: string
}) {
    return <DistinctDropdown multi values={values} onChangeMulti={onChange} column={column} fetchDistinctValues={fetchDistinctValues} className={className} />
}

// ─── VarInput — saisie variable (valeur / colonne / paramètre) ─────────────────
// Réutilisable pour n'importe quelle étape nécessitant une valeur flexible.

