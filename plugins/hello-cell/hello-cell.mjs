/**
 * Plugin d'exemple « hello-cell ».
 *
 * Contrat d'un plugin :
 * - `register(api)` (facultatif) déclare les types et leurs titres ;
 * - `render(context)` (requis) renvoie du HTML, affiché dans une iframe
 *   sandboxée par l'application.
 *
 * Le contexte reçu : `{type, cell, rows, theme}`.
 */

export function register(api) {
    api.registerCellType({type: 'hello', title: 'Hello'})
    api.log('plugin prêt')
}

export function render({cell, rows, theme}) {
    const label = (cell && (cell.title || cell.name)) || 'cellule sans titre'
    const count = Array.isArray(rows) ? rows.length : 0
    const color = theme === 'dark' ? '#e5e7eb' : '#111827'
    const muted = theme === 'dark' ? '#9ca3af' : '#4b5563'

    return `
        <div style="font:13px/1.5 system-ui,-apple-system,sans-serif;color:${color}">
            <div style="font-size:15px;font-weight:600;margin-bottom:4px">👋 ${escapeHtml(label)}</div>
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
