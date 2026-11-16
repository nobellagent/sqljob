/**
 * Plugin « pdfme » — génération de PDF à partir d'un template pdfme.
 *
 * Même principe que la cellule pdfme native, mais sans code dans le cœur :
 * - deux requêtes déclarées (`data`, `filename`) exécutées par le notebook ;
 * - un template saisi dans la fiche de configuration (champ `template`) ;
 * - un bouton qui génère le PDF et le télécharge via `sqljobHost.download`.
 *
 * Le module est bundlé (pdfme + pdf-lib + polices) : il ne fait aucun import
 * relatif et n'a besoin d'aucun autre fichier.
 */
import {generate} from '@pdfme/generator'
import {text, table} from '@pdfme/schemas'

const PLUGINS = {Text: text, Table: table}

function parseTemplate(raw) {
    if (typeof raw !== 'string' || !raw.trim()) {
        throw new Error('Template pdfme manquant : renseignez le champ « Template pdfme (JSON) ».')
    }
    let template
    try {
        template = JSON.parse(raw)
    } catch (error) {
        throw new Error(`Template JSON invalide : ${error.message}`)
    }
    if (!template || !Array.isArray(template.schemas)) {
        throw new Error('Template invalide : la clé « schemas » est absente.')
    }
    return template
}

/** Valeur de champ : un JSON embarqué devient un objet, sinon une chaîne. */
function coerce(value) {
    if (typeof value !== 'string') return String(value ?? '')
    try {
        const parsed = JSON.parse(value)
        return Array.isArray(parsed) || (parsed && typeof parsed === 'object') ? parsed : value
    } catch {
        return value
    }
}

/** Construit les entrées pdfme : valeurs par défaut du template, puis celles de la requête. */
export function buildInputs(template, rows) {
    return rows.map(row => {
        const input = {}
        for (const page of template.schemas || []) {
            for (const field of page || []) {
                if (!field || !field.name) continue
                const fallback = field.content ?? ''
                input[field.name] = coerce(fallback)
            }
        }
        for (const [key, value] of Object.entries(row || {})) {
            input[key] = coerce(value)
        }
        return input
    })
}

export function fileNameFrom(queries, count) {
    const first = queries && Array.isArray(queries.filename) ? queries.filename[0] : null
    const value = first ? Object.values(first)[0] : null
    const name = typeof value === 'string' && value.trim() ? value.trim() : 'export'
    return name.toLowerCase().endsWith('.pdf') ? name : `${name}.pdf`
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[char]))
}

export function render({cell, queries, config, theme}) {
    const rows = queries && Array.isArray(queries.data) ? queries.data : []
    const template = config && typeof config.template === 'string' ? config.template : ''
    const ready = template.trim().length > 0 && rows.length > 0
    const color = theme === 'dark' ? '#e5e7eb' : '#111827'
    const muted = theme === 'dark' ? '#9ca3af' : '#4b5563'
    const title = (cell && (cell.title || cell.name)) || 'PDF'

    const hint = !template.trim()
        ? 'Renseignez le template pdfme dans la configuration de la cellule.'
        : rows.length === 0
            ? 'Aucune ligne : vérifiez la requête de données.'
            : `${rows.length} ligne(s) prête(s) pour ${fileNameFrom(queries, rows.length)}`

    return `
        <div style="font:13px/1.5 system-ui,-apple-system,sans-serif;color:${color}">
            <div style="font-size:15px;font-weight:600;margin-bottom:2px">📑 ${escapeHtml(title)}</div>
            <div style="color:${muted};margin-bottom:8px">${escapeHtml(hint)}</div>
            <button data-role="generate" ${ready ? '' : 'disabled'}
                style="font:inherit;padding:6px 12px;border-radius:6px;border:1px solid ${ready ? '#2563eb' : '#9ca3af'};
                       background:${ready ? '#2563eb' : 'transparent'};color:${ready ? '#fff' : muted};
                       cursor:${ready ? 'pointer' : 'not-allowed'}">
                Générer le PDF
            </button>
            <span data-role="status" style="margin-left:10px;color:${muted}"></span>
        </div>
    `
}

/** Appelé après l'insertion du HTML : c'est ici que le bouton devient actif. */
export function mount(root, context) {
    const button = root.querySelector('[data-role="generate"]')
    const status = root.querySelector('[data-role="status"]')
    if (!button || !context || !context.host) return

    const setStatus = text => { if (status) status.textContent = text }

    button.addEventListener('click', async () => {
        if (button.disabled) return
        button.disabled = true
        setStatus('Génération…')
        try {
            const template = parseTemplate(context.config && context.config.template)
            const rows = context.queries && Array.isArray(context.queries.data) ? context.queries.data : []
            const inputs = buildInputs(template, rows)
            if (inputs.length === 0) throw new Error('Aucune ligne à imprimer.')

            const bytes = await generate({template, inputs, plugins: PLUGINS})
            const base64 = toBase64(bytes)
            const name = fileNameFrom(context.queries, inputs.length)
            await context.host.download(name, base64, {mime: 'application/pdf', encoding: 'base64'})
            setStatus(`✅ ${name} (${inputs.length} page(s))`)
        } catch (error) {
            setStatus(`❌ ${error && error.message ? error.message : String(error)}`)
        } finally {
            button.disabled = false
        }
    })
}

function toBase64(bytes) {
    const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
    let binary = ''
    const chunk = 0x8000
    for (let i = 0; i < view.length; i += chunk) {
        binary += String.fromCharCode.apply(null, view.subarray(i, i + chunk))
    }
    return btoa(binary)
}
