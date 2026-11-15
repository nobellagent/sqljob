/**
 * Rendu du body d'une cellule.
 *
 * La mise en page (hauteur, squelette, bouton « groupe enfant ») est ici ;
 * le contenu vient du registre `cellTypes/registry`, qui associe un composant
 * à chaque type de cellule.
 */
import { useShallow } from 'zustand/react/shallow'
import { useNotebookStore } from '../store/notebookStore'
import { Icon } from '../../lib/icons'
import type { NotebookCell } from '../store/types'
import type { CellBodyBaseProps } from './cellTypes/types'
import { CellBodySkeleton } from './cellTypes/shared'
import { getCellBody } from './cellTypes/registry'
import './UniverSheetElement'

type CellBodyProps = CellBodyBaseProps & { group: NotebookCell | Record<string, unknown> }

export const CellBody: React.FC<CellBodyProps> = ({ cell, path, cellIndex }) => {
    const {
        devMode,
        hasCellHeight, getCellHeightVars,
        bodyDisplayShouldShowSkeleton, bodyDisplayShouldShowContent,
        openChildGroupModal,
    } = useNotebookStore(useShallow(s => ({
        devMode: s.devMode,
        hasCellHeight: s.hasCellHeight,
        getCellHeightVars: s.getCellHeightVars,
        bodyDisplayShouldShowSkeleton: s.bodyDisplayShouldShowSkeleton,
        bodyDisplayShouldShowContent: s.bodyDisplayShouldShowContent,
        openChildGroupModal: s.openChildGroupModal,
    })))

    const hasHeight = hasCellHeight(cell)
    const heightVars = getCellHeightVars(cell)
    const showSkeleton = bodyDisplayShouldShowSkeleton?.(cell)
    const showContent = bodyDisplayShouldShowContent?.(cell)
    const Body = getCellBody(cell.type)

    return (
        <div
            className={`pt-1 pb-1 pl-2 pr-2 relative flex-1 flex flex-col min-h-0 cell-body ${hasHeight ? 'cell-body-has-height' : ''}`}
            style={heightVars ? Object.fromEntries(heightVars.split(';').filter(Boolean).map((s: string) => s.split(':'))) : undefined}
        >
            {showSkeleton && <CellBodySkeleton />}
            {showContent && (
                <div className="flex-1 flex flex-col min-h-0">
                    {Body
                        ? <Body cell={cell} path={path} cellIndex={cellIndex} showTextResult />
                        : null}
                    {/* Client mode: bouton pour ouvrir childGroup */}
                    {!devMode && cell.childGroupId && (
                        <div className="absolute top-2 right-2">
                            <button className="inline-flex items-center justify-center px-2 py-1 rounded text-sm border border-border hover:bg-muted"
                                onClick={() => openChildGroupModal(path, cellIndex)}
                                title="Ouvrir le groupe enfant">
                                <Icon name="export-notes-outline-sharp" size={16} />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
