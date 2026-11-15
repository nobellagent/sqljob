// Module extrait de ConfigManager.ts — nettoyage et export de la configuration.

import {CELL_TYPE_SCHEMAS, CELL_TYPE_HANDLERS} from '../cellTypeSchemas'
import {FileHandler} from '../FileHandler'
import {getCellEditableContent, getCellQuery, getCellQueryShowQueryEditor, getCellQueryShowResult, getDefaultEngineForType, getQuery2Name} from './cell-accessors'
import {generateGroupId, getCellEngine, getCellFileData, getGroupIfQuery} from './cell-files'
import {SQLJOB_VERSION, normalizeOrder} from './defaults'

    export function _buildQueriesForClean(cell) {
        if (Array.isArray(cell.queries) && cell.queries.length > 0) {
            const schema = CELL_TYPE_SCHEMAS?.types[cell?.type];
            return cell.queries.map((q, i) => {
                const entry: any = {
                    name: q.name || schema?.queryNames?.[i] || (i === 0 ? 'main' : i === 1 ? 'filename' : 'query' + i),
                    query: q.sql || '',
                    engine: q.engine || getDefaultEngineForType(cell?.type, i),
                    showQueryEditor: q.showQueryEditor === true,
                };
                entry.showQueryResult = q.showQueryResult !== false; // undefined → true (rétrocompat)
                if (q.ast !== undefined) entry.ast = q.ast;
                if (q.degraded) entry.degraded = q.degraded;
                if (q.manualSql) entry.manualSql = q.manualSql;
                return entry;
            });
        }
        const arr = [];
        const qMain = getCellQuery(cell, 'main');
        if (qMain) arr.push({ name: 'main', sql: qMain, engine: getCellEngine(cell, 'main'), showQueryEditor: getCellQueryShowQueryEditor(cell, 'main'), showQueryResult: getCellQueryShowResult(cell, 'main') });
        const qFallback = getCellQuery(cell, 'fallback') || getCellQuery(cell, 'filename');
        if (qFallback) arr.push({ name: getQuery2Name(cell), sql: qFallback, engine: 'sql', showQueryEditor: false });
        return arr;
    }

    export async function cleanCell(cell: any, includeFileData = false) {
        const cleanCell: any = { type: cell.type };

        const schema = CELL_TYPE_SCHEMAS?.types[cell?.type];
        const exportFields = schema?.exportFields ?? ['queries'];

        for (const field of exportFields) {
            if (field === 'queries') {
                cleanCell.queries = _buildQueriesForClean(cell);
                if (cell.type === 'markdown' && (!Array.isArray(cleanCell.queries) || cleanCell.queries.length === 0)) {
                    cleanCell.queries = [{ name: 'main', query: getCellEditableContent(cell), engine: getCellEngine(cell, 'main'), showQueryEditor: getCellQueryShowQueryEditor(cell, 'main') }];
                }
            } else if (field === 'name') {
                const handler = CELL_TYPE_HANDLERS[cell?.type];
                const val = handler?.getExportValue ? handler.getExportValue(cell, 'name') : cell.name;
                if (val !== undefined) cleanCell.name = val;
            } else if (field === 'json') {
                if (schema?.exportJsonMode === 'string') {
                    cleanCell.json = typeof cell.json === 'string' ? cell.json : (cell.json ? JSON.stringify(cell.json) : '');
                } else {
                    cleanCell.json = cell.json || {};
                    if (cell.json?.xlsx) cleanCell.json.xlsx = cell.json.xlsx;
                    if (cell.json?.perspectiveConfig !== undefined) {
                        let cfg = cell.json.perspectiveConfig;
                        cleanCell.json.perspectiveConfig = typeof cfg === 'string' ? cfg.replace(/\r\n/g, '\n').replace(/\r/g, '\n') : (cfg != null ? JSON.stringify(cfg, null, 2) : '');
                    }
                    if (cell.json?.univerConfig !== undefined) {
                        cleanCell.json.univerConfig = cell.json.univerConfig ?? {};
                    }
                }
            } else if (cell[field] !== undefined) {
                cleanCell[field] = cell[field];
            }
        }

        if (includeFileData && schema?.exportFileSlot) {
            const slot = schema.exportFileSlot;
            if (slot === 'source' && cell._currentFile && cell._fileName) {
                try {
                    const arrayBuffer = await cell._currentFile.arrayBuffer();
                    const compressedBuffer = await FileHandler.compressGzip(arrayBuffer);
                    const base64 = FileHandler.arrayBufferToBase64(compressedBuffer);
                    cleanCell.files = [{ slot, base64, fileName: cell._fileName, compressed: true }];
                } catch (e) {
                    console.warn('Impossible de lire le fichier source:', e);
                }
            } else {
                const fileData = getCellFileData(cell);
                if (fileData) {
                    let base64 = fileData.base64;
                    let compressed = !!fileData.compressed;
                    if (!compressed) {
                        try {
                            const bytes = FileHandler.base64ToUint8Array(base64);
                            const rawBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
                            const compressedBuffer = await FileHandler.compressGzip(rawBuffer);
                            base64 = FileHandler.arrayBufferToBase64(compressedBuffer);
                            compressed = true;
                        } catch (e) {
                            console.warn('Compression fichier échouée:', e);
                        }
                    }
                    cleanCell.files = [{ slot, base64, fileName: fileData.fileName, compressed }];
                }
            }
        }
        const orderValue = normalizeOrder(cell._order, undefined);
        if (orderValue !== undefined) {
            cleanCell.order = orderValue;
        }

        // Ajouter childGroupId si présent
        if (cell.childGroupId) {
            cleanCell.childGroupId = cell.childGroupId;
        }

        // Ajouter name (pour onglets tabsChild)
        if (cell.name !== undefined && cell.name !== '') {
            cleanCell.name = cell.name;
        }

        // Taille optionnelle des cellules (px et % combinables, largeur + hauteur)
        const opt = (k, v) => { if (v !== undefined && v !== null && String(v).trim() !== '') cleanCell[k] = v; };
        opt('minSizePx', cell.minSizePx);
        opt('minSizePercent', cell.minSizePercent);
        opt('maxSizePx', cell.maxSizePx);
        opt('maxSizePercent', cell.maxSizePercent);
        opt('minHeightPx', cell.minHeightPx);
        opt('minHeightPercent', cell.minHeightPercent);
        opt('maxHeightPx', cell.maxHeightPx);
        opt('maxHeightPercent', cell.maxHeightPercent);

        // Bordure : export uniquement si false (sinon true par défaut)
        if (cell.border === false) {
            cleanCell.border = false;
        }

        return cleanCell;
    }

    export async function cleanGroup(group: any, includeFileData = false) {
        const cleanGroup: any = {
            direction: group.direction || 'row',
            style: group.style || '',
            cells: await Promise.all((group.cells || []).map(cell => cleanCell(cell, includeFileData)))
        };

        // Ajouter les paramètres accordion si définis
        if (group.accordion) {
            cleanGroup.accordion = true;
            cleanGroup.title = group.title || '';
            cleanGroup.accordionOpen = group.accordionOpen !== false; // true par défaut
        }

        // Ajouter tabsChild et name (pour onglets)
        if (group.tabsChild) {
            cleanGroup.tabsChild = true;
        }
        if (group.name !== undefined && group.name !== '') {
            cleanGroup.name = group.name;
        }

        // Ajouter queries si défini (condition d'affichage en mode client = queries[0] avec name: 'main')
        if (Array.isArray(group.queries) && group.queries.length > 0) {
            const q0 = getGroupIfQuery(group) || group.queries[0];
            if (q0 && (q0.sql || '').trim()) {
                cleanGroup.queries = [{
                    name: 'main',
                    query: q0.sql.trim(),
                    engine: q0.engine || 'sql',
                    showQueryEditor: q0.showQueryEditor === true
                }];
            }
        }

        // Ajouter la config de loop si elle existe
        if (group.loop && group.loop.enabled) {
            cleanGroup.loop = {
                enabled: true,
                query: group.loop.query || '',
                zip: group.loop.zip || false,
                zipQuery: group.loop.zipQuery || ''
            };
        }

        // Support Alpine state: _type, _id, _order (et config: type, id, order)
        const groupType = group.type ?? group._type ?? 'core';
        cleanGroup.type = groupType;
        cleanGroup.id = group.id ?? group._id ?? generateGroupId();

        // Ajouter order seulement pour les groupes "core"
        if (groupType === 'core') {
            const orderValue = normalizeOrder(group.order ?? group._order, undefined);
            if (orderValue !== undefined) {
                cleanGroup.order = orderValue;
            }
        }

        // Récursivement nettoyer les children
        if (group.children && group.children.length > 0) {
            cleanGroup.children = await Promise.all(group.children.map(child => cleanGroup(child, includeFileData)));
        }

        return cleanGroup;
    }

    export async function buildConfigFromState(pages, devMode = true, showLayout = true, includeFileData = false, theme = 'light', dbEngine = 'duckdb-wasm', directedAcyclicGraph = false, customThemeLight = '', customThemeDark = '') {
        // Nettoyer chaque page
        const cleanPages = await Promise.all(pages.map(async (page) => {
            const cleanGroups = await Promise.all(page.groups.map(group => cleanGroup(group, includeFileData)));
            const cleanLinkGroups = await Promise.all((page.linkGroups || []).map(group => cleanGroup(group, includeFileData)));

            // Merger groups et linkGroups dans un seul tableau
            const allGroups = [...cleanGroups, ...cleanLinkGroups];

            return {
                name: page.name,
                groups: allGroups
            };
        }));

        return {
            version: SQLJOB_VERSION,
            createdAt: new Date().toISOString(),
            ui: {
                devMode: devMode,
                showLayout: showLayout,
                theme: theme,
                dbEngine: dbEngine,
                directedAcyclicGraph: directedAcyclicGraph,
                ...(customThemeLight ? { customThemeLight } : {}),
                ...(customThemeDark  ? { customThemeDark  } : {}),
            },
            job: {
                pages: cleanPages
            }
        };
    }

export function exportConfigToJson(config: any): string {
    const compacts: [string, string][] = []

    function walk(obj: any): any {
        if (Array.isArray(obj)) return obj.map(walk)
        if (obj && typeof obj === 'object') {
            const result: Record<string, any> = {}
            for (const [k, v] of Object.entries(obj)) {
                if (k === 'json' && v && typeof v === 'object') {
                    const placeholder = `\u0000COMPACT${compacts.length}\u0000`
                    compacts.push([placeholder, JSON.stringify(v)])
                    result[k] = placeholder
                } else {
                    result[k] = walk(v)
                }
            }
            return result
        }
        return obj
    }

    let json = JSON.stringify(walk(config), null, 2)
    for (const [placeholder, compactJson] of compacts) {
        json = json.replace(JSON.stringify(placeholder), compactJson)
    }
    return json
}
