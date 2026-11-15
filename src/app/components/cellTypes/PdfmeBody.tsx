import {useShallow} from 'zustand/react/shallow'
import {useNotebookStore} from '../../store/notebookStore'
import {SqlEditorWidget} from '../SqlEditorWidget'
import {Icon} from '../../../lib/icons'
import {Accordion, AccordionItem, AccordionTrigger, AccordionContent} from '@sqlrooms/ui'
import { ResultInfo } from './shared'
import type {CellBodyBaseProps} from './types'

export const PdfmeBody: React.FC<CellBodyBaseProps> = ({ cell, path, cellIndex }) => {
    const { runCellAt, isLoading, devMode, forceUpdate } = useNotebookStore(useShallow(s => ({
        runCellAt: s.runCellAt,
        isLoading: s.isLoading,
        devMode: s.devMode,
        forceUpdate: s.forceUpdate
    })))

    return (
        <div className="flex flex-col gap-3">
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
                                <span>Requête nom de fichier PDF</span>
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
                    <AccordionItem value="json">
                        <AccordionTrigger className="text-sm font-semibold text-primary py-1">
                            <span className="flex items-center gap-2">
                                <span>Template pdfme (JSON)</span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-primary/10 text-primary">Layout</span>
                            </span>
                        </AccordionTrigger>
                        <AccordionContent>
                            <textarea
                                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono"
                                rows={10}
                                style={{ minHeight: '180px' }}
                                placeholder='{"basePdf": {...}, "schemas": [...]}'
                                value={(cell.json as unknown as string | undefined) || ''}
                                onChange={e => { cell.json = e.target.value as unknown as Record<string, unknown>; forceUpdate() }}
                            />
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            )}
            {cell.buttonLabel && (
                <div className="flex justify-center">
                    <button
                        className="inline-flex items-center justify-center px-4 py-1.5 rounded text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                        onClick={() => runCellAt(path, cellIndex)}
                        disabled={isLoading}
                    >
                        <span>{cell.buttonLabel}</span>
                    </button>
                </div>
            )}
            <ResultInfo cell={cell} devOnly />
        </div>
    )
}

