/**
 * NotebookPanel — panneau principal du notebook sqljob.
 *
 * Le notebook custom (cells, DAG, pages, groupes) est l'unique implémentation.
 * L'ancien mode « notebook sqlrooms » expérimental a été retiré : il dupliquait
 * le modèle de cellules et n'apportait ni pages, ni groupes, ni conditions.
 */
import { RoomPanel } from '@sqlrooms/room-shell'
import { NotebookPanelSqljob } from './NotebookPanelSqljob'

export const NotebookPanel = () => (
    <RoomPanel showHeader={false} className="flex flex-col h-full">
        <NotebookPanelSqljob />
    </RoomPanel>
)
