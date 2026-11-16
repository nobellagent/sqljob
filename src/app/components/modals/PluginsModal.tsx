/**
 * Onglet Plugins : registre, installation, activation, désinstallation.
 *
 * Les permissions déclarées sont affichées **avant** le bouton d'installation.
 * Elles décrivent l'intention du plugin, pas ce que le navigateur empêchera :
 * un plugin JS s'exécute avec les pouvoirs de la page qui le charge (voir
 * `docs/plugins.md`).
 */
import {useEffect, useState} from 'react'
import {
    Button, Input, Label, Badge, Switch,
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@sqlrooms/ui'
import {usePlugins} from '../../plugins/usePlugins'
import {
    getRegistryUrl, install, loadRegistry, setRegistryUrl, setEnabled, uninstall,
} from '../../plugins/pluginRuntime'
import type {PluginPermission} from '../../../core/plugins'

const PERMISSION_LABELS: Record<string, string> = {
    'duckdb:read': 'Lire la base DuckDB',
    'duckdb:write': 'Écrire dans la base DuckDB',
    'ui:render': 'Afficher une interface de cellule',
    'storage:local': 'Utiliser le stockage local du navigateur',
}

function permissionLabel(permission: PluginPermission): string {
    if (permission.startsWith('network:')) return `Accéder au réseau : ${permission.slice('network:'.length)}`
    return PERMISSION_LABELS[permission] ?? permission
}

export function PluginsModal({open, onOpenChange}: {open: boolean; onOpenChange: (open: boolean) => void}) {
    const {installed, embedded, registry, busy, error} = usePlugins()
    const [url, setUrl] = useState(getRegistryUrl())
    const [localError, setLocalError] = useState<string | null>(null)
    // Un fichier exporté s'ouvre en file:// : aucun registre n'y est joignable.
    const offline = typeof window !== 'undefined' && window.location.protocol === 'file:'

    useEffect(() => {
        if (open && !registry && !offline) loadRegistry().catch(() => undefined)
    }, [open, registry, offline])

    const installedIds = new Set(installed.map(p => p.manifest.id))
    const available = (registry?.plugins ?? []).filter(p => !installedIds.has(p.id))

    async function run(action: () => Promise<unknown>) {
        setLocalError(null)
        try {
            await action()
        } catch (err) {
            setLocalError((err as Error).message)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Plugins</DialogTitle>
                </DialogHeader>

                <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Registre</Label>
                    <div className="flex gap-2">
                        <Input value={url} onChange={e => setUrl(e.target.value)} className="h-8 text-sm" />
                        <Button variant="outline" size="sm" onClick={() => run(async () => {
                            setRegistryUrl(url)
                            await loadRegistry()
                        })}>Charger</Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Le registre associe un identifiant à un module et à son empreinte sha256.
                        L'empreinte est vérifiée avant toute installation.
                    </p>
                </div>

                {offline && (
                    <div className="text-xs text-muted-foreground border border-border rounded px-2 py-1">
                        Fichier exporté : le registre n'est pas joignable hors ligne. Les plugins
                        utilisés par le document sont déjà embarqués et actifs.
                    </div>
                )}

                {(error || localError) && (
                    <div className="text-sm text-destructive border border-destructive/40 rounded px-2 py-1">
                        {localError ?? error}
                    </div>
                )}

                {embedded.length > 0 && (
                    <section className="space-y-2">
                        <h3 className="text-sm font-semibold">Embarqués dans le document ({embedded.length})</h3>
                        {embedded.map(plugin => (
                            <div key={plugin.id} className="border border-border rounded p-2 space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                    <div>
                                        <span className="font-medium text-sm">{plugin.name ?? plugin.id}</span>
                                        <Badge variant="outline" className="ml-2 text-xs">v{plugin.version}</Badge>
                                        <Badge variant="secondary" className="ml-2 text-xs">embarqué</Badge>
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground">Types : {plugin.types.join(', ')}</p>
                            </div>
                        ))}
                    </section>
                )}

                <section className="space-y-2">
                    <h3 className="text-sm font-semibold">Installés ({installed.length})</h3>
                    {installed.length === 0 && <p className="text-sm text-muted-foreground">Aucun plugin installé.</p>}
                    {installed.map(plugin => (
                        <div key={plugin.manifest.id} className="border border-border rounded p-2 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                                <div>
                                    <span className="font-medium text-sm">{plugin.manifest.name ?? plugin.manifest.id}</span>
                                    <Badge variant="outline" className="ml-2 text-xs">v{plugin.manifest.version}</Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Switch
                                        checked={plugin.enabled}
                                        onCheckedChange={checked => run(() => setEnabled(plugin.manifest.id, checked))}
                                    />
                                    <Button variant="ghost" size="sm" onClick={() => run(async () => uninstall(plugin.manifest.id))}>
                                        Désinstaller
                                    </Button>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Types : {plugin.manifest.types.join(', ')} · {plugin.manifest.permissions.map(permissionLabel).join(' · ') || 'aucune permission déclarée'}
                            </p>
                        </div>
                    ))}
                </section>

                <section className="space-y-2">
                    <h3 className="text-sm font-semibold">Disponibles ({available.length})</h3>
                    {!registry && <p className="text-sm text-muted-foreground">Registre non chargé.</p>}
                    {registry && available.length === 0 && <p className="text-sm text-muted-foreground">Rien à installer.</p>}
                    {available.map(entry => (
                        <div key={entry.id} className="border border-border rounded p-2 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                                <div>
                                    <span className="font-medium text-sm">{entry.name ?? entry.id}</span>
                                    <Badge variant="outline" className="ml-2 text-xs">v{entry.version}</Badge>
                                    {entry.withdrawn && <Badge variant="destructive" className="ml-2 text-xs">retiré</Badge>}
                                </div>
                                <Button
                                    size="sm"
                                    disabled={busy || Boolean(entry.withdrawn)}
                                    onClick={() => run(async () => install(entry.id))}
                                >
                                    Installer
                                </Button>
                            </div>
                            {entry.description && <p className="text-xs text-muted-foreground">{entry.description}</p>}
                            <p className="text-xs text-muted-foreground">
                                Types : {entry.types.join(', ')} · Permissions : {entry.permissions.map(permissionLabel).join(' · ') || 'aucune'}
                            </p>
                        </div>
                    ))}
                </section>

                <p className="text-xs text-muted-foreground border-t border-border pt-2">
                    Un plugin s'exécute dans une iframe sandboxée pour l'affichage, mais son code reste
                    du JavaScript non isolé : les permissions sont une déclaration, pas une barrière.
                </p>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Fermer</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
