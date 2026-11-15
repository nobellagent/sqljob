import {useEffect, useRef} from 'react'
import {useNotebookStore} from '../../store/notebookStore'
import {ConfigManager} from '../../../lib/ConfigManager'
import {CDNManager} from '../../../lib/CDNManager'
import {ResultInfo} from './shared'
import type {CellBodyBaseProps} from './types'

export const MarkdownBody: React.FC<CellBodyBaseProps> = ({ cell, path, cellIndex }) => {
    const devMode = useNotebookStore(s => s.devMode)
    const updateCellById = useNotebookStore(s => s.updateCellById)
    // Instance EasyMDE locale : un objet d'éditeur n'a rien à faire dans le document.
    const editorInstanceRef = useRef<any>(null)
    const easyMDERef = useRef<HTMLTextAreaElement>(null)
    const hasCellHeight = useNotebookStore(s => s.hasCellHeight)

    useEffect(() => {
        const el = easyMDERef.current
        if (!el) return
        let inst: any = null
        const engine = ConfigManager.getCellEngine(cell, 'main')
        const isReadOnly = engine !== 'text'

        CDNManager.loadEasyMDE().then(() => {
            if (!el.parentElement) return
            if (editorInstanceRef.current) {
                try { editorInstanceRef.current.toTextArea() } catch (_) {}
                editorInstanceRef.current = null
            }
            inst = new (window as any).EasyMDE({
                element: el,
                spellChecker: false,
                status: false,
                toolbar: (isReadOnly || !devMode) ? false : ['bold', 'italic', 'heading', '|', 'quote', 'unordered-list', 'ordered-list', '|', 'link', 'image', '|', 'preview', '|', 'guide'],
                readOnly: isReadOnly,
                minHeight: hasCellHeight(cell) ? '100%' : '50px',
                autorefresh: { delay: 200 }
            })
            const cm = inst.codemirror || inst.cm
            if (cm && isReadOnly) cm.setOption('readOnly', true)
            if (cm && !isReadOnly) {
                cm.on('change', () => {
                    const value = inst.value()
                    updateCellById(cell._id, (c: any) => ConfigManager.setCellEditableContent(c, value))
                })
            }
            editorInstanceRef.current = inst
            // En clientMode explicitement (devMode === false) : basculer en preview par défaut
            // En devMode (true) ou état indéterminé (null) : rester en mode édition
            if (devMode === false && typeof inst.togglePreview === 'function') {
                try { inst.togglePreview() } catch (_) {}
            }
            setTimeout(() => {
                el.closest('.easymde-client')?.classList.add('easymde-ready')
                if (cm?.refresh) cm.refresh()
            }, 100)
        })
        return () => {
            if (inst) { try { inst.toTextArea() } catch (_) {} }
            if (editorInstanceRef.current === inst) editorInstanceRef.current = null
        }
    }, [cell._id, devMode])

    return (
        <div className={hasCellHeight(cell) ? 'flex-1 min-h-0 flex flex-col' : ''}>
            <ResultInfo cell={cell} devOnly />
            <div className={`easymde-client ${hasCellHeight(cell) ? 'flex-1 min-h-0 flex flex-col' : ''}`}>
                <textarea
                    ref={easyMDERef}
                    defaultValue={ConfigManager.getCellContentDisplay(cell) || ''}
                />
            </div>
        </div>
    )
}

