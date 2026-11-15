export const pdfme = {
    executeHandler: 'executePdfmeCell',
    defaultNamePrefix: 'pdfme',
    secondQueryName: 'filename',
    skippedWhenButtonLabel: true,
    exportFields: ['queries', 'json', 'buttonLabel'],
    exportJsonMode: 'string',
    initProps: {},
    commonParams: ['name', 'queries', 'buttonLabel'],
    queryCount: 2,
    queryNames: ['main', 'filename'],
    queryLabels: { main: 'Requête SQL (données pour le PDF)', filename: "Requête nom de fichier PDF" },
    specificParams: [
        { key: 'json', label: 'Template pdfme (JSON)', tooltip: "Template pdfme avec basePdf et schemas. Voir https://pdfme.com/docs/getting-started", inputType: 'textarea', rows: 15, placeholder: '{"basePdf": {...}, "schemas": [...]}' }
    ],
    defaults: {
        json: '',
        queries: [
            { name: 'main', sql: "with v_source as (select * from source1 limit 10)\nSELECT 'Titre' as header, 'Pied de page' as footer, json_group_array(json_array(col1, col2, col3)) as datatable\nFROM v_source LIMIT 10", engine: 'sql', showQueryEditor: false },
            { name: 'filename', sql: "SELECT '{{_loop}}' || '_2.pdf'", engine: 'sql', showQueryEditor: false }
        ],
        buttonLabel: '📑 Générer le PDF'
    },
    bodyFamily: 'pdfme',
    bodyConfig: {
        queryLabels: ['Requête de données', 'Requête nom de fichier PDF'],
        jsonLabel: 'Template pdfme (JSON)',
        jsonPlaceholder: '{"basePdf": {...}, "schemas": [...]}',
        defaultButtonLabel: '📑 Générer le PDF'
    }
}
