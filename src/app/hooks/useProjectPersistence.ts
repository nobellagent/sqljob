import {useEffect} from 'react'
import {useNotebookStore} from '../store/notebookStore'
import {saveProject} from '../store/projectPersistence'
import {serializeForStorage} from '../store/serializeProject'

const DEBOUNCE_MS = 600
/**
 * Fenêtre pendant laquelle un document vide n'est pas sauvegardé.
 *
 * Au démarrage, la restauration IndexedDB peut échouer ou être dépassée par une
 * navigation : sauvegarder aussitôt l'état initial (vide) écraserait le document
 * de l'utilisateur. Passé ce délai, un document vide est une action délibérée
 * (suppression du dernier groupe) et il est sauvegardé normalement.
 */
const EMPTY_SAVE_GUARD_MS = 8000

/** Vrai si le document ne contient aucun groupe, sur aucune page. */
function isEmptyDocument(pages: any[] | undefined): boolean {
    if (!pages || pages.length === 0) return true
    return pages.every((page: any) => (page?.groups?.length ?? 0) === 0)
}

/**
 * Sauvegarde le document dans IndexedDB à chaque modification.
 *
 * Le store abonne `schedule` à chaque changement d'état (mises à jour
 * immuables), puis on sérialise et compare le contenu avant d'écrire : deux
 * notifications rapprochées ne produisent donc qu'une seule sauvegarde.
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
        const startedAt = Date.now()

        const flush = async () => {
            if (writing) return
            const pages = useNotebookStore.getState().pages
            if (!pages || pages.length === 0) return
            if (isEmptyDocument(pages) && Date.now() - startedAt < EMPTY_SAVE_GUARD_MS) {
                console.warn('[sqljob] document vide au démarrage : sauvegarde reportée')
                return
            }

            let serialized: string
            try {
                serialized = serializeForStorage(pages)
            } catch {
                return
            }
            if (!serialized || serialized === lastSaved) return

            writing = true
            const ok = await saveProject(pages)
            writing = false
            if (ok) lastSaved = serialized
        }

        const schedule = () => {
            if (timer) clearTimeout(timer)
            timer = setTimeout(() => void flush(), DEBOUNCE_MS)
        }

        // Chaque mise à jour immuable notifie les abonnés du store.
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
