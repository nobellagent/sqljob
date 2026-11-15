export const uiParameter = {
    executeHandler: 'executeUiParameterCell',
    defaultNamePrefix: 'param',
    useNameAsReference: true,
    namePattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/,
    exportFields: ['name', 'paramType', 'title', 'queries', 'inputType', 'rangeMin', 'rangeMax', 'rangeStep', 'userVisible', 'userEditable', 'preserveUserValue'],
    initProps: { _value: '', _options: [], _initialized: false, _paramError: null },
    commonParams: ['name', 'title', 'queries'],
    queryCount: 1,
    queryNames: ['main'],
    titleLabel: "Libellé",
    titleTooltip: "Texte affiché à gauche du champ de saisie",
    specificParams: [
        { key: 'queries.main.engine', label: 'Type de langage', tooltip: "SQL: exécute une requête SQL | JS: exécute une expression JavaScript | Texte: valeur retournée directement sans moteur", inputType: 'select', options: [{ value: 'sql', label: 'SQL' }, { value: 'js', label: 'JavaScript' }, { value: 'text', label: 'Texte' }] },
        { key: 'paramType', label: 'Type de composant', tooltip: "Choisissez le type de composant d'interface pour ce paramètre", inputType: 'select', options: [{ value: 'input', label: 'Champ texte (input)' }, { value: 'dropdown', label: 'Liste déroulante (dropdown)' }, { value: 'range', label: 'Curseur (range)' }] },
        { key: 'userVisible', label: 'Visible en mode client', tooltip: "Si décoché, ce paramètre sera caché en mode client (paramètre intermédiaire)", inputType: 'checkbox' },
        { key: 'userEditable', label: 'Modifiable par l\'utilisateur', tooltip: "Si décoché, l'utilisateur ne pourra pas modifier la valeur calculée par SQL", inputType: 'checkbox' },
        { key: 'preserveUserValue', label: 'Préserver la valeur utilisateur lors de la ré-exécution', tooltip: "Si coché et que l'utilisateur a modifié la valeur, la ré-exécution de la cellule ne réinitialisera pas la valeur", inputType: 'checkbox' },
        { key: 'inputType', label: 'Type de champ', tooltip: "Choisissez le type HTML du champ de saisie", inputType: 'select', when: { paramType: 'input' }, options: [{ value: 'text', label: 'Texte' }, { value: 'password', label: 'Mot de passe' }, { value: 'email', label: 'Email' }, { value: 'number', label: 'Nombre' }, { value: 'date', label: 'Date' }, { value: 'datetime-local', label: 'Date et heure' }, { value: 'week', label: 'Semaine' }, { value: 'month', label: 'Mois' }, { value: 'tel', label: 'Téléphone' }, { value: 'url', label: 'URL' }, { value: 'search', label: 'Recherche' }, { value: 'time', label: 'Heure' }] },
        { key: 'rangeMin', label: 'Valeur minimum', tooltip: "Valeur minimale du curseur (défaut: 0)", inputType: 'number', when: { paramType: 'range' }, placeholder: '0' },
        { key: 'rangeMax', label: 'Valeur maximum', tooltip: "Valeur maximale du curseur (défaut: 100)", inputType: 'number', when: { paramType: 'range' }, placeholder: '100' },
        { key: 'rangeStep', label: 'Pas (step)', tooltip: "Incrément entre chaque valeur du curseur (défaut: 1)", inputType: 'number', when: { paramType: 'range' }, placeholder: '1', min: 0.001 }
    ],
    defaults: {
        title: '',
        paramType: 'input',
        inputType: 'text',
        rangeMin: 0, rangeMax: 100, rangeStep: 1,
        userVisible: true, userEditable: true,
        preserveUserValue: false,
        queries: [{
            name: 'main', sql: '',
            engine: 'sql',
            showQueryEditor: false
        }]
    },
    bodyFamily: 'uiParameter',
    bodyConfig: {
        showDevRef: true,
        paramTypes: ['input', 'dropdown', 'range']
    },
    bodyDisplay: { showSkeleton: { when: 'never' } }
}
