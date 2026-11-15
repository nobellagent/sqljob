export const sql = {
    executeHandler: 'executeSqlRecursiveParseCell',
    defaultNamePrefix: 'sql',
    showNameInHeader: true,
    hideInViewMode: true,
    exportFields: ['queries', 'materialized', 'preserveUserValue'],
    initProps: {},
    commonParams: ['name', 'queries'],
    queryCount: 1,
    queryNames: ['main'],
    specificParams: [
        { key: 'queries.main.showQueryResult', label: "Afficher le résultat en mode client", tooltip: "Si décoché, le datatable et la visualisation ne seront pas affichés en mode client.", inputType: 'checkbox', defaultValue: true },
        { key: 'queries.main.showQueryEditor', label: "Afficher l'éditeur SQL en mode client", tooltip: "Si décoché, l'éditeur SQL ne sera visible qu'en mode développeur. En mode client, seul le résultat sera affiché.", inputType: 'checkbox' },
        { key: 'preserveUserValue', label: 'Ne pas ré-exécuter lors du rafraîchissement DAG', tooltip: "Si coché, cette cellule ne sera pas relancée automatiquement par le DAG quand un paramètre dont elle dépend change", inputType: 'checkbox', defaultValue: false }
    ],
    defaults: { queries: [{ name: 'main', sql: 'SELECT 1;', engine: 'sql', showQueryEditor: false, showQueryResult: true }], preserveUserValue: false },
    bodyFamily: 'sqlWithTable',
    bodyConfig: { queryKey: 'query', showTextResult: true, showResultInfo: true },
    bodyDisplay: { showSkeleton: { excludeWhenSqlEditor: true }, resultInfo: { showDevOnly: false } }
}
