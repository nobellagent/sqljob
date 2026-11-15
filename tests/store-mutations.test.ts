/**
 * Mises à jour immuables de l'arbre du document (pages → groupes → cellules).
 *
 * Ces fonctions sont pures : elles prennent un état et rendent un nouvel état.
 * Elles remplacent le couple « mutation en place + `_rev` » par un `produce()`
 * immer, ce qui rend les changements visibles par référence (et donc par React).
 */
import { describe, expect, it } from 'vitest'
import {
    getCellInState,
    getGroupInState,
    updateCellByIdInState,
    updateCellInState,
    updateGroupInState,
} from '../src/app/store/mutations'

/** Document minimal : une page, un groupe, une cellule. */
function makeState() {
    return {
        activePageIndex: 0,
        pages: [
            {
                _id: 'page-1',
                name: 'Feuille 1',
                groups: [
                    {
                        _id: 'group-1',
                        cells: [
                            { _id: 'cell-1', name: 'sql1', type: 'sql', json: { a: 1 } },
                            { _id: 'cell-2', name: 'sql2', type: 'sql', json: {} },
                        ],
                        children: [
                            {
                                _id: 'group-2',
                                cells: [{ _id: 'cell-3', name: 'nested', type: 'markdown', json: {} }],
                                children: [],
                            },
                        ],
                    },
                ],
            },
        ],
        childGroupModal: { group: null as any },
    } as any
}

describe('lecture dans un état', () => {
    it('trouve un groupe par chemin', () => {
        const state = makeState()
        expect(getGroupInState(state, [0])?._id).toBe('group-1')
        expect(getGroupInState(state, [0, 0])?._id).toBe('group-2')
        expect(getGroupInState(state, [5])).toBeNull()
    })

    it('trouve un groupe enfant par chemin -1', () => {
        const state = makeState()
        state.childGroupModal.group = { _id: 'modal-group', cells: [] }
        expect(getGroupInState(state, [-1])?._id).toBe('modal-group')
    })

    it('trouve une cellule par chemin et index', () => {
        const state = makeState()
        expect(getCellInState(state, [0], 1)?._id).toBe('cell-2')
        expect(getCellInState(state, [0, 0], 0)?._id).toBe('cell-3')
        expect(getCellInState(state, [0], 9)).toBeNull()
    })
})

describe('mises à jour immuables', () => {
    it('modifie une cellule sans toucher l’état précédent', () => {
        const before = makeState()
        const after = updateCellInState(before, [0], 0, (cell: any) => {
            cell.name = 'renamed'
            cell.json.a = 42
        })

        expect(after).not.toBe(before)
        expect(after.pages[0].groups[0].cells[0].name).toBe('renamed')
        expect(after.pages[0].groups[0].cells[0].json.a).toBe(42)
        // l'état d'origine est intact
        expect(before.pages[0].groups[0].cells[0].name).toBe('sql1')
        expect(before.pages[0].groups[0].cells[0].json.a).toBe(1)
        // les branches non touchées sont partagées
        expect(after.pages[0].groups[0].cells[1]).toBe(before.pages[0].groups[0].cells[1])
    })

    it('modifie un groupe imbriqué', () => {
        const before = makeState()
        const after = updateGroupInState(before, [0, 0], (group: any) => {
            group.loop = { enabled: true }
        })
        expect(after.pages[0].groups[0].children[0].loop.enabled).toBe(true)
        expect(before.pages[0].groups[0].children[0].loop).toBeUndefined()
    })

    it('retourne le même état quand le chemin est introuvable', () => {
        const before = makeState()
        expect(updateCellInState(before, [3], 0, () => undefined)).toBe(before)
        expect(updateGroupInState(before, [3], () => undefined)).toBe(before)
    })

    it('modifie une cellule par identifiant, où qu’elle soit', () => {
        const before = makeState()
        const after = updateCellByIdInState(before, 'cell-3', (cell: any) => {
            cell.json = { nested: true }
        })
        expect(after.pages[0].groups[0].children[0].cells[0].json.nested).toBe(true)
        expect(before.pages[0].groups[0].children[0].cells[0].json.nested).toBeUndefined()
    })

    it('ignore un identifiant inconnu', () => {
        const before = makeState()
        expect(updateCellByIdInState(before, 'inconnu', () => undefined)).toBe(before)
    })
})
