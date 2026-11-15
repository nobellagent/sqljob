import 'fake-indexeddb/auto'
import {beforeEach, describe, expect, it} from 'vitest'
import {clearProject, loadProject, saveProject} from '../src/app/store/projectPersistence'
import type {NotebookPage} from '../src/app/store/types'

const pages = [
    {
        name: 'Analyse',
        groups: [
            {id: 'g1', type: 'core', cells: [{type: 'sql', name: 'Q1', query: 'SELECT 1'}]},
        ],
    },
] as unknown as NotebookPage[]

describe('persistance du projet (IndexedDB)', () => {
    beforeEach(async () => {
        await clearProject()
    })

    it('renvoie null quand aucun document n’est persisté', async () => {
        await expect(loadProject()).resolves.toBeNull()
    })

    it('relit ce qui a été écrit', async () => {
        await expect(saveProject(pages)).resolves.toBe(true)
        const restored = await loadProject()
        expect(restored).not.toBeNull()
        expect(restored?.[0]?.name).toBe('Analyse')
        expect(restored?.[0]?.groups[0]?.cells[0]).toMatchObject({type: 'sql', query: 'SELECT 1'})
    })

    it('écrase le document précédent au lieu de l’empiler', async () => {
        await saveProject(pages)
        const other = [{name: 'Seconde', groups: []}] as unknown as NotebookPage[]
        await saveProject(other)

        const restored = await loadProject()
        expect(restored).toHaveLength(1)
        expect(restored?.[0]?.name).toBe('Seconde')
    })

    it('ignore un document vide', async () => {
        await saveProject([] as NotebookPage[])
        await expect(loadProject()).resolves.toBeNull()
    })

    it('supprime le document', async () => {
        await saveProject(pages)
        await clearProject()
        await expect(loadProject()).resolves.toBeNull()
    })
})
