// Module extrait de SqlBlockService.ts — helpers SQL.

import type {SqlBlockAst, SqlBlockStep} from '../SqlBlockTypes'
import {CTE_PREFIX, SLUG_TO_STEP_TYPE, STEP_TYPE_SLUG} from './constants'
import {sqlToAstSmart} from './parse-smart'

export function getCteName(step: SqlBlockAst['steps'][number], index: number): string {
    if (step.name?.trim()) return step.name.trim();
    const slug = STEP_TYPE_SLUG[step.type] ?? step.type;
    return `${CTE_PREFIX}${index}_${slug}`;
}

/** Retourne le nom CTE auto qui serait généré pour ce step/index (pour affichage placeholder). */
export function getAutoCteName(step: SqlBlockStep, index: number): string {
    const slug = STEP_TYPE_SLUG[step.type] ?? step.type;
    return `${CTE_PREFIX}${index}_${slug}`;
}

/** Déduit le type de step depuis le nom d'un CTE (_sqlblock_sN_slug → type). */
export function stepTypeFromCteName(name: string): SqlBlockStep['type'] | null {
    const m = name.match(/_sqlblock_s\d+_([a-z]+)$/i);
    if (!m) return null;
    return (SLUG_TO_STEP_TYPE[m[1]] as SqlBlockStep['type']) ?? null;
}

/** Échappe la séquence `* /` pour qu'elle ne ferme pas un commentaire bloc SQL. */
export function escapeBlockComment(s: string): string {
    return s.replace(/\*\//g, '* /').replace(/\r\n/g, ' ').replace(/\r/g, ' ');
}

// ─────────────────────────────────────────────────────────────────────────────
// AST → SQL
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Chart SQL — génération et parsing du SELECT final avec annotations TaleShape
// ─────────────────────────────────────────────────────────────────────────────

/** Rôles TaleShape reconnus pour la détection chart dans le SELECT final. */
export function quoteId(name: string): string {
    if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) return name;
    return `"${name.replace(/"/g, '""')}"`;
}

/** Génère l'expression FROM : sous-requête brute (commence par '(') → as-is, sinon identifiant quoté. */
export function fromExpr(source: string): string {
    return source.startsWith('(') ? source : quoteId(source);
}

export function unquoteId(name: string): string {
    if (name.startsWith('"') && name.endsWith('"')) return name.slice(1, -1).replace(/""/g, '"');
    return name;
}

// ─────────────────────────────────────────────────────────────────────────────
// Parser intelligent par CTE — sqlToAstSmart
// Tente de parser chaque CTE indépendamment ; les CTEs non parsables deviennent
// des steps custom_sql. Évite le basculement en mode dégradé global.
// ─────────────────────────────────────────────────────────────────────────────

export interface CteFullInfo {
    name: string;        // nom du CTE (sans quotes)
    fullBody: string;    // corps normalisé sans commentaire initial
    source: string;      // nom de la source (unquoted) dans ce CTE
    description?: string;// texte extrait du /* commentaire */ initial
}

export function parseSqlLiteral(s: string): string {
    s = s.trim();
    if (s.startsWith("'") && s.endsWith("'")) return s.slice(1, -1).replace(/''/g, "'");
    return s;
}

/** Parse une liste de valeurs SQL séparées par virgule (pour IN/NOT IN). */
export function parseSqlValueList(s: string): string[] | null {
    const values: string[] = [];
    let current = '';
    let inStr = false;
    for (let i = 0; i < s.length; i++) {
        const c = s[i];
        if (c === "'" && !inStr) { inStr = true; current += c; continue; }
        if (c === "'" && inStr) {
            if (s[i + 1] === "'") { current += "''"; i++; continue; }
            inStr = false; current += c; continue;
        }
        if (c === ',' && !inStr) {
            values.push(parseSqlLiteral(current.trim()));
            current = '';
            continue;
        }
        current += c;
    }
    if (current.trim()) values.push(parseSqlLiteral(current.trim()));
    return values.length > 0 ? values : null;
}

