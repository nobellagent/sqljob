/**
 * Plugin d'exemple « hello-cell ».
 *
 * Contrat d'un plugin :
 * - `register(api)` (facultatif) déclare les types et leurs titres ;
 * - `render(context)` (requis) renvoie du HTML, affiché dans une iframe
 *   sandboxée par l'application.
 *
 * Le contexte reçu : `{type, cell, rows, queries, theme}`.
 * `cell.json` contient la configuration saisie dans la fiche de la cellule ;
 * `queries` contient les résultats de chaque requête déclarée au manifeste.
 */

export function register(api) {
    api.registerCellType({type: 'hello', title: 'Hello'})
    api.log('plugin prêt')
}

export function render({cell, rows, queries, theme}) {
    const config = cell && cell.json && typeof cell.json === 'object' ? cell.json : {}
    const label = (cell && (cell.title || cell.name)) || 'cellule sans titre'
    const salutation = typeof config.salutation === 'string' && config.salutation ? config.salutation : 'Bonjour'
    const emoji = typeof config.emoji === 'string' && config.emoji ? config.emoji : '👋'
    const compact = config.compact === true

    const dataRows = Array.isArray(queries && queries.data) ? queries.data : (Array.isArray(rows) ? rows : [])
    const count = dataRows.length

    const color = theme === 'dark' ? '#e5e7eb' : '#111827'
    const muted = theme === 'dark' ? '#9ca3af' : '#4b5563'

    if (compact) {
        return `<div style="font:13px/1.4 system-ui,sans-serif;color:${color}">
            ${escapeHtml(emoji)} ${escapeHtml(salutation)} — ${escapeHtml(label)} · ${count} ligne${count === 1 ? '' : 's'}
        </div>`
    }

    return `
        <div style="font:13px/1.5 system-ui,-apple-system,sans-serif;color:${color}">
            <div style="font-size:15px;font-weight:600;margin-bottom:4px">
                ${escapeHtml(emoji)} ${escapeHtml(salutation)} — ${escapeHtml(label)}
            </div>
            <div style="color:${muted}">
                Plugin <code>hello-cell</code> — ${count} ligne${count === 1 ? '' : 's'} reçue${count === 1 ? '' : 's'}.
            </div>
        </div>
    `
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
    }[char]))
}
