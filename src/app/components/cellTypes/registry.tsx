/**
 * Registre des corps de cellule : un composant par type.
 *
 * Ajouter un type de cellule = un fichier dans ce dossier + une entrée ici.
 * `CellBody` ne fait plus que la mise en page (squelette, hauteur, groupe enfant).
 */
import type {ComponentType} from 'react'
import type {CellBodyBaseProps} from './types'
import {MarkdownBody} from './MarkdownBody'
import {SourceBody} from './SourceBody'
import {ButtonRunBody} from './ButtonRunBody'
import {SqlTableBody} from './SqlTableBody'
import {IframeBody} from './IframeBody'
import {SqlStatBody} from './SqlStatBody'
import {UiParameterBody} from './UiParameterBody'
import {PublipostageWordBody} from './PublipostageWordBody'
import {PdfmeBody} from './PdfmeBody'
import {PerspectiveBody} from './PerspectiveBody'
import {UniverSheetBody} from './UniverSheetBody'
import {PivotBody} from './PivotBody'

/** Un corps reçoit la cellule, son chemin, son index et des options de rendu. */
export type CellBodyComponent = ComponentType<CellBodyBaseProps & {showTextResult?: boolean}>

export const CELL_BODIES: Record<string, CellBodyComponent> = {
    markdown: MarkdownBody,
    source: SourceBody,
    buttonRunNextCells: ButtonRunBody,
    sql: SqlTableBody,
    iframe: IframeBody,
    sqlStat: SqlStatBody,
    pivot: PivotBody as CellBodyComponent,
    uiParameter: UiParameterBody,
    publipostageWord: PublipostageWordBody,
    pdfme: PdfmeBody,
    perspective: PerspectiveBody,
    univerSheet: UniverSheetBody,
}

/** Retourne le corps à rendre pour un type de cellule, ou `null` si inconnu. */
export function getCellBody(type: string): CellBodyComponent | null {
    return CELL_BODIES[type] ?? null
}
