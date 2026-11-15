import {useRef, useState} from 'react'
import {useShallow} from 'zustand/react/shallow'
import {useNotebookStore} from '../../store/notebookStore'
import {SqlEditorWidget} from '../SqlEditorWidget'
import {Icon} from '../../../lib/icons'
import {Accordion, AccordionItem, AccordionTrigger, AccordionContent} from '@sqlrooms/ui'
import { ResultInfo } from './shared'
import type {CellBodyBaseProps} from './types'

export const PublipostageWordBody: React.FC<CellBodyBaseProps> = ({ cell, path, cellIndex }) => {
    const {
        handleDocxTemplateDrop, handleDocxTemplateFileSelect,
        downloadDocxTemplate, removeDocxTemplate,
        runCellAt, isLoading, devMode
    } = useNotebookStore(useShallow(s => ({
        handleDocxTemplateDrop: s.handleDocxTemplateDrop,
        handleDocxTemplateFileSelect: s.handleDocxTemplateFileSelect,
        downloadDocxTemplate: s.downloadDocxTemplate,
        removeDocxTemplate: s.removeDocxTemplate,
        runCellAt: s.runCellAt,
        isLoading: s.isLoading,
        devMode: s.devMode
    })))

    const inputRef = useRef<HTMLInputElement>(null)
    const [isDragging, setIsDragging] = useState(false)

    return (
        <div className="flex flex-col gap-3">
            <div
                className={`flex items-center justify-center rounded-lg transition-all duration-200 mt-1 mb-1 ${cell.docxTemplateFileName
                    ? 'border-2 border-solid border-green-500 bg-green-500/10 cursor-default'
                    : isDragging
                        ? 'border-2 border-solid border-accent bg-accent/10 cursor-pointer'
                        : 'border-2 border-dashed border-primary bg-primary/5 cursor-pointer hover:border-accent hover:bg-accent/10'
                    }`}
                onClick={() => !cell.docxTemplateFileName && inputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={e => { e.preventDefault(); setIsDragging(false) }}
                onDrop={e => { e.preventDefault(); setIsDragging(false); handleDocxTemplateDrop(e, path, cellIndex) }}
            >
                {!cell.docxTemplateFileName ? (
                    <div key="no-file" className="text-center p-1">
                        <Icon name="description" size={64} />
                        <p className="m-0 text-muted-foreground text-sm">Glissez-déposez votre template Word (.docx)</p>
                        <p className="mt-0 mb-0 text-accent text-xs font-semibold">Template de publipostage</p>
                    </div>
                ) : (
                    <div key="has-file" className="flex flex-wrap items-center gap-3 px-4 py-3 w-full">
                        <Icon name="check-circle" size={20} className="text-green-600" />
                        <span className="flex-1 text-green-600 font-medium truncate">{cell.docxTemplateFileName}</span>
                        <button className="inline-flex items-center justify-center p-2 rounded hover:bg-muted" onClick={e => { e.stopPropagation(); downloadDocxTemplate(path, cellIndex) }} title="Télécharger">
                            <Icon name="download" size={20} />
                        </button>
                        <button className="inline-flex items-center justify-center p-2 rounded hover:bg-destructive/10 text-destructive" onClick={e => { e.stopPropagation(); removeDocxTemplate(path, cellIndex) }} title="Supprimer">
                            <Icon name="close" size={24} />
                        </button>
                    </div>
                )}
                <input ref={inputRef} type="file" hidden accept=".docx"
                    onChange={e => handleDocxTemplateFileSelect(e, path, cellIndex)} />
            </div>
            {devMode && (
                <Accordion type="multiple" className="mt-1">
                    <AccordionItem value="data">
                        <AccordionTrigger className="text-sm font-semibold text-primary py-1">
                            Requête de données
                        </AccordionTrigger>
                        <AccordionContent>
                            <SqlEditorWidget cell={cell} path={path} cellIndex={cellIndex}
                                queryType="query" />
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="filename">
                        <AccordionTrigger className="text-sm font-semibold text-primary py-1">
                            <span className="flex items-center gap-2">
                                <span>Requête de nom de fichier</span>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                                    <Icon name="storage" size={14} />
                                    SQL
                                </span>
                            </span>
                        </AccordionTrigger>
                        <AccordionContent>
                            <SqlEditorWidget cell={cell} path={path} cellIndex={cellIndex}
                                queryType="query2" />
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            )}
            {cell.buttonLabel && (
                <div className="flex justify-center">
                    <button
                        className="inline-flex items-center justify-center px-4 py-1.5 rounded text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                        onClick={() => runCellAt(path, cellIndex)}
                        disabled={isLoading || !cell.docxTemplateFileName}
                    >
                        <span>{cell.buttonLabel}</span>
                    </button>
                </div>
            )}
            <ResultInfo cell={cell} devOnly />
        </div>
    )
}

