import {useEffect} from 'react'
import {useNotebookStore} from '../store/notebookStore'
import {saveProject} from '../store/projectPersistence'

const DEBOUNCE_MS = 600

/**
 * Sauvegarde le document dans IndexedDB à chaque modification.
 *
 * ⚠️ Le store mute `pages` **en place** (`group.cells.push(...)`) et signale le
 * changement par un `set()` sur `_rev`. Comparer la référence de `pages` ne
 * détecte donc aucune édition de cellule : on sérialise et on compare le
 * contenu au moment où l'écriture est déclenchée.
 *
 * Ne s'active qu'une fois l'application prête : sinon l'état par défaut
 * écraserait le document persisté avant sa restauration.
 */
export function useProjectPersistence(enabled: boolean): void {
    useEffect(() => {
        if (!enabled) return

        let timer: ReturnType<typeof setTimeout> | undefined
        let lastSaved: string | null = null
        let writing = false

        const flush = async () => {
            if (writing) return
            const pages = useNotebookStore.getState().pages
            if (!pages || pages.length === 0) return

            let serialized: string
            try {
                serialized = JSON.stringify(pages)
            } catch {
                // Document non sérialisable (référence circulaire) : on n'écrit pas.
                return
            }
            if (serialized === lastSaved) return

            writing = true
            const ok = await saveProject(pages)
            writing = false
            if (ok) lastSaved = serialized
        }

        const schedule = () => {
            if (timer) clearTimeout(timer)
            timer = setTimeout(() => void flush(), DEBOUNCE_MS)
        }

        // `set()` est appelé après chaque mutation profonde (via `_rev`).
        const unsubscribe = useNotebookStore.subscribe(schedule)

        const flushNow = () => {
            if (timer) clearTimeout(timer)
            void flush()
        }
        const onVisibility = () => {
            if (document.visibilityState === 'hidden') flushNow()
        }

        window.addEventListener('pagehide', flushNow)
        document.addEventListener('visibilitychange', onVisibility)
        // Première écriture : fige l'état restauré même sans interaction.
        schedule()

        return () => {
            unsubscribe()
            if (timer) clearTimeout(timer)
            window.removeEventListener('pagehide', flushNow)
            document.removeEventListener('visibilitychange', onVisibility)
        }
    }, [enabled])
}
