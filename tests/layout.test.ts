import {describe, expect, it} from 'vitest'
import {resolvePanelIdentity} from '@sqlrooms/layout/dist/resolvePanelIdentity.js'
import type {LayoutConfig} from '@sqlrooms/room-shell'

/**
 * Régression : en 0.29, `resolvePanelIdentity` ignore `id` et exige `panel`.
 * Un nœud `{type:'panel', id:'main'}` sans `panel` ne rend rien du tout.
 */
const defaultLayout: LayoutConfig = {
    type: 'panel',
    id: 'main',
    panel: 'main',
}

describe('layout 0.29', () => {
    it('résout le panneau principal depuis le layout par défaut', () => {
        expect(resolvePanelIdentity(defaultLayout as never)).toEqual({panelId: 'main', meta: undefined})
    })

    it('ne résout rien si panel est absent (piège de la 0.29)', () => {
        expect(resolvePanelIdentity({type: 'panel', id: 'main'} as never)).toEqual({panelId: null, meta: undefined})
    })

    it('résout les deux panneaux d’un split', () => {
        const split = {
            type: 'split',
            id: 'root',
            direction: 'row',
            children: [
                {type: 'panel', id: 'data', panel: 'data', defaultSize: '28%'},
                {type: 'panel', id: 'main', panel: 'main'},
            ],
        }
        const ids = (split.children as never[]).map(child => resolvePanelIdentity(child).panelId)
        expect(ids).toEqual(['data', 'main'])
    })
})
