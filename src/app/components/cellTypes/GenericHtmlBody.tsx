import {useEffect, useRef} from 'react'
import {useShallow} from 'zustand/react/shallow'
import {useNotebookStore} from '../../store/notebookStore'
import {SqlEditorWidget} from '../SqlEditorWidget'
import {ResultInfo} from './shared'
import type {CellBodyBaseProps} from './types'

export const GenericHtmlBody: React.FC<CellBodyBaseProps> = ({ cell, path, cellIndex }) => {
    const { devMode, showSqlEditorVisible } = useNotebookStore(useShallow(s => ({
        devMode: s.devMode,
        showSqlEditorVisible: s.showSqlEditorVisible
    })))
    const contentRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (contentRef.current && cell._renderedHtml) {
            contentRef.current.innerHTML = cell._renderedHtml
        }
    }, [cell._renderedHtml])

    return (
        <div>
            {showSqlEditorVisible?.(cell) && (
                <SqlEditorWidget cell={cell} path={path} cellIndex={cellIndex}
                    placeholder="SELECT 1" />
            )}
            <div ref={contentRef}></div>
            <ResultInfo cell={cell} devOnly />
        </div>
    )
}

