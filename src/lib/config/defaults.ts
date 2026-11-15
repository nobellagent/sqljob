export const SQLJOB_VERSION = '0.1'

// Module extrait de ConfigManager.ts — valeurs par défaut et normalisation.

import {CELL_TYPE_SCHEMAS} from '../cellTypeSchemas'
import {GistEncrypt} from '../GistEncrypt'
import {getCellQuery, getQueryByName} from './cell-accessors'
import {ensureCellQueries} from './cell-files'

    export function getDefaultConfig() {
        try {
            const scriptElement = document.getElementById('defaultConfigBase64');
            const defaultConfigBase64 = scriptElement?.textContent?.trim();

            if (!defaultConfigBase64) return { job: { cells: [] } };

            try {
                const base64Decoded = atob(defaultConfigBase64);
                const decoded = decodeURIComponent(escape(base64Decoded));
                return JSON.parse(decoded);
            } catch {
                return JSON.parse(atob(defaultConfigBase64));
            }
        } catch (error) {
            console.error('Erreur de décodage config:', error);
            return { job: { cells: [] } };
        }
    }

    export function loadDefaultConfigOrEncrypted() {
        const scriptElement = document.getElementById('defaultConfigBase64');
        const raw = scriptElement?.textContent?.trim();
        if (!raw) return { config: { job: { cells: [] } } };
        try {
            const base64Decoded = atob(raw);
            let decodedStr;
            try {
                decodedStr = decodeURIComponent(escape(base64Decoded));
            } catch {
                decodedStr = base64Decoded;
            }
            const parsed = JSON.parse(decodedStr);
            if (GistEncrypt.isEncrypted(parsed)) {
                return { needsPassphrase: true, encryptedContent: parsed, source: 'html' };
            }
            return { config: parsed };
        } catch (e) {
            try {
                const parsed = JSON.parse(atob(raw));
                if (GistEncrypt.isEncrypted(parsed)) {
                    return { needsPassphrase: true, encryptedContent: parsed, source: 'html' };
                }
                return { config: parsed };
            } catch (err) {
                console.error('Erreur de décodage config:', err);
                return { config: { job: { cells: [] } } };
            }
        }
    }

    export function normalizeOrder(value, fallback) {
        if (value === undefined || value === null) return fallback;
        if (typeof value === 'string' && value.trim() === '') return fallback;
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    }

    export function normalizeCell(cell) {
        if (!cell || !cell.type) return cell;
        // Rétrocompat : anciens exports utilisaient 'sqlRecursiveParse' comme type interne
        const TYPE_IMPORT_ALIASES = { sqlRecursiveParse: 'sql' }
        const c = { ...cell, type: TYPE_IMPORT_ALIASES[cell.type] ?? cell.type };
        if (c.type === 'markdown' && c.content && !getCellQuery(c, 'main')) {
            ensureCellQueries(c, 'main');
            const q = getQueryByName(c, 'main');
            if (q) q.sql = c.content;
        }
        if (Array.isArray(c.queries) && c.queries.length > 0) {
            const schema = CELL_TYPE_SCHEMAS?.types[c.type];
            const qNames = schema?.queryNames ?? ['main'];
            c.queries = c.queries.map((q, i) => ({
                ...q,
                name: q.name || qNames[i] || (i === 0 ? 'main' : i === 1 ? 'filename' : 'query' + i),
                sql: q.sql || q.query || ''
            }));
        }
        // pdfme: json objet -> chaîne pour éviter [object Object] dans textarea/modale
        if (c.type === 'pdfme' && typeof c.json === 'object' && c.json !== null) {
            c.json = JSON.stringify(c.json, null, 2);
        }
        // Rétrocompat : anciens exports utilisaient 'materialize' et 'select'
        if (c.materialize !== undefined && c.materialized === undefined) {
            c.materialized = c.materialize === 'select' ? 'ephemeral' : c.materialize;
            delete c.materialize;
        }
        if (c.materialized === 'select') c.materialized = 'ephemeral';
        // Rétrocompat : ast.materialize → ast.materialized dans les queries
        if (Array.isArray(c.queries)) {
            for (const q of c.queries) {
                if (q.ast && q.ast.materialize !== undefined && q.ast.materialized === undefined) {
                    q.ast.materialized = q.ast.materialize === 'select' ? 'ephemeral' : q.ast.materialize;
                    delete q.ast.materialize;
                }
                if (q.ast && q.ast.materialized === 'select') q.ast.materialized = 'ephemeral';
            }
        }
return c;
    }

    export function normalizeGroup(group) {
        if (!group || !Array.isArray(group.queries)) return group;
        group.queries = group.queries.map((q, i) => ({
            ...q,
            name: q.name || (i === 0 ? 'main' : 'query' + i),
            sql: q.sql || q.query || ''
        }));
        return group;
    }
