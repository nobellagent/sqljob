export type SqlBlockEditorProps = {
    cell: any
    path: number[]
    cellIndex: number
    onExitUiMode?: () => void
    fromSqlCell?: boolean
    skipExecution?: boolean
    modalOpen?: boolean
    allowedMaterializeModes?: string[]
    openVizConfigTrigger?: number
}
