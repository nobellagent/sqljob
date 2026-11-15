// Module extrait de ConfigManager.ts — lecture des cellules et de leurs requêtes.

import {CELL_TYPE_SCHEMAS} from '../cellTypeSchemas'
import {ensureCellQueries, getCellEngine} from './cell-files'

    export function getCellQuery(cell: any, nameOrIndex: string | number = 'main') {
        if (!cell) return '';
        const name = typeof nameOrIndex === 'number' ? (getQueryNameForIndex(cell, nameOrIndex) || 'main') : nameOrIndex;
        const q = getQueryByName(cell, name);
        return q ? (q.sql || '') : '';
    }

    export function getCellQueryShowQueryEditor(cell: any, nameOrIndex: string | number = 'main') {
        if (!cell) return false;
        const name = typeof nameOrIndex === 'number' ? (getQueryNameForIndex(cell, nameOrIndex) || 'main') : nameOrIndex;
        const q = getQueryByName(cell, name);
        return q ? q.showQueryEditor === true : false;
    }

    export function getCellQueryShowResult(cell: any, nameOrIndex: string | number = 'main') {
        if (!cell) return true;
        const name = typeof nameOrIndex === 'number' ? (getQueryNameForIndex(cell, nameOrIndex) || 'main') : nameOrIndex;
        const q = getQueryByName(cell, name);
        return q ? q.showQueryResult !== false : true;
    }

    export function getQueryByName(cell, name) {
        if (!cell || !Array.isArray(cell.queries)) return null;
        let q = cell.queries.find(x => x.name === name);
        if (!q) {
            const schema = CELL_TYPE_SCHEMAS?.types[cell?.type];
            const idx = schema?.queryNames?.indexOf(name);
            if (idx >= 0 && cell.queries[idx]) q = cell.queries[idx];
        }
        return q || null;
    }

    export function getQueryIndexByName(cell, name) {
        if (!cell?.queries) return 0;
        const idx = cell.queries.findIndex(q => q.name === name);
        if (idx >= 0) return idx;
        const schema = CELL_TYPE_SCHEMAS?.types[cell?.type];
        const schemaIdx = schema?.queryNames?.indexOf(name);
        return schemaIdx >= 0 ? schemaIdx : 0;
    }

    export function getQueryNameForIndex(cell, index) {
        const schema = CELL_TYPE_SCHEMAS?.types[cell?.type];
        return schema?.queryNames?.[index] ?? (index === 0 ? 'main' : index === 1 ? 'filename' : null);
    }

    export function getQuery2Name(cell) {
        const schema = CELL_TYPE_SCHEMAS?.types[cell?.type];
        return schema?.secondQueryName ?? schema?.queryNames?.[1] ?? 'filename';
    }

    export function getDefaultEngineForType(cellOrType, nameOrIndex = 'main') {
        const type = typeof cellOrType === 'object' ? cellOrType?.type : cellOrType;
        const schema = CELL_TYPE_SCHEMAS?.types[type];
        if (!schema?.defaults?.queries) return 'sql';
        const idx = typeof nameOrIndex === 'number' ? nameOrIndex : (schema?.queryNames?.indexOf(nameOrIndex) ?? 0);
        const q = schema.defaults.queries[idx];
        return q?.engine ?? 'sql';
    }

    export function getCellEditableContent(cell) {
        if (!cell) return '';
        const schema = CELL_TYPE_SCHEMAS?.types[cell?.type];
        if (!schema?.contentKey) return '';
        const q = getQueryByName(cell, 'main');
        return (q?.sql ?? '') || (cell.content ?? '');
    }

    export function setCellEditableContent(cell, value) {
        if (!cell) return;
        const schema = CELL_TYPE_SCHEMAS?.types[cell?.type];
        if (!schema?.contentKey) return;
        ensureCellQueries(cell, 'main');
        const q = getQueryByName(cell, 'main');
        if (q) q.sql = value;
        cell.content = value;
    }

    export function getCellContentDisplay(cell) {
        if (!cell) return '';
        const schema = CELL_TYPE_SCHEMAS?.types[cell?.type];
        if (!schema?.contentKey) return '';
        const engine = getCellEngine(cell, 'main');
        if (engine === 'sql' || engine === 'js') return (cell[schema.contentResultKey] ?? '') || '';
        return getCellEditableContent(cell);
    }

    export function getMarkdownDisplayContent(cell) {
        return getCellContentDisplay(cell);
    }

    export function getMarkdownContent(cell) {
        return getCellEditableContent(cell);
    }

    export function setMarkdownContent(cell, value) {
        setCellEditableContent(cell, value);
    }

    export function getCellReferenceName(cell) {
        if (!cell) return '';
        if (CELL_TYPE_SCHEMAS?.types[cell?.type]?.useNameAsReference) return (cell.name ?? cell.referenceName ?? '').trim();
        return cell?.referenceName ?? '';
    }

    export function isCellNameValid(cell, name) {
        const schema = CELL_TYPE_SCHEMAS?.types[cell?.type];
        const pattern = schema?.namePattern;
        if (!pattern || !name) return true;
        return typeof pattern === 'object' && pattern.test ? pattern.test(String(name)) : true;
    }

    export function cellBlocksAutoFlow(cell) { return !!CELL_TYPE_SCHEMAS?.types[cell?.type]?.blocksAutoFlow; }

    export function cellRequiresFileBeforeRun(cell) { return !!CELL_TYPE_SCHEMAS?.types[cell?.type]?.requiresFileBeforeRun; }

    export function cellSkippedWhenButtonLabel(cell) { return !!CELL_TYPE_SCHEMAS?.types[cell?.type]?.skippedWhenButtonLabel; }

    export function cellShowOnlyWhenButtonLabel(cell) { return !!CELL_TYPE_SCHEMAS?.types[cell?.type]?.showOnlyWhenButtonLabel; }

    export function cellHideInViewMode(cell) { return !!CELL_TYPE_SCHEMAS?.types[cell?.type]?.hideInViewMode; }

    export function cellShowInViewWhenResultOrRunning(cell) { return !!CELL_TYPE_SCHEMAS?.types[cell?.type]?.showInViewWhenResultOrRunning; }

    export function cellTableSearchable(cell) { return !!CELL_TYPE_SCHEMAS?.types[cell?.type]?.tableSearchable; }

    export function cellExportRuntimeBlob(cell) { return !!CELL_TYPE_SCHEMAS?.types[cell?.type]?.exportRuntimeBlob; }

    export function cellExportTemplateBase64(cell) { return !!CELL_TYPE_SCHEMAS?.types[cell?.type]?.exportTemplateBase64; }

    export function hasCellsWithExportSlot(pages, slot) {
        const check = (groups) => {
            for (const g of groups || []) {
                for (const c of g.cells || []) {
                    if (CELL_TYPE_SCHEMAS?.types[c?.type]?.exportFileSlot === slot) return true;
                }
                if (check(g.children)) return true;
            }
            return false;
        };
        return (pages || []).some(p => check(p.groups || []) || check(p.linkGroups || []));
    }
