export const perspective = {
    executeHandler: 'executePerspectiveCell',
    defaultNamePrefix: 'perspective',
    exportFields: ['queries', 'json', 'preserveUserValue'],
    exportJsonMode: 'object',
    initProps: { _perspectiveReady: false, _perspectiveWorker: null, _perspectiveTable: null, _arrowTable: null },
    commonParams: ['name', 'queries'],
    queryCount: 1,
    queryNames: ['main'],
    queryLabels: { main: 'Requête SQL (données pour Perspective)' },
    specificParams: [
        { key: 'json.perspectiveConfig', label: 'Configuration Perspective (JSON optionnel)', tooltip: "Configuration JSON pour le viewer Perspective (group_by, columns, sort, plugin, theme, etc.)", inputType: 'textarea', rows: 10, placeholder: '{"plugin": "Datagrid", "theme": "Pro Dark", ...}' },
        { key: 'perspectiveCdns', label: 'CDN Perspective.js à charger', tooltip: "Sélectionnez les modules CDN nécessaires", inputType: 'perspectiveCdns' },
        { key: 'queries.main.showQueryEditor', label: "Afficher l'éditeur SQL en mode client", tooltip: "Si décoché, l'éditeur SQL ne sera visible qu'en mode développeur.", inputType: 'checkbox' },
        { key: 'preserveUserValue', label: 'Ne pas ré-exécuter lors du rafraîchissement DAG', tooltip: "Si coché, cette cellule ne sera pas relancée automatiquement par le DAG quand un paramètre dont elle dépend change", inputType: 'checkbox', defaultValue: false }
    ],
    defaults: {
        queries: [{ name: 'main', sql: 'SELECT * FROM source1', engine: 'sql', showQueryEditor: false }],
        json: { perspectiveConfig: '' },
        perspectiveCdns: { viewer: true, datagrid: true, d3fc: true, openlayers: false },
        preserveUserValue: false
    },
    bodyFamily: 'sqlWithPerspective',
    bodyConfig: { theme: 'Pro Light', minHeight: '400px' },
    bodyDisplay: { showSkeleton: { excludeWhenSqlEditor: true } }
}
