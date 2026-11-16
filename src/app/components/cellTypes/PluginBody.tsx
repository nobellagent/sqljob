/**
 * Rendu d'une cellule fournie par un plugin, dans une iframe sandboxée.
 *
 * Le module du plugin est importé **dans l'iframe** (`sandbox="allow-scripts"`,
 * sans `allow-same-origin`) : il n'a donc accès ni au DOM de l'application, ni
 * à son `localStorage`, ni à son origine.
 *
 * Les appels sortants passent par un protocole `postMessage` et sont **vérifiés
 * ici**, pas seulement déclarés dans le manifeste : `query` exige `duckdb:read`
 * et une requête en lecture seule, `download` exige `ui:download`, le stockage
 * exige `storage:local` et reste préfixé par l'identifiant du plugin.
 *
 * Limite assumée : ce n'est pas une sandbox forte. Un plugin peut toujours
 * émettre des requêtes réseau et consommer du CPU.
 */
import {useEffect, useMemo, useRef, useState} from 'react'
import {useShallow} from 'zustand/react/shallow'
import type {CellBodyBaseProps} from '../cellTypes/types'
import {useNotebookStore} from '../../store/notebookStore'
import {SqlEditorWidget} from '../SqlEditorWidget'
import {ConfigManager} from '../../../lib/ConfigManager'
import {getPluginType} from '../../plugins/pluginTypes'
import {DuckDBManager} from '../../../lib/DuckDBManager'
import {
    assertHostPermission,
    isReadOnlyQuery,
    sanitizeDownloadName,
    storageKeyFor,
    type HostMethod,
} from '../../../core/plugins/hostApi'
import type {PluginManifest} from '../../../core/plugins/manifest'
import {toJsonSafe} from '../../../core/plugins/jsonSafe'

const HARNESS = `<!doctype html>
<html><head><meta charset="utf-8">
<style>
  html,body{margin:0;padding:4px;font:13px/1.45 system-ui,-apple-system,sans-serif;color:#111;background:transparent}
  pre{white-space:pre-wrap;margin:0;color:#b91c1c}
  img{max-width:100%}
</style></head>
<body><div id="root"></div>
<script type="module">
const root = document.getElementById('root')
let seq = 0
let requestId = 0
const pending = new Map()

function call(method, params) {
  return new Promise((resolve, reject) => {
    const id = 'r' + (++requestId)
    pending.set(id, {resolve, reject})
    parent.postMessage({kind: 'sqljob:request', id, method, params}, '*')
  })
}

// API hôte : chaque appel est contrôlé côté application.
window.sqljobHost = {
  query: (sql) => call('query', {sql}),
  download: (name, content, options) => call('download', {name, content, mime: options && options.mime, encoding: options && options.encoding}),
  storage: {
    get: (key) => call('storage.get', {key}),
    set: (key, value) => call('storage.set', {key, value}),
    remove: (key) => call('storage.remove', {key}),
  },
}

window.addEventListener('message', async (event) => {
  const msg = event.data
  if (!msg) return

  if (msg.kind === 'sqljob:host-response') {
    const entry = pending.get(msg.id)
    if (!entry) return
    pending.delete(msg.id)
    if (msg.ok) entry.resolve(msg.result)
    else entry.reject(new Error(msg.error || 'appel refusé'))
    return
  }

  if (msg.kind !== 'sqljob:render') return
  const token = ++seq
  try {
    const target = msg.source
      ? URL.createObjectURL(new Blob([msg.source], {type: 'text/javascript'}))
      : msg.entry
    const mod = await import(target)
    const render = mod.render || (mod.default && mod.default.render)
    if (typeof render !== 'function') throw new Error("le module n'exporte pas de fonction render")
    const html = await render({
      type: msg.type,
      cell: msg.cell,
      config: msg.config || {},
      rows: msg.rows,
      queries: msg.queries || {},
      theme: msg.theme,
    })
    if (token !== seq) return
    root.innerHTML = typeof html === 'string' ? html : ''
    // Un plugin qui a besoin d'interagir expose une fonction mount(root, contexte).
    const mount = mod.mount || (mod.default && mod.default.mount)
    if (typeof mount === 'function') {
      await mount(root, {
        type: msg.type,
        cell: msg.cell,
        config: msg.config || {},
        rows: msg.rows,
        queries: msg.queries || {},
        theme: msg.theme,
        host: window.sqljobHost,
      })
    }
    parent.postMessage({kind: 'sqljob:plugin-rendered', ok: true, type: msg.type}, '*')
  } catch (error) {
    if (token !== seq) return
    root.textContent = ''
    const pre = document.createElement('pre')
    pre.textContent = 'Plugin : ' + (error && error.message ? error.message : String(error))
    root.appendChild(pre)
    parent.postMessage({kind: 'sqljob:plugin-rendered', ok: false, type: msg.type, error: String(error)}, '*')
  }
})
parent.postMessage({kind: 'sqljob:plugin-ready'}, '*')
</script></body></html>`

