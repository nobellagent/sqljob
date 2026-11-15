import {SelectColumnsStepUI} from './steps/selectColumns'

export function EyeIcon({ open, className = '' }: { open: boolean; className?: string }) {
    return open ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
    )
}

// ─── ColumnCheckbox ───────────────────────────────────────────────────────────


export function ColumnCheckbox({ col, checked, onChange }: { col: string; checked: boolean; onChange: (c: string, v: boolean) => void }) {
    return (
        <label className="flex items-center gap-2 cursor-pointer px-2 py-0.5 rounded hover:bg-muted/50">
            <input type="checkbox" className="rounded border-border w-3.5 h-3.5 accent-primary"
                checked={checked} onChange={e => onChange(col, e.target.checked)} />
            <span className="text-xs font-mono text-foreground">{col}</span>
        </label>
    )
}

// ─── SelectColumnsStepUI ──────────────────────────────────────────────────────


export function ColSelect({ value, cols, onChange, placeholder = '— colonne —', className = '' }: { value: string; cols: string[]; onChange: (v: string) => void; placeholder?: string; className?: string }) {
    return (
        <select className={`h-6 rounded border border-border bg-background px-1 text-xs font-mono ${className}`} value={value} onChange={e => onChange(e.target.value)}>
            <option value="">{placeholder}</option>
            {cols.map(c => <option key={c} value={c}>{c}</option>)}
            {value && !cols.includes(value) && <option value={value}>{value}</option>}
        </select>
    )
}


export function TxtInput({ value, onChange, placeholder = '', className = '' }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
    return <input type="text" className={`h-6 rounded border border-border bg-background px-1.5 text-xs font-mono ${className}`} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
}


export function AddRowBtn({ onClick, label = '+ Ajouter' }: { onClick: () => void; label?: string }) {
    return <button onClick={onClick} className="flex items-center gap-1 text-xs text-primary hover:underline mt-1">{label}</button>
}


export function RemoveBtn({ onClick }: { onClick: () => void }) {
    return <button onClick={onClick} className="shrink-0 text-destructive hover:text-destructive/70 w-4 h-4 flex items-center justify-center text-xs leading-none">✕</button>
}


export function MoveBtns({ onUp, onDown }: { onUp?: () => void; onDown?: () => void }) {
    const btn = (label: string, handler?: () => void) => (
        <button onClick={handler} disabled={!handler}
            className={`w-3.5 h-3.5 flex items-center justify-center text-[9px] rounded leading-none transition-colors
                ${handler ? 'text-muted-foreground hover:bg-muted hover:text-foreground' : 'text-muted-foreground/25 cursor-default'}`}>
            {label}
        </button>
    )
    return (
        <div className="flex flex-col shrink-0 self-center gap-px">
            {btn('▲', onUp)}
            {btn('▼', onDown)}
        </div>
    )
}

// ─── P1 step UIs ──────────────────────────────────────────────────────────────

