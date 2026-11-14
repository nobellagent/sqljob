import { describe, expect, it } from 'vitest'
import { parseColumnRoles } from '../src/lib/EChartSqlParser'

describe('EChartSqlParser — parseColumnRoles', () => {
    it('retourne un rôle vide sans résultat', () => {
        expect(parseColumnRoles([])).toEqual({roles: [], roleMap: {}, chartType: 'unknown'})
    })

    it('reconnaît les rôles exacts', () => {
        const parsed = parseColumnRoles([{mois: '2026-01', total: 12, XAXIS: 'a', BARCHART: 3}])
        const roles = parsed.roles.map(r => r.role).sort()
        expect(roles).toEqual(['BARCHART', 'XAXIS'])
        expect(parsed.chartType).toBe('bar')
    })

    it('reconnaît les rôles en suffixe et extrait le libellé', () => {
        const parsed = parseColumnRoles([{CA_XAXIS: 'janvier', Ventes_BARCHART: 10}])
        const byRole = Object.fromEntries(parsed.roles.map(r => [r.role, r.displayName]))
        expect(byRole).toEqual({XAXIS: 'CA', BARCHART: 'Ventes'})
        expect(parsed.chartType).toBe('bar')
    })

    it('détecte un graphique combiné bar + line', () => {
        const parsed = parseColumnRoles([{XAXIS: 'a', BARCHART: 1, LINECHART: 2}])
        expect(parsed.chartType).toBe('bar_line')
    })

    it('détecte une barre horizontale quand YAXIS remplace XAXIS', () => {
        const parsed = parseColumnRoles([{YAXIS: 'a', BARCHART: 1}])
        expect(parsed.chartType).toBe('bar_horizontal')
    })

    it('ignore les colonnes sans rôle', () => {
        const parsed = parseColumnRoles([{XAXIS: 'a', BARCHART: 1, bruit: 'x'}])
        expect(parsed.roles.map(r => r.originalName)).not.toContain('bruit')
    })

    it('donne la priorité au type DuckDB sur le nom de colonne', () => {
        const parsed = parseColumnRoles([{Label: 'x'}], {Label: 'XAXIS'})
        expect(parsed.roles[0]).toMatchObject({originalName: 'Label', role: 'XAXIS', displayName: 'Label'})
    })
})
