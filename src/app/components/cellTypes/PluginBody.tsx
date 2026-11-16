/**
 * Rendu d'une cellule fournie par un plugin, dans une iframe sandboxée.
 *
 * Le module du plugin est importé **dans l'iframe** (`sandbox="allow-scripts"`,
 * sans `allow-same-origin`) : il n'a donc accès ni au DOM de l'application, ni
 * à son `localStorage`, ni à son origine. Le parent se contente de poster la
 * cellule et les lignes de résultat.
 *
 * Limite assumée : ce n'est pas une sandbox forte. Un plugin peut faire des
 * requêtes réseau et consommer du CPU ; les permissions déclarées au manifeste
 * sont une déclaration d'intention, pas un mécanisme d'application.
 */
import {useEffect, useMemo, useRef, useState} from 'react'
import type {CellBodyBaseProps} from '../cellTypes/types'
import {getPluginType} from '../../plugins/pluginTypes'

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
window.addEventListener('message', async (event) => {
  const msg = event.data
  if (!msg || msg.kind !== 'sqljob:render') return
  const token = ++seq
  try {
    const target = msg.source
      ? URL.createObjectURL(new Blob([msg.source], {type: 'text/javascript'}))
      : msg.entry
    const mod = await import(target)
    const render = mod.render || (mod.default && mod.default.render)
    if (typeof render !== 'function') throw new Error("le module n'exporte pas de fonction render")
    const html = await render({type: msg.type, cell: msg.cell, rows: msg.rows, theme: msg.theme})
    if (token !== seq) return
    root.innerHTML = typeof html === 'string' ? html : ''
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

export const PluginBody: React.FC<CellBodyBaseProps> = ({cell}) => {
    const info = getPluginType(cell.type)
    const frameRef = useRef<HTMLIFrameElement>(null)
    const [ready, setReady] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const payload = useMemo(() => JSON.stringify({
        type: cell.type,
        cell: {id: cell.id, title: cell.title, name: cell.name, json: cell.json ?? {}},
        rows: cell._results ?? [],
        theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
        source: info?.source,
    }), [cell.type, cell.id, cell.title, cell.name, cell.json, cell._results, info?.source])

    useEffect(() => {
        function onMessage(event: MessageEvent) {
            const data = event.data
            if (!data || typeof data !== 'object') return
            if (data.kind === 'sqljob:plugin-ready') setReady(true)
            if (data.kind === 'sqljob:plugin-rendered') {
                setError(data.ok ? null : String(data.error ?? 'erreur inconnue'))
            }
        }
        window.addEventListener('message', onMessage)
        return () => window.removeEventListener('message', onMessage)
    }, [])

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

    return (
        <div className="flex flex-col min-h-0 flex-1">
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
