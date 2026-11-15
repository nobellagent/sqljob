export const iframe = {
    executeHandler: 'executeIframeCell',
    defaultNamePrefix: 'iframe',
    showInViewWhenResultOrRunning: true,
    exportFields: ['queries'],
    initProps: {},
    commonParams: ['name', 'queries'],
    queryCount: 1,
    queryNames: ['main'],
    specificParams: [
        { key: 'queries.main.engine', label: 'Type de langage', tooltip: "SQL: requête retournant du HTML | JS: retourne une chaîne HTML | Texte: HTML saisi directement", inputType: 'select', options: [{ value: 'sql', label: 'SQL' }, { value: 'js', label: 'JavaScript' }, { value: 'text', label: 'Texte' }] },
        { key: 'queries.main.showQueryEditor', label: "Afficher l'éditeur SQL en mode client", tooltip: "Si décoché, l'éditeur SQL ne sera visible qu'en mode développeur. En mode client, seul le résultat sera affiché.", inputType: 'checkbox' }
    ],
    defaults: { queries: [{ name: 'main', sql: '<html><body><h1>Hello</h1></body></html>', engine: 'text', showQueryEditor: false }] },
    bodyFamily: 'sqlWithIframe',
    bodyConfig: { useIframeEditor: true },
    bodyDisplay: { showSkeleton: { excludeWhenSqlEditor: true } }
}
