import { RejectErrorsModal } from './shared'
import {useRef, useState} from 'react'
import {useShallow} from 'zustand/react/shallow'
import {useNotebookStore} from '../../store/notebookStore'
import {SqlEditorWidget} from '../SqlEditorWidget'
import {Icon} from '../../../lib/icons'
import {Accordion, AccordionItem, AccordionTrigger, AccordionContent} from '@sqlrooms/ui'
import type {CellBodyBaseProps} from './types'

export const SourceBody: React.FC<CellBodyBaseProps> = ({ cell, path, cellIndex }) => {
    const {
        handleSingleSourceDrop, handleSingleSourceFileSelect,
        downloadSourceFile, removeSingleSourceFile, devMode, forceUpdate
    } = useNotebookStore(useShallow(s => ({
        handleSingleSourceDrop: s.handleSingleSourceDrop,
        handleSingleSourceFileSelect: s.handleSingleSourceFileSelect,
        downloadSourceFile: s.downloadSourceFile,
        removeSingleSourceFile: s.removeSingleSourceFile,
        devMode: s.devMode,
        forceUpdate: s.forceUpdate
    })))

    const inputRef = useRef<HTMLInputElement>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [rejectModalOpen, setRejectModalOpen] = useState(false)

    const isFallback = !!cell._loadedViaFallback
    const mainError = cell._mainQueryError || null
    const fallbackError = cell._fallbackQueryError || null
    const rejectCount = cell._rejectErrorsCount ?? 0
    const rejectedCellsCount = cell._rejectedCellsCount ?? 0
    const rowCount = cell._rowCount ?? null
    const queryBuilder = cell._queryBuilder || null

    const fileBorderClass = isFallback
        ? 'border-2 border-solid border-orange-500 bg-orange-500/10 cursor-default'
        : 'border-2 border-solid border-green-500 bg-green-500/10 cursor-default'
    const fileColor = isFallback ? 'text-orange-600' : 'text-green-600'
    const fileIcon = isFallback ? 'warning' : 'check-circle'

    return (
        <div className="flex flex-col gap-2">
            <div
                className={`flex items-center justify-center rounded-lg transition-all duration-200 mt-1 mb-1 min-h-[20px] ${cell._fileName
                    ? fileBorderClass
                    : isDragging
                        ? 'border-2 border-solid border-accent bg-accent/10 cursor-pointer'
                        : 'border-2 border-dashed border-primary bg-primary/5 cursor-pointer hover:border-accent hover:bg-accent/10'
                    }`}
                onClick={() => !cell._fileName && inputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={e => { e.preventDefault(); setIsDragging(false) }}
                onDrop={e => { e.preventDefault(); setIsDragging(false); handleSingleSourceDrop(e, path, cellIndex) }}
            >
                {!cell._fileName ? (
                    // key distinct : force React à démonter/remonter au lieu de recycler le nœud DOM.
                    // Sans ça, iconify ayant remplacé les <span> par des <svg> hors du VDOM React,
                    // React ne sait pas les supprimer → l'ancienne icône persiste après suppression.
                    <div key="no-file" className="flex flex-col items-center gap-1 py-2 w-full">
                        <Icon name="create-new-folder" size={48} />
                        {cell._importFailed && (
                            <p className="m-0 text-destructive text-sm font-semibold">L'import a échoué.</p>
                        )}
                        <p className="m-0 text-muted-foreground text-sm">{cell.title || 'Glissez-déposez ici'}</p>
                        <p className="mt-0 mb-0 text-accent text-xs font-semibold">→ {cell.name}</p>
                    </div>
                ) : (
                    <div key="has-file" className="flex flex-wrap items-center gap-3 px-4 py-3 w-full">
                        <span className={`inline-flex items-center ${fileColor}`}><Icon name={fileIcon} size={20} /></span>
                        <span className={`flex-1 ${fileColor} font-medium truncate`}>{cell._fileName}</span>
                        {rowCount !== null && (
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-semibold bg-muted ${fileColor}`}>
                                <Icon name="check-circle" size={14} />
                                {rowCount.toLocaleString()} ligne{rowCount !== 1 ? 's' : ''} intégrée{rowCount !== 1 ? 's' : ''}
                            </span>
                        )}
                        {cell._fileName && (
                            <button
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-semibold ${rejectCount > 0 ? 'bg-destructive/10 text-destructive hover:bg-destructive/20' : 'bg-muted text-muted-foreground'}`}
                                onClick={e => { e.stopPropagation(); setRejectModalOpen(true) }}
                                title="Voir les lignes rejetées"
                            >
                                <Icon name={rejectCount > 0 ? 'warning' : 'check-circle'} size={14} />
                                {rejectCount} ligne{rejectCount !== 1 ? 's' : ''} non intégrée{rejectCount !== 1 ? 's' : ''}
                            </button>
                        )}
                        {cell._fileName && rejectedCellsCount > 0 && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-semibold bg-orange-500/10 text-orange-600">
                                <Icon name="warning" size={14} />
                                {rejectedCellsCount.toLocaleString()} cellule{rejectedCellsCount !== 1 ? 's' : ''} non intégrée{rejectedCellsCount !== 1 ? 's' : ''}
                            </span>
                        )}
                        <span className="text-muted-foreground text-xs">→ {cell.name}</span>
                        <button className="inline-flex items-center justify-center p-2 rounded hover:bg-muted" onClick={e => { e.stopPropagation(); downloadSourceFile(path, cellIndex) }} title="Télécharger">
                            <Icon name="download" size={20} />
                        </button>
                        <button className="inline-flex items-center justify-center p-2 rounded hover:bg-destructive/10 text-destructive" onClick={e => { e.stopPropagation(); removeSingleSourceFile(path, cellIndex) }} title="Supprimer">
                            <Icon name="close" size={24} />
                        </button>
                    </div>
                )}
                <input ref={inputRef} type="file" hidden accept=".csv,.parquet,.xlsx,.xls"
                    onChange={e => handleSingleSourceFileSelect(e, path, cellIndex)} />
            </div>
            {rejectModalOpen && <RejectErrorsModal open={rejectModalOpen} onClose={() => setRejectModalOpen(false)} />}
            {devMode && (
                <Accordion type="single" collapsible className="mt-1">
                    <AccordionItem value="import">
                        <AccordionTrigger className="text-sm font-semibold text-primary py-1">
                            Requête d'import
                        </AccordionTrigger>
                        <AccordionContent>
                            {mainError && (
                                <div className="mb-2 p-2 rounded bg-destructive/10 border border-destructive/30 text-xs text-destructive">
                                    <span className="font-semibold">Erreur :</span>{' '}
                                    <span className="font-mono break-all">{mainError}</span>
                                </div>
                            )}
                            <SqlEditorWidget cell={cell} path={path} cellIndex={cellIndex}
                                queryType="query"                                applySourceDefaultIfEmpty={true} />
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="fallback">
                        <AccordionTrigger className="text-sm font-semibold text-primary py-1">
                            Requête de fallback (si erreur)
                        </AccordionTrigger>
                        <AccordionContent>
                            {fallbackError && (
                                <div className="mb-2 p-2 rounded bg-destructive/10 border border-destructive/30 text-xs text-destructive">
                                    <span className="font-semibold">Erreur :</span>{' '}
                                    <span className="font-mono break-all">{fallbackError}</span>
                                </div>
                            )}
                            <SqlEditorWidget cell={cell} path={path} cellIndex={cellIndex}
                                queryType="query2"                                applySourceDefaultIfEmpty={true} />
                        </AccordionContent>
                    </AccordionItem>
                    {queryBuilder && (
                        <AccordionItem value="query-builder">
                            <AccordionTrigger className="text-sm font-semibold text-primary py-1">
                                Exemple requête stable
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="relative">
                                    <pre className="text-xs font-mono bg-muted rounded p-3 overflow-x-auto whitespace-pre-wrap break-all">{queryBuilder}</pre>
                                    <button
                                        className="absolute top-2 right-2 p-1 rounded hover:bg-muted-foreground/20"
                                        title="Copier"
                                        onClick={() => navigator.clipboard.writeText(queryBuilder)}
                                    >
                                        <Icon name="copy" size={14} />
                                    </button>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    )}
                </Accordion>
            )}
        </div>
    )
}

