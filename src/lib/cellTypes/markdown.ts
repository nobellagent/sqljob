export const markdown = {
    executeHandler: 'executeMarkdownCell',
    defaultNamePrefix: 'markdown',
    bodyDisplay: { showSkeleton: { when: 'running', skipWhenEngineText: true } },
    exportFields: ['queries'],
    contentKey: 'queries.main',
    contentResultKey: '_markdownContent',
    commonParams: ['name', 'queries'],
    queryCount: 1,
    queryNames: ['main'],
    specificParams: [
        { key: 'queries.main.engine', label: 'Type de langage', tooltip: "Texte: Markdown saisi directement | SQL: requête retournant du Markdown | JS: expression JavaScript retournant du Markdown", inputType: 'select', options: [{ value: 'text', label: 'Texte' }, { value: 'sql', label: 'SQL' }, { value: 'js', label: 'JavaScript' }] },
        { key: 'queries.main.showQueryEditor', label: "Afficher l'éditeur en mode client", inputType: 'checkbox' }
    ],
    defaults: { queries: [{ name: 'main', sql: '# Nouvelle section', engine: 'text', showQueryEditor: false }] },
    bodyFamily: 'markdown',
    bodyConfig: { devModeToolbar: ['bold', 'italic', 'heading', '|', 'quote', 'unordered-list', 'ordered-list', '|', 'link', 'image', '|', 'preview', '|', 'guide'], devTextareaId: 'markdown_dev_', clientTextareaId: 'markdown_cli_' }
}
