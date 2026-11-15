export const publipostageWord = {
    executeHandler: 'executePublipostageWordCell',
    defaultNamePrefix: 'docx',
    secondQueryName: 'filename',
    skippedWhenButtonLabel: true,
    exportTemplateBase64: true,
    exportFields: ['queries', 'buttonLabel'],
    exportFileSlot: 'docxTemplate',
    initProps: { _isDragging: false },
    initFileSlot: { slot: 'docxTemplate', asBlob: false },
    commonParams: ['name', 'buttonLabel'],
    queryCount: 2,
    queryNames: ['main', 'filename'],
    queryLabels: { main: 'Requête SQL (données)', filename: 'Requête nom de fichier' },
    specificParams: [],
    defaults: {
        queries: [
            { name: 'main', sql: 'SELECT * FROM source1 LIMIT 10', engine: 'sql', showQueryEditor: false },
            { name: 'filename', sql: "SELECT 'document_' || STRFTIME(current_timestamp::TIMESTAMP, '%Y-%m-%d_%H-%M-%S') || '.docx' AS filename;", engine: 'sql', showQueryEditor: false }
        ],
        buttonLabel: 'Générer les documents'
    },
    bodyFamily: 'publipostageWord',
    bodyConfig: {
        fileSlot: 'docxTemplate',
        fileKey: 'docxTemplateFileName',
        fileBase64Key: 'docxTemplateBase64',
        fileFileNameKey: 'docxTemplateFileName',
        accept: '.docx', emptyIcon: 'material-symbols-light:description',
        emptyTitle: 'Glissez-déposez votre template Word (.docx)',
        emptySubtitle: 'Template de publipostage',
        queryLabels: ['Requête de données', 'Requête de nom de fichier'],
        defaultButtonLabel: 'Générer les documents',
        buttonDisabledCondition: '!cellItem.cell.docxTemplateFileName'
    }
}
