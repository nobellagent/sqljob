// Module extrait de ConfigManager.ts — fichiers, moteurs, requêtes et identifiants.

import {CELL_TYPE_SCHEMAS} from '../cellTypeSchemas'
import {FileHandler} from '../FileHandler'
import {getDefaultEngineForType, getQueryByName, getQueryNameForIndex} from './cell-accessors'

    export function getCellFileSlot(cell) {
        const schema = CELL_TYPE_SCHEMAS?.types[cell?.type];
        return schema?.bodyConfig?.fileSlot ?? null;
    }

    export function getCellFileData(cell) {
        if (!cell) return null;
        const slot = getCellFileSlot(cell);
        if (!slot) return null;
        if (Array.isArray(cell.files) && cell.files.length > 0) {
            const f = cell.files.find(x => x.slot === slot) || cell.files[0];
            if (f?.base64 && f?.fileName) return { base64: f.base64, fileName: f.fileName, compressed: f.compressed === true };
        }
        const bc = CELL_TYPE_SCHEMAS?.types[cell?.type]?.bodyConfig;
        const base64Key = bc?.fileBase64Key;
        const fileNameKey = bc?.fileFileNameKey ?? bc?.fileKey;
        if (base64Key && fileNameKey && cell[base64Key] && cell[fileNameKey]) {
            return { base64: cell[base64Key], fileName: cell[fileNameKey], compressed: cell.files?.[0]?.compressed === true };
        }
        return null;
    }

    export function setCellFileData(cell, { base64, fileName }) {
        if (!cell || !base64 || !fileName) return;
        const slot = getCellFileSlot(cell);
        if (!slot) return;
        ensureCellFiles(cell);
        const idx = cell.files.findIndex(x => x.slot === slot);
        const entry = { slot, base64, fileName };
        if (idx >= 0) cell.files[idx] = entry; else cell.files.push(entry);
        const bc = CELL_TYPE_SCHEMAS?.types[cell?.type]?.bodyConfig;
        const base64Key = bc?.fileBase64Key;
        const fileNameKey = bc?.fileFileNameKey ?? bc?.fileKey;
        if (base64Key) cell[base64Key] = base64;
        if (fileNameKey) cell[fileNameKey] = fileName;
    }

    export function ensureCellFiles(cell) {
        if (!cell) return;
        if (!Array.isArray(cell.files)) cell.files = [];
        const slot = getCellFileSlot(cell);
        if (!slot || cell.files.some(f => f.slot === slot)) return;
        const data = getCellFileData(cell);
        if (data) cell.files.push({ slot, base64: data.base64, fileName: data.fileName });
    }

    export function getCellEngine(cell: any, nameOrIndex: string | number = 'main') {
        if (!cell) return 'sql';
        const name = typeof nameOrIndex === 'number' ? (getQueryNameForIndex(cell, nameOrIndex) || 'main') : nameOrIndex;
        const q = getQueryByName(cell, name);
        const defaultEngine = getDefaultEngineForType(cell, name);
        const e = q?.engine ? q.engine : defaultEngine;
        return e === 'duckdb-wasm' ? 'sql' : e;
    }

    export function ensureCellQueries(cell, nameOrIndex = 'main') {
        if (!cell) return null;
        if (!Array.isArray(cell.queries)) cell.queries = [];
        const schema = CELL_TYPE_SCHEMAS?.types[cell?.type];
        const name = typeof nameOrIndex === 'number' ? (schema?.queryNames?.[nameOrIndex] ?? (nameOrIndex === 0 ? 'main' : 'filename')) : nameOrIndex;
        let q = cell.queries.find(x => x.name === name);
        if (!q) {
            const idx = schema?.queryNames?.indexOf(name);
            if (idx >= 0 && cell.queries[idx] && !cell.queries[idx].name) {
                cell.queries[idx].name = name;
                q = cell.queries[idx];
            } else {
                const defaultEngine = getDefaultEngineForType(cell, name);
                q = { name, sql: '', engine: defaultEngine, showQueryEditor: false };
                const insertIdx = schema?.queryNames?.indexOf(name) ?? cell.queries.length;
                if (insertIdx < cell.queries.length) cell.queries.splice(insertIdx, 0, q);
                else cell.queries.push(q);
            }
        }
        return q;
    }

    export function ensureGroupQueries(group) {
        if (!group) return null;
        if (!Array.isArray(group.queries)) group.queries = [];
        let q = group.queries.find(x => x.name === 'main');
        if (!q) {
            if (group.queries[0] && !group.queries[0].name) { group.queries[0].name = 'main'; q = group.queries[0]; }
            else { q = { name: 'main', sql: '', engine: 'sql', showQueryEditor: false }; group.queries.unshift(q); }
        }
        return q;
    }

    export function getGroupIfQuery(group) {
        if (!group) return null;
        if (!Array.isArray(group.queries) || group.queries.length === 0) return null;
        const q = group.queries.find(x => x.name === 'main') || group.queries[0];
        const hasSql = q && (q.sql || '').trim();
        return hasSql ? q : null;
    }

    export function setCellQuery(cell, nameOrIndex, sql) {
        const q = ensureCellQueries(cell, nameOrIndex);
        if (q) q.sql = sql;
    }

    export function encodeUTF8ToBase64(str) {
        return btoa(unescape(encodeURIComponent(str)));
    }

    export async function compressToGzipBase64(str: string): Promise<string> {
        const data = new TextEncoder().encode(str);
        const compressed = await FileHandler.compressGzip(data.buffer);
        return FileHandler.arrayBufferToBase64(compressed);
    }

    export async function decompressFromGzipBase64(b64: string): Promise<string> {
        const bytes = FileHandler.base64ToUint8Array(b64);
        const decompressed = await FileHandler.decompressGzip(
            bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
        );
        return new TextDecoder().decode(decompressed);
    }

    export function generateGroupId() {
        return 'grp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    export function generatePageId() {
        return 'page_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
