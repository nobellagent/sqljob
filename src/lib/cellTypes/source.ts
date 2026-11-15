export const source = {
    executeHandler: 'executeSourceCell',
    defaultNamePrefix: 'source',
    showNameInHeader: true,
    secondQueryName: 'fallback',
    requiresFileBeforeRun: true,
    exportRuntimeBlob: true,
    namePattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/,
    exportFields: ['name', 'title', 'queries', 'json', 'preserveUserValue'],
    exportFileSlot: 'source',
    initProps: { _isDragging: false, _loaded: false },
    initFileSlot: { slot: 'source', asBlob: true },
    commonParams: ['name', 'title', 'queries'],
    queryCount: 2,
    queryNames: ['main', 'fallback'],
    queryLabels: { main: "Requête d'import", fallback: "Requête de fallback (si erreur)" },
    titleLabel: "Texte de la zone d'import",
    titleTooltip: "Texte affiché dans la zone de drag & drop",
    specificParams: [
        { key: 'json.xlsx', label: 'Configuration Excel (JSON)', tooltip: "Options pour la conversion des fichiers .xlsx/.xls", inputType: 'textarea', rows: 5 },
        { key: 'preserveUserValue', label: 'Ne pas ré-exécuter lors du rafraîchissement DAG', tooltip: "Si coché, cette cellule ne sera pas relancée automatiquement par le DAG quand un paramètre dont elle dépend change", inputType: 'checkbox', defaultValue: false }
    ],
    defaults: {
        title: 'Glissez-déposez votre fichier ici',
        queries: [
            { name: 'main', sql: "CREATE OR REPLACE TABLE {name} AS SELECT * FROM '{{_fileName}}'", engine: 'sql', showQueryEditor: false },
            { name: 'fallback', sql: "CREATE OR REPLACE TABLE {name} AS SELECT * FROM query( CASE WHEN lower('{{_fileName}}') LIKE '%.csv' OR lower('{{_fileName}}') LIKE '%.csv.gz' THEN 'SELECT * FROM read_csv(''' || '{{_fileName}}' || ''', HEADER = true, AUTO_DETECT = true, SAMPLE_SIZE = -1, IGNORE_ERRORS = true, store_rejects = true)' WHEN lower('{{_fileName}}') LIKE '%.xlsx' THEN 'SELECT * FROM read_xlsx(''' || '{{_fileName}}' || ''', HEADER = true, STOP_AT_EMPTY = false, EMPTY_AS_VARCHAR = true, IGNORE_ERRORS = true)' WHEN lower('{{_fileName}}') LIKE '%.tsv' OR lower('{{_fileName}}') LIKE '%.tsv.gz' OR lower('{{_fileName}}') LIKE '%.txt' OR lower('{{_fileName}}') LIKE '%.txt.gz' THEN 'SELECT * FROM read_csv(''' || '{{_fileName}}' || ''', HEADER = true, DELIM = ''\t'', AUTO_DETECT = true, SAMPLE_SIZE = -1, IGNORE_ERRORS = true, store_rejects = true)' WHEN lower('{{_fileName}}') LIKE '%.parquet' OR lower('{{_fileName}}') LIKE '%.parquet.gz' THEN 'SELECT * FROM read_parquet(''' || '{{_fileName}}' || ''')' ELSE 'SELECT 1' END );", engine: 'sql', showQueryEditor: false }
        ],
        json: { xlsx: { options: { type: 'array', raw: false, dateNF: 'dd/mm/yyyy', cellDates: true }, toCsvOptions: { dateNF: 'dd/mm/yyyy', FS: ',', RS: '\n' }, sheetSelection: { type: { auto: true }, index: 0, name: '' } } },
        preserveUserValue: false
    },
    bodyFamily: 'fileDropZone',
    bodyConfig: { fileSlot: 'source', fileKey: '_fileName', fileBase64Key: 'fileBase64', fileFileNameKey: 'fileName', accept: '.csv,.parquet,.xlsx,.xls', inputId: 'fileInput_', emptyIcon: 'material-symbols-light:create-new-folder', emptyTitleKey: 'title', emptySubtitle: "→ {name}", handlers: { drop: 'handleSingleSourceDrop', select: 'handleSingleSourceFileSelect', remove: 'removeSingleSourceFile', download: 'downloadSourceFile' }, minHeight: '80px', showQueryInDevMode: true },
    bodyDisplay: { showSkeleton: { when: 'running', sourceLoading: true } }
}
