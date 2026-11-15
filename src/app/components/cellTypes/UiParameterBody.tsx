import {useEffect, useState} from 'react'
import {useShallow} from 'zustand/react/shallow'
import {useNotebookStore} from '../../store/notebookStore'
import {ConfigManager} from '../../../lib/ConfigManager'
import {SqlEditorWidget} from '../SqlEditorWidget'
import {ResultInfo} from './shared'
import type {CellBodyBaseProps} from './types'

export const UiParameterBody: React.FC<CellBodyBaseProps> = ({ cell, path, cellIndex }) => {
    const { devMode, onParameterValueChange, updateCellById } = useNotebookStore(useShallow(s => ({
        devMode: s.devMode,
        onParameterValueChange: s.onParameterValueChange,
        updateCellById: s.updateCellById,
    })))
    const languageType = ConfigManager.getCellEngine(cell, 'main')
    const isJs = languageType === 'js'
    const isText = languageType === 'text'
    const languageLabel = isJs ? 'JavaScript' : isText ? 'Texte' : 'SQL'
    const badgeClass = isJs ? 'badge-warning' : isText ? 'badge-ghost' : 'badge-info'
    const placeholder = isJs ? 'return ["Option 1", "Option 2"];' : isText ? 'Saisir le texte' : 'SELECT * from source1'

    const [localValue, setLocalValue] = useState<string | number>(
        (cell._value as string | number | undefined) ?? ''
    )

    // Sync la valeur locale quand cell._value change suite à une exécution externe
    useEffect(() => {
        setLocalValue((cell._value as string | number | undefined) ?? '')
    }, [cell._value])

    if (!devMode && cell.userVisible === false) return null

    function handleChange(newValue: any) {
        updateCellById(cell._id, (c: any) => {
            c._value = newValue
            c._userModified = true
        })
        setLocalValue(newValue)
        onParameterValueChange?.(cell)
    }

    return (
        <div className="flex flex-col gap-0">
            {devMode && (
                <SqlEditorWidget
                    cell={cell} path={path} cellIndex={cellIndex}
                    placeholder={placeholder}
                    languageLabel={languageLabel}
                    badgeClass={badgeClass}
                />
            )}
            {cell.paramType === 'input' && (
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-foreground">{cell.title}</label>
                    <input
                        type={cell.inputType || 'text'}
                        className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                        value={localValue}
                        onChange={e => handleChange(e.target.value)}
                        disabled={cell.userEditable === false}
                        placeholder={`Valeur de ${ConfigManager.getCellReferenceName(cell) || ''}`}
                    />
                </div>
            )}
            {cell.paramType === 'dropdown' && (cell._options?.length ?? 0) > 0 && (
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-foreground">{cell.title}</label>
                    <select
                        className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                        value={localValue}
                        onChange={e => handleChange(e.target.value)}
                        disabled={cell.userEditable === false}
                    >
                        {(cell._options || []).map((opt: any) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
            )}
            {cell.paramType === 'range' && (
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-foreground">{cell.title}</label>
                    <div className="flex items-center gap-3 w-full">
                        <span className="text-xs text-muted-foreground min-w-[2rem] text-right">{cell.rangeMin ?? 0}</span>
                        <input
                            type="range"
                            className="flex-1 accent-primary"
                            value={localValue}
                            min={cell.rangeMin ?? 0}
                            max={cell.rangeMax ?? 100}
                            step={cell.rangeStep ?? 1}
                            onChange={e => handleChange(Number(e.target.value))}
                            disabled={cell.userEditable === false}
                        />
                        <span className="text-xs text-muted-foreground min-w-[2rem]">{cell.rangeMax ?? 100}</span>
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-mono bg-primary text-primary-foreground min-w-[3rem]">{localValue}</span>
                    </div>
                </div>
            )}
            <ResultInfo cell={cell} devOnly />
        </div>
    )
}

