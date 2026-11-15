/**
 * LoopConfigModal + GroupSettingsModal + ChildGroupModal
 */
import { useShallow } from 'zustand/react/shallow'
import { useNotebookStore } from '../../store/notebookStore'
import { ConfigManager } from '../../../lib/ConfigManager'
import { GroupContainer } from '../GroupContainer'
import {
    Button, Input, Label, Textarea,
    Alert, AlertDescription,
    Badge,
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
    Separator,
    Switch,
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@sqlrooms/ui'
import { Icon } from '../../../lib/icons'

// ─── LoopConfigModal ──────────────────────────────────────────────────────────
export function LoopConfigModal() {
    // Le groupe est lu depuis l'état : toute mise à jour immuable change sa
    // référence et re-rend la modale, sans compteur de version.
    const loopConfigModal = useNotebookStore(s => s.loopConfigModal)
    const group = useNotebookStore(s => (s.loopConfigModal.open ? s.getGroupAtPath(s.loopConfigModal.path) : null))
    const { getDefaultLoopQuery, getDefaultZipQuery, updateGroupAt } = useNotebookStore(useShallow(s => ({
        getDefaultLoopQuery: s.getDefaultLoopQuery,
        getDefaultZipQuery: s.getDefaultZipQuery,
        updateGroupAt: s.updateGroupAt,
    })))
    const set = useNotebookStore.setState

    const path = loopConfigModal.path

    return (
        <Dialog open={loopConfigModal.open} onOpenChange={open => !open && set({ loopConfigModal: { open: false, path: null } })}>
            <DialogContent className="max-w-2xl" aria-describedby={undefined}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Icon name="autorenew" size={20} />
                        Configuration de la boucle
                    </DialogTitle>
                </DialogHeader>
                {group && path && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between gap-3">
                            <Label>Activer la boucle sur ce groupe</Label>
                            <Switch
                                checked={!!group.loop?.enabled}
                                onCheckedChange={v => updateGroupAt(path, (g: any) => {
                                    g.loop = g.loop || { enabled: false, query: '', zip: false, zipQuery: '' }
                                    g.loop.enabled = v
                                })}
                            />
                        </div>

                        {group.loop?.enabled && (
                            <div className="space-y-4">
                                <Alert>
                                    <AlertDescription className="text-sm">La requête doit retourner une colonne. Chaque valeur sera utilisée comme variable <code className="bg-muted px-1 rounded text-xs">{"{{ _loop }}"}</code> pour chaque itération du groupe.</AlertDescription>
                                </Alert>
                                <div className="space-y-1">
                                    <Label className="font-semibold">Requête SQL de la boucle</Label>
                                    <Textarea
                                        className="font-mono min-h-32 text-sm"
                                        value={group.loop?.query || ''}
                                        onChange={e => {
                                            const v = e.target.value
                                            updateGroupAt(path, (g: any) => { g.loop.query = v })
                                        }}
                                        placeholder="SELECT DISTINCT colonne FROM source1 LIMIT 10;"
                                    />
                                </div>
                                <Button variant="outline" size="sm" onClick={() => {
                                    const query = getDefaultLoopQuery()
                                    updateGroupAt(path, (g: any) => { g.loop.query = query })
                                }}>
                                    <Icon name="article" size={16} /> Requête par défaut
                                </Button>

                                <Separator />

                                <div className="flex items-center justify-between gap-3">
                                    <Label>Zipper les fichiers générés</Label>
                                    <Switch
                                        checked={!!group.loop?.zip}
                                        onCheckedChange={v => updateGroupAt(path, (g: any) => { g.loop.zip = v })}
                                    />
                                </div>
                                {group.loop?.zip && (
                                    <div className="space-y-1">
                                        <Label className="font-semibold">Requête SQL pour le nom du fichier ZIP</Label>
                                        <Textarea
                                            className="font-mono min-h-16 text-sm"
                                            value={group.loop?.zipQuery || ''}
                                            onChange={e => {
                                                const v = e.target.value
                                                updateGroupAt(path, (g: any) => { g.loop.zipQuery = v })
                                            }}
                                            placeholder="SELECT 'export.zip' as filename;"
                                        />
                                        <Button variant="outline" size="sm" onClick={() => {
                                            const query = getDefaultZipQuery()
                                            updateGroupAt(path, (g: any) => { g.loop.zipQuery = query })
                                        }}>
                                            <Icon name="article" size={16} /> Requête par défaut
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
                <DialogFooter>
                    <Button variant="ghost" onClick={() => set({ loopConfigModal: { open: false, path: null } })}>Fermer</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// ─── GroupSettingsModal ───────────────────────────────────────────────────────
export function GroupSettingsModal() {
    const groupSettingsModal = useNotebookStore(s => s.groupSettingsModal)
    const group = useNotebookStore(s => (s.groupSettingsModal.open ? s.getGroupAtPath(s.groupSettingsModal.path) : null))
    const updateGroupAt = useNotebookStore(s => s.updateGroupAt)
    const set = useNotebookStore.setState

    const path = groupSettingsModal.path

    return (
        <Dialog open={groupSettingsModal.open} onOpenChange={open => !open && set({ groupSettingsModal: { open: false, path: null } })}>
            <DialogContent className="max-w-lg" aria-describedby={undefined}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Icon name="settings" size={20} />
                        Paramètres du groupe
                    </DialogTitle>
                </DialogHeader>
                {group && path && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between gap-3">
                            <Label>Activer le mode accordion</Label>
                            <Switch
                                checked={!!group.accordion}
                                onCheckedChange={v => updateGroupAt(path, (g: any) => { g.accordion = v })}
                            />
                        </div>
                        {group.accordion && (
                            <>
                                <div className="space-y-1">
                                    <Label className="font-semibold">Titre du groupe</Label>
                                    <Input value={group.title || ''}
                                        onChange={e => {
                                            const v = e.target.value
                                            updateGroupAt(path, (g: any) => { g.title = v })
                                        }}
                                        placeholder="Titre affiché dans la bande accordion" />
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <Label>Ouvert par défaut</Label>
                                    <Switch
                                        checked={group.accordionOpen !== false}
                                        onCheckedChange={v => updateGroupAt(path, (g: any) => { g.accordionOpen = v })}
                                    />
                                </div>
                            </>
                        )}
                        <Separator />
                        <div className="flex items-center justify-between gap-3">
                            <Label>Afficher les enfants en onglets (tabsChild)</Label>
                            <Switch
                                checked={!!group.tabsChild}
                                onCheckedChange={v => updateGroupAt(path, (g: any) => { g.tabsChild = v })}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="font-semibold">Nom du groupe (pour onglet)</Label>
                            <Input value={group.name || ''}
                                onChange={e => {
                                    const v = e.target.value
                                    updateGroupAt(path, (g: any) => { g.name = v })
                                }}
                                placeholder="Libellé de l'onglet" />
                        </div>
                        <Separator />
                        <div className="space-y-2">
                            <Label className="font-semibold">Condition d'affichage (queries.main)</Label>
                            <p className="text-xs text-muted-foreground">Requête SQL ou JS. Si définie, le groupe est affiché uniquement si le résultat est truthy.</p>
                            <div className="rounded-lg border border-border p-3 bg-muted/50 space-y-2">
                                <div className="space-y-1">
                                    <Label className="text-sm">Type de langage</Label>
                                    <Select
                                        value={ConfigManager.getGroupIfQuery(group)?.engine || 'sql'}
                                        onValueChange={v => updateGroupAt(path, (g: any) => {
                                            const q = ConfigManager.ensureGroupQueries(g)
                                            if (q) q.engine = v
                                        })}
                                    >
                                        <SelectTrigger className="h-8 text-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="sql">SQL</SelectItem>
                                            <SelectItem value="js">JavaScript</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-sm">Requête</Label>
                                    <Textarea
                                        className="font-mono min-h-20 text-sm"
                                        value={ConfigManager.getGroupIfQuery(group)?.sql || ''}
                                        onChange={e => {
                                            const v = e.target.value
                                            updateGroupAt(path, (g: any) => {
                                                const q = ConfigManager.ensureGroupQueries(g)
                                                if (q) q.sql = v
                                            })
                                        }}
                                        placeholder="SELECT true"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                <DialogFooter>
                    <Button variant="ghost" onClick={() => set({ groupSettingsModal: { open: false, path: null } })}>Fermer</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// ─── ChildGroupModal ──────────────────────────────────────────────────────────
export function ChildGroupModal() {
    const {
        childGroupModal, devMode, isLoading,
        closeChildGroupModal, deleteChildGroupModal,
        addNestedGroup, openAddCellToGroupModal, runGroupAtPath
    } = useNotebookStore(useShallow(s => ({
        childGroupModal: s.childGroupModal,
        devMode: s.devMode,
        isLoading: s.isLoading,
        closeChildGroupModal: s.closeChildGroupModal,
        deleteChildGroupModal: s.deleteChildGroupModal,
        addNestedGroup: s.addNestedGroup,
        openAddCellToGroupModal: s.openAddCellToGroupModal,
        runGroupAtPath: s.runGroupAtPath
    })))

    const open = !!(childGroupModal.open && childGroupModal.group)

    return (
        <Dialog open={open} onOpenChange={open => !open && closeChildGroupModal()}>
            <DialogContent className="w-screen h-screen max-w-none max-h-none rounded-none p-0 flex flex-col [&>button.absolute]:hidden" aria-describedby={undefined}>
                <DialogTitle className="sr-only">Groupe enfant</DialogTitle>
                {/* Header sticky */}
                <div className="flex items-center justify-between bg-primary text-primary-foreground px-6 py-4 shadow-md flex-none">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Icon name="export-notes-outline-sharp" size={24} />
                    </h3>
                    <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20" onClick={closeChildGroupModal}>
                        <Icon name="close" size={16} />
                    </Button>
                </div>

                {/* Contenu scrollable */}
                <div className="flex-1 overflow-y-auto bg-background p-6">
                    <div className="w-full">
                        <div className="border border-border rounded-lg overflow-hidden bg-background">
                            {devMode && (
                                <div className="flex items-center justify-between gap-2 py-2 px-4 bg-primary/10 border-b border-border">
                                    <div className="inline-flex rounded-md overflow-hidden border border-border divide-x divide-border">
                                        <button className="inline-flex items-center justify-center h-6 px-2 text-xs bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                                            onClick={() => runGroupAtPath([-1])} disabled={isLoading} title="Exécuter">
                                            <Icon name="play-arrow" size={16} />
                                        </button>
                                        <button className="inline-flex items-center justify-center h-6 px-2 text-xs bg-background hover:bg-muted"
                                            onClick={() => addNestedGroup([-1])} title="Ajouter un sous-groupe">
                                            <Icon name="create-new-folder" size={16} />
                                        </button>
                                        <button className="inline-flex items-center justify-center h-6 px-2 text-xs bg-background hover:bg-muted"
                                            onClick={() => openAddCellToGroupModal([-1])} title="Ajouter une cellule">
                                            <Icon name="add" size={16} />
                                        </button>
                                        <button className="inline-flex items-center justify-center h-6 px-2 text-xs bg-destructive text-destructive-foreground hover:bg-destructive/80"
                                            onClick={deleteChildGroupModal} title="Supprimer le groupe">
                                            <Icon name="delete" size={16} />
                                        </button>
                                    </div>
                                </div>
                            )}
                            <div className="p-2">
                                {open && (
                                    <GroupContainer
                                        group={childGroupModal.group}
                                        path={[-1]}
                                        depth={0}
                                        isFirst={true}
                                        isLast={true}
                                        siblingCount={1}
                                        inModal={true}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
