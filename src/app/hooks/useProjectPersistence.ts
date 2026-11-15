import {useEffect} from 'react'
import {useNotebookStore} from '../store/notebookStore'
import {saveProject} from '../store/projectPersistence'

const DEBOUNCE_MS = 500

/**
 * Sauvegarde le document dans IndexedDB à chaque modification des pages.
 *
 * Ne s'active qu'une fois l'application prête : sinon l'état par défaut
 * écraserait le document persisté avant sa restauration.
 */
export function useProjectPersistence(enabled: boolean): void {
    useEffect(() => {
        if (!enabled) return

        let timer: ReturnType<typeof setTimeout> | undefined
        const unsubscribe = useNotebookStore.subscribe((state, previous) => {
            if (state.pages === previous.pages) return
            if (timer) clearTimeout(timer)
            timer = setTimeout(() => {
                void saveProject(useNotebookStore.getState().pages)
            }, DEBOUNCE_MS)
        })

        // Sauvegarde immédiate si l'onglet est fermé entre deux frappes.
        const flush = () => {
            if (timer) clearTimeout(timer)
            void saveProject(useNotebookStore.getState().pages)
        }
        window.addEventListener('pagehide', flush)

        return () => {
            unsubscribe()
            if (timer) clearTimeout(timer)
            window.removeEventListener('pagehide', flush)
        }
    }, [enabled])
}
