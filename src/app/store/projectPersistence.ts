/**
 * Persistance du document (pages, groupes, cellules) dans IndexedDB.
 *
 * Quatrième couche de persistance, distincte de :
 * - `localStorage` : configuration d'interface (layout, thème) ;
 * - OPFS : données DuckDB ;
 * - Service worker : ressources.
 *
 * IndexedDB est utilisé plutôt que `localStorage` parce que le quota (~5 Mo)
 * ne tient pas un notebook avec des dizaines de cellules et leurs résultats.
 */
import type {NotebookPage} from './types'

const DB_NAME = 'sqljob'
const DB_VERSION = 1
const STORE = 'project'
const KEY = 'current'

export interface StoredProject {
    version: 1
    updatedAt: string
    pages: NotebookPage[]
}

function openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        if (typeof indexedDB === 'undefined') {
            reject(new Error('IndexedDB indisponible'))
            return
        }
        const request = indexedDB.open(DB_NAME, DB_VERSION)
        request.onupgradeneeded = () => {
            const db = request.result
            if (!db.objectStoreNames.contains(STORE)) {
                db.createObjectStore(STORE)
            }
        }
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error ?? new Error('Ouverture IndexedDB impossible'))
    })
}

function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    return openDb().then(
        db =>
            new Promise<T>((resolve, reject) => {
                const transaction = db.transaction(STORE, mode)
                const request = run(transaction.objectStore(STORE))
                request.onsuccess = () => resolve(request.result)
                request.onerror = () => reject(request.error ?? new Error('Écriture IndexedDB refusée'))
                transaction.oncomplete = () => db.close()
            }),
    )
}

/** Lit le document persisté, ou null s'il n'y en a pas. */
export async function loadProject(): Promise<NotebookPage[] | null> {
    try {
        const stored = await tx<StoredProject | undefined>('readonly', store => store.get(KEY))
        if (!stored || !Array.isArray(stored.pages) || stored.pages.length === 0) {
            return null
        }
        return stored.pages
    } catch (err) {
        console.warn('[persistence] lecture impossible :', err)
        return null
    }
}

/** Écrit le document. Les erreurs de quota ne doivent pas casser l'application. */
export async function saveProject(pages: NotebookPage[]): Promise<boolean> {
    try {
        const payload: StoredProject = {
            version: 1,
            updatedAt: new Date().toISOString(),
            pages,
        }
        await tx('readwrite', store => store.put(payload, KEY))
        return true
    } catch (err) {
        console.warn('[persistence] écriture impossible :', err)
        return false
    }
}

/** Supprime le document persisté (réinitialisation). */
export async function clearProject(): Promise<void> {
    try {
        await tx('readwrite', store => store.delete(KEY))
    } catch (err) {
        console.warn('[persistence] suppression impossible :', err)
    }
}
