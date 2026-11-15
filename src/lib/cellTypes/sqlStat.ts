export const sqlStat = {
    executeHandler: 'executeSqlStatCell',
    defaultNamePrefix: 'sqlStat',
    showNameInHeader: true,
    showInViewWhenResultOrRunning: true,
    exportFields: ['name', 'queries', 'title', 'subtitle', 'icon', 'preserveUserValue'],
    initProps: {},
    commonParams: ['name', 'title', 'subtitle', 'icon', 'queries'],
    queryCount: 1,
    queryNames: ['main'],
    queryLabels: { main: 'Requête SQL' },
    titleLabel: 'Titre de la stat',
    titleTooltip: "Titre affiché au-dessus de la valeur statistique",
    specificParams: [
        { key: 'queries.main.showQueryEditor', label: "Afficher l'éditeur SQL en mode client", tooltip: "Si décoché, l'éditeur SQL ne sera visible qu'en mode développeur. En mode client, seul le résultat sera affiché.", inputType: 'checkbox' },
        { key: 'preserveUserValue', label: 'Ne pas ré-exécuter lors du rafraîchissement DAG', tooltip: "Si coché, cette cellule ne sera pas relancée automatiquement par le DAG quand un paramètre dont elle dépend change", inputType: 'checkbox', defaultValue: false }
    ],
    defaults: { title: 'Total Lignes', subtitle: '', icon: 'material-symbols-light:join-right', queries: [{ name: 'main', sql: 'SELECT COUNT(*) FROM source1', engine: 'sql', showQueryEditor: false }], preserveUserValue: false },
    bodyFamily: 'sqlStat',
    bodyConfig: { defaultIcon: 'mdi:information-outline', showResultInfoDevOnly: true },
    bodyDisplay: { showSkeleton: { excludeWhenSqlEditor: true }, resultInfo: { showDevOnly: true } }
}
