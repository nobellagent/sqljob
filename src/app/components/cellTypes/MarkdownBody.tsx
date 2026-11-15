import {useEffect, useRef} from 'react'
import {useNotebookStore} from '../../store/notebookStore'
import {ConfigManager} from '../../../lib/ConfigManager'
import {CDNManager} from '../../../lib/CDNManager'
import {ResultInfo} from './shared'
import type {CellBodyBaseProps} from './types'

export const MarkdownBody: React.FC<CellBodyBaseProps> = ({ cell, path, cellIndex }) => {
    const devMode = useNotebookStore(s => s.devMode)
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
            if (cell._easyMDEcli) {
                try { (cell._easyMDEcli as any).toTextArea() } catch (_) {}
                cell._easyMDEcli = null
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
                    ConfigManager.setCellEditableContent(cell, inst.value())
                })
            }
            cell._easyMDEcli = inst
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
            if (cell._easyMDEcli === inst) cell._easyMDEcli = null
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

