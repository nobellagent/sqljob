/**
 * Base URL des exports HTML.
 *
 * Un export HTML est un fichier autonome : il doit pointer vers un bundle
 * accessible, et non vers le déploiement d'origine du projet. La base est donc
 * déduite de l'endroit d'où tourne le code :
 *
 * 1. surcharge explicite (`sqljob.export.baseUrl` dans localStorage) ;
 * 2. URL du module courant, quand elle est servie depuis un `dist-cdn/`
 *    (GitHub Pages, zip local, jsDelivr) ;
 * 3. dossier de la page, quand elle est servie en http(s) ;
 * 4. déploiement canonique en dernier recours (`file://`, contexte inconnu).
 */

export const CANONICAL_APP_BASE = 'https://nobellagent.github.io/sqljob/'

function withTrailingSlash(url: string): string {
    return url.endsWith('/') ? url : `${url}/`
}

export interface BaseUrlInputs {
    /** `import.meta.url` du code en cours d'exécution. */
    moduleUrl?: string
    /** `window.location.href`. */
    pageUrl?: string
    /** Surcharge utilisateur, si définie. */
    override?: string | null
}

export function resolveAppBase(inputs: BaseUrlInputs): string {
    if (inputs.override) return withTrailingSlash(inputs.override)

    if (inputs.moduleUrl) {
        try {
            const url = new URL(inputs.moduleUrl)
            if (/\/dist-cdn\/[^/]+\.m?js$/.test(url.pathname)) {
                return new URL('../', url).toString()
            }
        } catch {
            // URL illisible : on passe au cas suivant
        }
    }

    if (inputs.pageUrl) {
        try {
            const url = new URL(inputs.pageUrl)
            if (url.protocol === 'http:' || url.protocol === 'https:') {
                return new URL('.', url).toString()
            }
        } catch {
            // idem
        }
    }

    return CANONICAL_APP_BASE
}

/** Base effective, lue depuis le contexte courant. */
export function getAppBaseUrl(): string {
    const hasWindow = typeof window !== 'undefined'
    let override: string | null = null
    try {
        override = hasWindow ? window.localStorage.getItem('sqljob.export.baseUrl') : null
    } catch {
        override = null
    }
    return resolveAppBase({
        moduleUrl: import.meta.url,
        pageUrl: hasWindow ? window.location.href : undefined,
        override,
    })
}
