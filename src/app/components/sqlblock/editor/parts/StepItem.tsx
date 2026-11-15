import {useState} from 'react'
import {STEP_LABELS} from '../../../../../lib/SqlBlockTypes'
import type {SqlBlockStep} from '../../../../../lib/SqlBlockTypes'
import {EyeIcon} from '../ui'
import {stepSummary} from './summary'
import {StepConfigModal} from './StepConfigModal'
import {SourceConfigModal, SourceStepItem} from './SourceSteps'

export function StepItem({ step, index, totalSteps, availableCols, availableColTypes,
    eyeOpen, eyeLoading, onEyeToggle,
    onUpdate, onRemove, onMove,
    configOpen, onConfigOpen, onConfigClose, fetchDistinctValues, otherStepNames }: {
    step: SqlBlockStep; index: number; totalSteps: number
    availableCols: string[]; availableColTypes: Record<string, string>
    eyeOpen: boolean; eyeLoading: boolean
    onEyeToggle: () => void
    onUpdate: (idx: number, s: SqlBlockStep) => void
    onRemove: (idx: number) => void
    onMove: (idx: number, dir: -1 | 1) => void
    configOpen: boolean
    onConfigOpen: () => void
    onConfigClose: () => void
    fetchDistinctValues?: (col: string, selectLimit: number, fromLimit?: number) => Promise<{ values: string[]; hasMore: boolean }>
    otherStepNames: string[]
}) {
    const [pendingDelete, setPendingDelete] = useState(false)
    const summary = stepSummary(step)
    const customName = step.name?.trim()
    const hasDesc = !!step.description?.trim()

    return (
        <>
            <div className="border border-border rounded bg-card text-card-foreground">
                <div className="flex items-center gap-1.5 px-2 py-1.5 select-none">

                    {/* Bouton œil */}
                    <button
                        onClick={e => { e.stopPropagation(); onEyeToggle() }}
                        className={`shrink-0 w-5 h-5 flex items-center justify-center rounded transition-colors ${eyeOpen ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                        title={eyeOpen ? 'Masquer l\'aperçu' : 'Voir l\'aperçu de cette étape'}
                    >
                        {eyeLoading && eyeOpen
                            ? <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                            : <EyeIcon open={eyeOpen} className="w-3.5 h-3.5" />
                        }
                    </button>

                    <span className="text-xs text-muted-foreground font-mono w-4 shrink-0">{index + 1}.</span>
                    {/* Nom + résumé — clic ouvre la config */}
                    <button className="flex-1 text-left min-w-0" onClick={onConfigOpen}>
                        <div className="flex items-center gap-1 flex-wrap">
                            <span className="text-xs font-medium">{STEP_LABELS[step.type]}</span>
                            {customName && (
                                <span className="text-[10px] font-mono text-primary/80 bg-primary/10 px-1 rounded leading-4 shrink-0" title="Nom de la sous-requête">{customName}</span>
                            )}
                            {hasDesc && !customName && (
                                <span className="text-muted-foreground opacity-60" title={step.description}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                                </span>
                            )}
                        </div>
                        {hasDesc ? (
                            <span className="block text-xs text-muted-foreground truncate italic">{step.description}</span>
                        ) : (
                            summary && summary !== '—' && (
                                <span className="block text-xs text-muted-foreground truncate">{summary}</span>
                            )
                        )}
                    </button>

                    <div className="flex items-center gap-0.5 ml-1 shrink-0">
                        {pendingDelete ? (
                            <div className="flex items-center gap-1">
                                <span className="text-xs text-destructive">Supprimer ?</span>
                                <button onClick={() => { onRemove(index); setPendingDelete(false) }}
                                    className="px-1.5 h-5 rounded bg-destructive text-destructive-foreground text-xs">Oui</button>
                                <button onClick={() => setPendingDelete(false)}
                                    className="px-1.5 h-5 rounded border border-border text-xs text-muted-foreground hover:text-foreground">Non</button>
                            </div>
                        ) : (
                            <>
                                {/* Roue crantée — ouvre la modale de config */}
                                <button onClick={onConfigOpen}
                                    className="text-muted-foreground hover:text-foreground w-6 h-6 flex items-center justify-center rounded hover:bg-muted transition-colors"
                                    title="Configurer ce step">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                                    </svg>
                                </button>
                                <button onClick={() => onMove(index, -1)} disabled={index === 0}
                                    className="text-muted-foreground hover:text-foreground disabled:opacity-30 w-5 h-5 flex items-center justify-center text-xs" title="Monter">▲</button>
                                <button onClick={() => onMove(index, 1)} disabled={index === totalSteps - 1}
                                    className="text-muted-foreground hover:text-foreground disabled:opacity-30 w-5 h-5 flex items-center justify-center text-xs" title="Descendre">▼</button>
                                <button onClick={() => setPendingDelete(true)}
                                    className="text-destructive hover:text-destructive/80 w-5 h-5 flex items-center justify-center text-xs" title="Supprimer ce step">✕</button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {configOpen && (
                <StepConfigModal step={step} index={index}
                    availableCols={availableCols} availableColTypes={availableColTypes}
                    onUpdate={onUpdate} onClose={onConfigClose}
                    fetchDistinctValues={fetchDistinctValues}
                    otherStepNames={otherStepNames} />
            )}
        </>
    )
}

// ─── SourceStepItem / SourceConfigModal ───────────────────────────────────────


