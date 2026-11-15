export const pivot = {
    executeHandler: 'executePivotCell',
    defaultNamePrefix: 'pivot',
    exportFields: ['json', 'preserveUserValue'],
    initProps: {},
    commonParams: ['name'],
    specificParams: [
        { key: 'preserveUserValue', label: 'Ne pas ré-exécuter si déjà calculé', inputType: 'checkbox', defaultValue: false }
    ],
    defaults: {
        json: { selectedTable: '' },
        preserveUserValue: false,
    },
    bodyFamily: 'pivot',
    bodyDisplay: {},
}
