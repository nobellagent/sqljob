import {useState, useRef, useEffect} from 'react'
import {useShallow} from 'zustand/react/shallow'
import {useNotebookStore} from '../../../store/notebookStore'
import type {FilterValueKind} from '../../../../lib/SqlBlockTypes'
import {ColSelect} from './ui'
import {DistinctValueInput} from './distinct'

export const VAR_KIND_ICONS: Record<FilterValueKind, JSX.Element> = {
    literal:    <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>,
    column:     <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="9" x2="9" y2="21"/></svg>,
    param:      <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 12 21 12"/><polyline points="3 12 7 12"/><rect x="7" y="8" width="10" height="8" rx="1"/></svg>,
    expression: <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6"/><path d="M10 9v6"/><path d="M14 9v6"/></svg>,
}


export const VAR_KIND_LABELS: Record<FilterValueKind, string> = {
    literal:    'Entrer une valeur',
    column:     'Sélectionner une colonne',
    param:      'Paramètre',
    expression: 'Expression SQL',
}

/**
 * Composant réutilisable : entrée d'une valeur avec choix du mode (valeur fixe / colonne / paramètre).
 * L'icône "boxes" ouvre un menu déroulant pour changer de mode.
 */

export function VarInput({ value, valueKind = 'literal', onChange, availableCols, column, fetchDistinctValues, placeholder = 'valeur', className = '' }: {
    value: string; valueKind?: FilterValueKind
    onChange: (value: string, kind: FilterValueKind) => void
    availableCols: string[]
    column?: string
    fetchDistinctValues?: (col: string, sl: number, fl: number) => Promise<{ values: string[]; hasMore: boolean }>
    placeholder?: string; className?: string
}) {
    const [menuOpen, setMenuOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)
    const paramNames = useNotebookStore(useShallow((s: any) => {
        const params = s.getParameters()
        return Object.keys(params)
    }))

    // Fermeture sur clic extérieur
    useEffect(() => {
        if (!menuOpen) return
        const handler = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false) }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [menuOpen])

    return (
        <div className={`flex items-center gap-0.5 ${className}`}>
            {/* Bouton mode */}
            <div className="relative shrink-0" ref={menuRef}>
                <button
                    type="button"
                    onClick={() => setMenuOpen(o => !o)}
                    className="h-6 w-6 flex items-center justify-center rounded border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="Changer le type de valeur"
                >
                    {VAR_KIND_ICONS[valueKind]}
                </button>
                {menuOpen && (
                    <div className="absolute left-0 top-full z-50 mt-0.5 w-52 bg-popover border border-border rounded shadow-lg py-0.5">
                        {(['literal', 'column', 'param', 'expression'] as FilterValueKind[]).map(k => (
                            <button key={k} type="button"
                                onClick={() => { onChange('', k); setMenuOpen(false) }}
                                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-muted flex items-center gap-2 ${valueKind === k ? 'text-primary font-medium' : 'text-foreground'}`}
                            >
                                {VAR_KIND_ICONS[k]}
                                {VAR_KIND_LABELS[k]}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            {/* Zone de saisie selon le mode */}
            {valueKind === 'literal' && (
                <DistinctValueInput
                    value={value} onChange={v => onChange(v, 'literal')}
                    column={column ?? ''} fetchDistinctValues={fetchDistinctValues}
                    placeholder={placeholder} className="flex-1 min-w-0"
                />
            )}
            {valueKind === 'column' && (
                <ColSelect value={value} cols={availableCols} onChange={v => onChange(v, 'column')} className="flex-1 min-w-0 h-6 text-xs" />
            )}
            {valueKind === 'param' && (
                paramNames.length > 0
                    ? <select
                        value={value}
                        onChange={e => onChange(e.target.value, 'param')}
                        className="flex-1 min-w-0 h-6 rounded border border-border bg-background px-1 text-xs font-mono"
                    >
                        <option value="">— paramètre —</option>
                        {paramNames.map((p: string) => <option key={p} value={`{{${p}}}`}>{p}</option>)}
                    </select>
                    : <span className="flex-1 text-xs text-muted-foreground italic px-1">Aucun paramètre UI</span>
            )}
            {valueKind === 'expression' && (
                <input
                    type="text"
                    value={value}
                    onChange={e => onChange(e.target.value, 'expression')}
                    placeholder="ex: col_a / col_b"
                    className="flex-1 min-w-0 h-6 rounded border border-border bg-background px-1.5 text-xs font-mono"
                />
            )}
        </div>
    )
}

