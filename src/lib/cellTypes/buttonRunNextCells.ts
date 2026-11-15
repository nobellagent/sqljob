export const buttonRunNextCells = {
    executeHandler: null,
    defaultNamePrefix: 'button',
    blocksAutoFlow: true,
    showOnlyWhenButtonLabel: true,
    exportFields: ['buttonLabel'],
    commonParams: ['name', 'buttonLabel'],
    specificParams: [],
    defaults: { buttonLabel: 'Exécuter' },
    bodyFamily: 'buttonRun',
    bodyConfig: { defaultLabel: 'Exécuter', action: 'runCellsAfter' }
}
