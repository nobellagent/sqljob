/**
 * Mises à jour immuables de l'arbre du document (pages → groupes → cellules).
 *
 * Chaque fonction prend l'état courant et rend un nouvel état : les branches
 * non touchées gardent leur identité, les branches modifiées sont recréées.
 * C'est ce qui remplace le couple « mutation en place + compteur de version » : React voit
 * le changement par référence, sans compteur de version.
 */
import { produce } from 'immer'

type AnyState = Record<string, any>

/** Groupe visé par un chemin, dans un état (ou un brouillon immer). */
export function getGroupInState(state: AnyState, path: number[] | undefined): any | null {
    if (!path || path.length === 0) return null

    // Chemin -1 : groupe ouvert dans la modale « groupe enfant »
    if (path[0] === -1) {
        const modalGroup = state.childGroupModal?.group
        if (!modalGroup) return null
        if (path.length === 1) return modalGroup
        let current = modalGroup
        for (let i = 1; i < path.length; i++) {
            current = current?.children?.[path[i]]
            if (!current) return null
        }
        return current
    }

    const page = state.pages?.[state.activePageIndex ?? 0]
    let current = page?.groups?.[path[0]]
    for (let i = 1; i < path.length; i++) {
        current = current?.children?.[path[i]]
        if (!current) return null
    }
    return current ?? null
}

/** Alias lisible quand la fonction s'applique à un brouillon immer. */
export const getGroupInDraft = getGroupInState

/** Cellule visée par un chemin de groupe et un index. */
export function getCellInState(state: AnyState, path: number[] | undefined, cellIndex: number): any | null {
    const group = getGroupInState(state, path)
    return group?.cells?.[cellIndex] ?? null
}

/** Cellule portant cet `_id`, où qu'elle soit dans le document. */
export function getCellByIdInState(state: AnyState, cellId: string): any | null {
    const visit = (group: any): any => {
        if (!group) return null
        const found = (group.cells ?? []).find((c: any) => c?._id === cellId)
        if (found) return found
        for (const child of group.children ?? []) {
            const nested = visit(child)
            if (nested) return nested
        }
        return null
    }
    for (const page of state.pages ?? []) {
        for (const group of page.groups ?? []) {
            const found = visit(group)
            if (found) return found
        }
    }
    return null
}

/** Alias lisible quand la fonction s'applique à un brouillon immer. */
export const getCellByIdInDraft = getCellByIdInState

/**
 * Copie de travail d'une cellule pour une exécution asynchrone.
 *
 * Le code d'exécution écrit librement sur cette copie (statut, résultats,
 * tables Arrow…) puis la valide d'un bloc dans l'état via `commitCellInState`.
 * Les objets non simples (tables Arrow, workers) sont conservés par référence :
 * immer ne les gèle pas, ils ne sont donc pas dupliqués.
 */
export function cloneCellForExecution(cell: any): any {
    return { ...cell }
}

/** Recopie une copie de travail dans l'état, à l'emplacement de son `_id`. */
export function commitCellInState(state: AnyState, cell: any): AnyState {
    if (!cell?._id) return state
    return updateCellByIdInState(state, cell._id, (draft) => {
        Object.assign(draft, cell)
    })
}

/** Alias lisible quand la fonction s'applique à un brouillon immer. */
export const getCellInDraft = getCellInState

/**
 * Applique `mutator` à une cellule.
 * Retourne l'état inchangé si le chemin ne mène à aucune cellule.
 */
export function updateCellInState(
    state: AnyState,
    path: number[] | undefined,
    cellIndex: number,
    mutator: (cell: any) => void
): AnyState {
    if (!getCellInState(state, path, cellIndex)) return state
    return produce(state, (draft: AnyState) => {
        const cell = getCellInState(draft, path, cellIndex)
        if (cell) mutator(cell)
    })
}

/** Applique `mutator` à un groupe. Retourne l'état inchangé si le chemin est vide. */
export function updateGroupInState(
    state: AnyState,
    path: number[] | undefined,
    mutator: (group: any) => void
): AnyState {
    if (!getGroupInState(state, path)) return state
    return produce(state, (draft: AnyState) => {
        const group = getGroupInState(draft, path)
        if (group) mutator(group)
    })
}

/** Applique `mutator` à la cellule portant cet `_id`, dans n'importe quelle page. */
export function updateCellByIdInState(
    state: AnyState,
    cellId: string,
    mutator: (cell: any) => void
): AnyState {
    const find = (group: any): boolean =>
        !!group && (
            (group.cells ?? []).some((c: any) => c?._id === cellId) ||
            (group.children ?? []).some((child: any) => find(child))
        )

    const exists = (state.pages ?? []).some((page: any) => (page.groups ?? []).some((g: any) => find(g)))
    if (!exists) return state

    return produce(state, (draft: AnyState) => {
        const visit = (group: any): void => {
            const cell = (group?.cells ?? []).find((c: any) => c?._id === cellId)
            if (cell) {
                mutator(cell)
                return
            }
            for (const child of group?.children ?? []) visit(child)
        }
        for (const page of draft.pages ?? []) {
            for (const group of page.groups ?? []) visit(group)
        }
    })
}