const QUERY_TIMEOUT_MS = 15_000
const MAX_STORAGE_VALUE = 100 * 1024

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(message)), ms)
        promise.then(
            value => { clearTimeout(timer); resolve(value) },
            error => { clearTimeout(timer); reject(error) },
        )
    })
}

export const PluginBody: React.FC<CellBodyBaseProps> = ({cell, path, cellIndex}) => {
    const info = getPluginType(cell.type)
    const devMode = useNotebookStore(useShallow(state => state.devMode))
    const declaredQueries = info?.decl?.queries ?? []
    // Les requêtes sont visibles si l'une est vide (cellule fraîchement ajoutée)
    // ou en mode dev, comme les cellules natives.
    const showQueries = devMode || declaredQueries.some(query => !ConfigManager.getCellQuery(cell, query.key)?.trim())
    const frameRef = useRef<HTMLIFrameElement>(null)
    const [ready, setReady] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const payload = useMemo(() => {
        // Les champs déclarés au manifeste sont des propriétés de la cellule :
        // on ne transmet qu'eux, pas les internes (_results, _status…).
        const configKeys = Object.keys(info?.decl?.schema ?? {})
        const config = Object.fromEntries(configKeys.map(key => [key, (cell as unknown as Record<string, unknown>)[key]]))
        return JSON.stringify(toJsonSafe({
        type: cell.type,
        cell: {id: cell.id, title: cell.title, name: cell.name, json: cell.json ?? {}},
        config,
        rows: cell._results ?? [],
        queries: cell._pluginResults ?? {},
        theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
        source: info?.source,
        }))
    }, [cell, cell.type, cell.id, cell.title, cell.name, cell.json, cell._results, cell._pluginResults, info?.source, info?.decl])

    // Appels hôte : contrôlés à chaque requête, jamais une fois pour toutes.
    async function handleRequest(method: HostMethod, params: Record<string, unknown> | undefined): Promise<unknown> {
        const manifest = {permissions: info?.permissions ?? []} as PluginManifest
        assertHostPermission(manifest, method)
        const pluginId = info?.pluginId ?? 'inconnu'

        switch (method) {
            case 'query': {
                const sql = typeof params?.sql === 'string' ? params.sql : ''
                if (!isReadOnlyQuery(sql)) throw new Error('requête refusée : lecture seule attendue (SELECT ou WITH)')
                return await withTimeout(
                    DuckDBManager.executeQuery(sql),
                    QUERY_TIMEOUT_MS,
                    `requête interrompue après ${QUERY_TIMEOUT_MS / 1000} s`,
                )
            }
            case 'download': {
                const name = sanitizeDownloadName(params?.name)
                const raw = typeof params?.content === 'string' ? params.content : ''
                const mime = typeof params?.mime === 'string' ? params.mime : 'application/octet-stream'
                let blob: Blob
                if (params?.encoding === 'base64') {
                    const binary = atob(raw)
                    const bytes = new Uint8Array(binary.length)
                    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
                    blob = new Blob([bytes], {type: mime})
                } else {
                    blob = new Blob([raw], {type: mime})
                }
                const url = URL.createObjectURL(blob)
                const anchor = document.createElement('a')
                anchor.href = url
                anchor.download = name
                document.body.appendChild(anchor)
                anchor.click()
                anchor.remove()
                setTimeout(() => URL.revokeObjectURL(url), 10_000)
                return {name, size: blob.size}
            }
            case 'storage.get': {
                const key = storageKeyFor(pluginId, params?.key)
                return window.localStorage.getItem(key)
            }
            case 'storage.set': {
                const key = storageKeyFor(pluginId, params?.key)
                const value = typeof params?.value === 'string' ? params.value : JSON.stringify(params?.value ?? null)
                if (value.length > MAX_STORAGE_VALUE) throw new Error('valeur de stockage trop volumineuse (max 100 Ko)')
                window.localStorage.setItem(key, value)
                return true
            }
            case 'storage.remove': {
                window.localStorage.removeItem(storageKeyFor(pluginId, params?.key))
                return true
            }
            default:
                throw new Error(`méthode inconnue : ${String(method)}`)
        }
    }

    useEffect(() => {
        function onMessage(event: MessageEvent) {
            const data = event.data
            if (!data || typeof data !== 'object') return
            if (data.kind === 'sqljob:plugin-ready') setReady(true)
            if (data.kind === 'sqljob:plugin-rendered') {
                setError(data.ok ? null : String(data.error ?? 'erreur inconnue'))
            }
            if (data.kind !== 'sqljob:request') return
            if (event.source !== frameRef.current?.contentWindow) return

            const id = String(data.id ?? '')
            const method = data.method as HostMethod
            void handleRequest(method, data.params)
                .then(
                    result => frameRef.current?.contentWindow?.postMessage({kind: 'sqljob:host-response', id, ok: true, result}, '*'),
                    err => frameRef.current?.contentWindow?.postMessage(
                        {kind: 'sqljob:host-response', id, ok: false, error: err instanceof Error ? err.message : String(err)},
                        '*',
                    ),
                )
        }
        window.addEventListener('message', onMessage)
        return () => window.removeEventListener('message', onMessage)
    }, [info?.permissions, info?.pluginId])

    useEffect(() => {
        if (!ready || !info || !payload) return
        const frame = frameRef.current?.contentWindow
        if (!frame) return
        frame.postMessage(
            {kind: 'sqljob:render', entry: info.entryUrl, ...JSON.parse(payload)},
            '*',
        )
    }, [ready, info, payload])

    if (!info) {
        return (
            <div className="p-2 text-sm text-muted-foreground">
                Type de cellule « {cell.type} » : plugin non chargé.
            </div>
        )
    }

    const debugState = JSON.stringify({
        rows: Array.isArray(cell._results) ? cell._results.length : 0,
        queries: Object.keys(cell._pluginResults ?? {}).join(','),
        status: (cell as any)._status ?? null,
        info: cell._resultInfo ?? null,
    })

    return (
        <div className="flex flex-col min-h-0 flex-1" data-plugin-debug={debugState}>
            {showQueries && declaredQueries.length > 0 && (
                <div className="flex flex-col gap-2 pb-2">
                    {declaredQueries.map(query => (
                        <details key={query.key} className="border border-border rounded px-2 py-1">
                            <summary className="text-xs font-medium cursor-pointer select-none">
                                {query.label}
                            </summary>
                            <div className="pt-2">
                                <SqlEditorWidget
                                    cell={cell}
                                    path={path}
                                    cellIndex={cellIndex}
                                    queryType="query"
                                    queryKey={query.key}
                                />
                            </div>
                        </details>
                    ))}
                </div>
            )}
            {error && (
                <div className="text-xs text-destructive px-1 pb-1">
                    Plugin « {info.pluginId} » : {error}
                </div>
            )}
            <iframe
                ref={frameRef}
                title={`${info.title} (${info.pluginId})`}
                sandbox="allow-scripts"
                srcDoc={HARNESS}
                className="w-full flex-1 min-h-[120px] border-0 bg-transparent"
            />
        </div>
    )
}
