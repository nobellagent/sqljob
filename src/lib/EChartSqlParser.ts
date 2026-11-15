/**
 * Façade publique du parseur ECharts.
 *
 * L'implémentation est découpée dans `./echart/` : rôles de colonnes, thème,
 * helpers, puis un module par famille de graphique. Ce fichier ne garde que la
 * surface utilisée par le reste de l'application (et par les configurations
 * exportées), afin que les imports existants continuent de fonctionner.
 */
import {buildEChartsOption as _buildEChartsOption} from './echart/options'
import {buildKpiHtml} from './echart/kpi'
import {buildTableColumnRenderers, getTableColumnDisplayNames} from './echart/table'
import {_detectChartType, parseColumnRoles} from './echart/roles'

export type {ColumnRole, ParsedColumnRoles} from './echart/roles'
export {parseColumnRoles} from './echart/roles'
export {buildKpiHtml} from './echart/kpi'
export {buildTableColumnRenderers, getTableColumnDisplayNames} from './echart/table'
export const buildEChartsOption = _buildEChartsOption

export class EChartSqlParser {
    static parseColumnRoles = parseColumnRoles;
    static buildEChartsOption = _buildEChartsOption;
    static buildKpiHtml = buildKpiHtml;
    static buildTableColumnRenderers = buildTableColumnRenderers;
    static getTableColumnDisplayNames = getTableColumnDisplayNames;
    static detectChartType = _detectChartType;
}

export default EChartSqlParser
