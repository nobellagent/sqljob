export const univerSheet = {
    executeHandler: 'executeUniverSheetCell',
    defaultNamePrefix: 'sheet',
    exportFields: ['queries', 'snapshot', 'readOnly', 'title', 'json', 'preserveUserValue'],
    exportJsonMode: 'object',
    initProps: {
        _univerReady: false,
        _univerInstance: null,
        _univerAPI: null,
        _univerModified: false,
        _univerScheduled: false,
    },
    commonParams: ['name', 'title', 'queries'],
    queryCount: 1,
    queryNames: ['main'],
    queryLabels: { main: 'Requête SQL (données initiales, optionnel)' },
    specificParams: [
        { key: 'queries.main.showQueryEditor', label: "Afficher l'éditeur SQL en mode client", inputType: 'checkbox' },
        { key: 'readOnly', label: 'Lecture seule en mode client', tooltip: 'Toujours éditable en mode développeur', inputType: 'checkbox' },
        { key: 'json.univerConfig', label: 'Interface Univer', inputType: 'univerConfig' },
        { key: 'snapshot', label: 'Snapshot Univer (base64 gzip)', tooltip: "Snapshot compressé du classeur — généré automatiquement à l'export si modifié", inputType: 'textarea', rows: 4 },
        { key: 'preserveUserValue', label: 'Ne pas ré-exécuter lors du rafraîchissement DAG', tooltip: "Si coché, cette cellule ne sera pas relancée automatiquement par le DAG quand un paramètre dont elle dépend change", inputType: 'checkbox', defaultValue: false }
    ],
    defaults: {
        queries: [{ name: 'main', sql: '', engine: 'sql', showQueryEditor: false }],
        readOnly: true,
        snapshot: '',
        json: { univerConfig: {} },
        preserveUserValue: false
    },
    bodyFamily: 'univerSheet',
    bodyConfig: { minHeight: '400px' },
    bodyDisplay: { showSkeleton: { excludeWhenSqlEditor: true } }
}
