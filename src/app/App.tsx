/**
 * Composant racine React — remplace mount.ts + htmlTemplates.generateAppHTML()
 *
 * Logique de chargement :
 * 1. Charge la config depuis Gist/URL (ConfigManager.loadConfigFromGist)
 * 2. Si la config est chiffrée → affiche GistPassphraseModal
 * 3. Sinon → initialise le store Zustand + affiche NotebookLayout
 */
import { useEffect, useState } from 'react'
import { ThemeProvider } from '@sqlrooms/ui'
import { Toaster } from '@sqlrooms/ui'
import { Spinner } from '@sqlrooms/ui'
import { ConfigManager } from '../lib/ConfigManager'
import { useNotebookStore } from './store/notebookStore'
import { useTemplateModal } from './store/uiStores'
import { Room } from './room'
import { GistPassphraseModal } from './components/modals/GistPassphraseModal'
import { loadProject } from './store/projectPersistence'
import { useProjectPersistence } from './hooks/useProjectPersistence'

type AppState = 'loading' | 'passphrase' | 'ready'

/**
 * Vrai si une configuration est fournie de l'extérieur (HTML exporté, URL, Gist).
 * Dans ce cas le document local ne doit pas prendre le dessus.
 */
function hasProvidedConfig(): boolean {
    const embedded = document.getElementById('defaultConfigBase64')?.textContent?.trim()
    if (embedded) return true
    const query = new URLSearchParams(window.location.search)
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const keys = ['gist', 'config', 'data', 'c', 'json', 'url']
    return keys.some(key => query.has(key) || hash.has(key))
}

function AppContent() {
    const [appState, setAppState] = useState<AppState>('loading')
    const initFromConfig = useNotebookStore(s => s.initFromConfig)

    useEffect(() => {
        // Wiring du templateModal : quand selectTemplate est appelé,
        // déléguer à l'action Zustand du notebookStore
        useTemplateModal.setState({
            _onSelectTemplate: (cellId, queryType, templateIndex, languageType) => {
                // TODO: type applyTemplateToCell — comes from sqlrooms notebook slice
                ;(useNotebookStore.getState() as any).applyTemplateToCell?.(cellId, queryType, templateIndex, languageType)
            }
        })

        // Chargement de la config
        ConfigManager.loadConfigFromGist().then(async (loadResult: any) => {
            if (loadResult?.needsPassphrase && loadResult?.encryptedContent) {
                window._pendingEncryptedGist = loadResult.encryptedContent
                window._encryptedSource = loadResult.source || 'gist'
                setAppState('passphrase')
            } else {
                if (loadResult) {
                    initFromConfig(loadResult)
                }
                // `loadConfigFromGist()` renvoie toujours une config (celle par défaut en dernier
                // recours) : il faut donc détecter explicitement l'absence de config externe
                // avant de restaurer le document local, sinon celui-ci est écrasé.
                if (!hasProvidedConfig()) {
                    const pages = await loadProject()
                    if (pages) {
                        useNotebookStore.getState().setPages(pages)
                    }
                }
                setAppState('ready')
            }
        })
    }, [])

    // Remplace le hook init() d'Alpine (appelé automatiquement au montage du composant Alpine).
    // On l'appelle dès que l'app passe en état 'ready' : initialise DuckDB, charge les fichiers,
    // évalue les ifQuery et auto-exécute les groupes.
    useEffect(() => {
        if (appState === 'ready') {
            useNotebookStore.getState().init?.()
        }
    }, [appState])

    // Sauvegarde continue du document dans IndexedDB.
    useProjectPersistence(appState === 'ready')

    if (appState === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Spinner className="h-8 w-8 text-primary" />
                    <p className="text-muted-foreground">Chargement...</p>
                </div>
            </div>
        )
    }

    if (appState === 'passphrase') {
        return (
            <GistPassphraseModal
                onUnlocked={() => setAppState('ready')}
            />
        )
    }

    return <Room />
}

export function App() {
    return (
        <ThemeProvider defaultTheme="light" storageKey="sqljob-theme">
            <AppContent />
            <Toaster />
        </ThemeProvider>
    )
}
