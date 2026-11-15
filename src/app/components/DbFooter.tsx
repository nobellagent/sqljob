import {useCallback, useEffect, useState} from 'react'
import {DatabaseIcon, HardDriveIcon, RotateCcwIcon} from 'lucide-react'
import {useBaseRoomShellStore} from '@sqlrooms/room-shell'
import {executeCommand} from '../../core/commands'
import {DuckDBManager} from '../../lib/DuckDBManager'

function formatBytes(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes <= 0) return '0 o'
    const units = ['o', 'Ko', 'Mo', 'Go']
    let value = bytes
    let unit = 0
    while (value >= 1024 && unit < units.length - 1) {
        value /= 1024
        unit += 1
    }
    return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`
}

/**
 * Indicateur compact pour la barre d'outils : taille de la base, mode de
 * persistance, et accès au panneau Sources.
 */
export function DbStatusBadge() {
    const [size, setSize] = useState<number | null>(null)
    const togglePanel = useBaseRoomShellStore(s => s.layout.togglePanel)

    useEffect(() => {
        let cancelled = false
        const read = async () => {
            try {
                const conn = DuckDBManager.getConnection()
                if (!conn) return
                const result = await conn.query('SELECT database_size FROM pragma_database_size()')
                const row = result.toArray?.()[0]
                const value = row ? Number(Object.fromEntries(row).database_size) : NaN
                if (!cancelled) setSize(Number.isFinite(value) ? value : null)
            } catch {
                if (!cancelled) setSize(null)
            }
        }
        void read()
        const timer = setInterval(read, 15_000)
        return () => {
            cancelled = true
            clearInterval(timer)
        }
    }, [])

    return (
        <button
            type="button"
            onClick={() => togglePanel('data')}
            title={`Base ${DuckDBManager.usingPersistence ? 'persistante (OPFS)' : 'en mémoire'} — ouvrir les sources`}
            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary/60"
        >
            <DatabaseIcon className="h-3.5 w-3.5" />
            <span>{size === null ? 'base' : formatBytes(size)}</span>
            <span
                className={`px-1 rounded text-[10px] font-medium ${
                    DuckDBManager.usingPersistence
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                }`}
            >
                {DuckDBManager.usingPersistence ? 'OPFS' : 'RAM'}
            </span>
        </button>
    )
}

/**
 * Pied du panneau Sources : moteur, taille de la base, persistance et
 * réinitialisation. La réinitialisation passe par la commande `db.reset`
 * (elle n'est pas réimplémentée ici).
 */
export function DbFooter() {
    const [size, setSize] = useState<number | null>(null)
    const [busy, setBusy] = useState(false)

    const refresh = useCallback(async () => {
        try {
            const conn = DuckDBManager.getConnection()
            if (!conn) return
            const result = await conn.query('SELECT database_size FROM pragma_database_size()')
            const row = result.toArray?.()[0]
            const value = row ? Number(Object.fromEntries(row).database_size) : NaN
            setSize(Number.isFinite(value) ? value : null)
        } catch {
            setSize(null)
        }
    }, [])

    useEffect(() => {
        void refresh()
    }, [refresh])

    const reset = async () => {
        setBusy(true)
        try {
            await executeCommand('db.reset')
            setTimeout(() => void refresh(), 1500)
        } finally {
            setBusy(false)
        }
    }

    return (
        <div className="shrink-0 border-t border-border px-3 py-2 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-2 min-w-0">
                <HardDriveIcon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">
                    {size === null ? 'Base DuckDB' : formatBytes(size)}
                </span>
                <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        DuckDBManager.usingPersistence
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                    }`}
                    title={
                        DuckDBManager.usingPersistence
                            ? 'Les données sont conservées dans le navigateur (OPFS)'
                            : 'Base en mémoire : les données seront perdues au rechargement'
                    }
                >
                    {DuckDBManager.usingPersistence ? 'OPFS' : 'mémoire'}
                </span>
            </div>
            <button
                type="button"
                onClick={reset}
                disabled={busy}
                title="Vider la base et repartir de zéro"
                className="flex items-center gap-1 hover:text-foreground disabled:opacity-50"
            >
                {busy ? <DatabaseIcon className="h-3.5 w-3.5 animate-pulse" /> : <RotateCcwIcon className="h-3.5 w-3.5" />}
                Réinitialiser
            </button>
        </div>
    )
}
