import {useEffect} from 'react'
import {createPortal} from 'react-dom'
import {EyeIcon} from '../ui'
import {VizConfigModal, VizStepItem} from './VizSteps'

export function SourceConfigModal({ source, tables, disabled, onChange, onClose }: {
    source: string; tables: string[]; disabled: boolean
    onChange: (v: string) => void; onClose: () => void
}) {
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
        document.addEventListener('keydown', handler)
        return () => document.removeEventListener('keydown', handler)
    }, [onClose])

    return createPortal(
        <div className="fixed inset-0 z-[9998] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative z-10 bg-popover border border-border rounded-xl shadow-2xl w-full max-w-sm mx-4 flex flex-col">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
                    <span className="font-semibold text-sm flex-1">Source</span>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground w-6 h-6 flex items-center justify-center rounded hover:bg-muted text-lg leading-none">×</button>
                </div>
                <div className="px-4 py-4">
                    <select
                        value={source || ''}
                        onChange={e => { onChange(e.target.value); onClose() }}
                        disabled={disabled}
                        size={Math.min(tables.length + (source && !tables.includes(source) ? 1 : 0), 12)}
                        className="w-full text-xs font-mono border border-border rounded bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                        {!source && <option value="" disabled>— choisir une source —</option>}
                        {tables.map(t => <option key={t} value={t}>{t}</option>)}
                        {source && !tables.includes(source) && <option value={source}>{source}</option>}
                    </select>
                </div>
            </div>
        </div>,
        document.body
    )
}



export function SourceStepItem({ eyeOpen, onEyeToggle, source, configOpen, onConfigOpen, onConfigClose, tables, disabled, onSourceChange }: {
    eyeOpen: boolean; onEyeToggle: () => void
    source: string; configOpen: boolean; onConfigOpen: () => void; onConfigClose: () => void
    tables: string[]; disabled: boolean; onSourceChange: (v: string) => void
}) {
    return (
        <>
            <div className="border border-border rounded bg-card text-card-foreground">
                <div className="flex items-center gap-1.5 px-2 py-1.5 select-none">
                    <button
                        onClick={e => { e.stopPropagation(); onEyeToggle() }}
                        className={`shrink-0 w-5 h-5 flex items-center justify-center rounded transition-colors ${eyeOpen ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                        title={eyeOpen ? "Masquer l'aperçu source" : "Voir l'aperçu source"}
                    >
                        <EyeIcon open={eyeOpen} className="w-3.5 h-3.5" />
                    </button>
                    <button className="flex-1 text-left min-w-0" onClick={onConfigOpen}>
                        <div className="flex items-center gap-1">
                            <span className="text-xs font-medium">Source</span>
                            {source && (
                                <span className="text-[10px] font-mono text-primary/80 bg-primary/10 px-1 rounded leading-4 shrink-0 truncate max-w-[120px]">{source}</span>
                            )}
                        </div>
                        {!source && <span className="block text-xs text-muted-foreground italic">— choisir une source —</span>}
                    </button>
                    <button onClick={onConfigOpen}
                        className="text-muted-foreground hover:text-foreground w-6 h-6 flex items-center justify-center rounded hover:bg-muted transition-colors"
                        title="Changer la source">
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                        </svg>
                    </button>
                </div>
            </div>
            {configOpen && (
                <SourceConfigModal
                    source={source} tables={tables} disabled={disabled}
                    onChange={onSourceChange} onClose={onConfigClose}
                />
            )}
        </>
    )
}

// ─── VizStepItem / VizConfigModal ─────────────────────────────────────────────


