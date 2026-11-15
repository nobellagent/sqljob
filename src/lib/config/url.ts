// Module extrait de ConfigManager.ts — paramètres d’URL.

    export function getUIParamsFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const uiParams: Record<string, unknown> = {};

        // devMode: boolean
        if (urlParams.has('devMode')) {
            const val = urlParams.get('devMode').toLowerCase();
            uiParams.devMode = val !== 'false' && val !== '0';
        }

        // showLayout: boolean (displaySettings conservé pour rétrocompat)
        if (urlParams.has('showLayout')) {
            const val = urlParams.get('showLayout').toLowerCase();
            uiParams.showLayout = val !== 'false' && val !== '0';
        } else if (urlParams.has('displaySettings')) {
            const val = urlParams.get('displaySettings').toLowerCase();
            uiParams.showLayout = val !== 'false' && val !== '0';
        }

        // theme: string
        if (urlParams.has('theme')) {
            uiParams.theme = urlParams.get('theme');
        }

        // dbEngine: string
        if (urlParams.has('dbEngine')) {
            uiParams.dbEngine = urlParams.get('dbEngine');
        }

        return uiParams;
    }

    export function applyURLParamsToConfig(config) {
        const urlParams = getUIParamsFromURL();
        if (Object.keys(urlParams).length === 0) {
            return config;
        }

        // Créer une copie de la config avec les paramètres URL appliqués
        const result = { ...config };
        result.ui = { ...(config.ui || {}), ...urlParams };
        return result;
    }
