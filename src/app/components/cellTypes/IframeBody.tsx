import {useEffect, useRef} from 'react'
import {useShallow} from 'zustand/react/shallow'
import {useNotebookStore} from '../../store/notebookStore'
import {SqlEditorWidget} from '../SqlEditorWidget'
import {ResultInfo} from './shared'
import type {CellBodyBaseProps} from './types'

export const IframeBody: React.FC<CellBodyBaseProps> = ({ cell, path, cellIndex }) => {
    const { devMode, hasCellHeight, showSqlEditorVisible } = useNotebookStore(useShallow(s => ({
        devMode: s.devMode,
        hasCellHeight: s.hasCellHeight,
        showSqlEditorVisible: s.showSqlEditorVisible,
    })))

    const iframeRef = useRef<HTMLIFrameElement>(null)

    useEffect(() => {
        const iframe = iframeRef.current
        if (!iframe || !cell._htmlContent) return
        const doc = iframe.contentDocument || iframe.contentWindow?.document
        if (doc) {
            doc.open()
            doc.write(cell._htmlContent)
            doc.close()
        }
    }, [cell._htmlContent])

    const hasHeight = hasCellHeight(cell)

    return (
        <div className={hasHeight ? 'flex-1 min-h-0 flex flex-col' : ''}>
            {showSqlEditorVisible?.(cell) && (
                <SqlEditorWidget cell={cell} path={path} cellIndex={cellIndex}
                    placeholder="SELECT '<h1>Hello</h1>'" />
            )}
            <iframe
                ref={iframeRef}
                sandbox="allow-scripts allow-same-origin"
                className={`w-full border-0 ${hasHeight ? 'flex-1' : 'min-h-[200px]'}`}
            />
            <ResultInfo cell={cell} devOnly />
        </div>
    )
}

