// Sélecteur de colonne pour un rôle de graphique.

import {ChartConfig} from '../../../../lib/SqlBlockTypes'

const NONE_VALUE = '__none__'
const SELECT_CLASS = 'h-6 text-xs px-1.5 border border-border rounded bg-background min-w-[120px] max-w-[160px] cursor-pointer'

export function ColSelect({ value, availableColumns, optional, onChange }: {
    value: string
    availableColumns: string[]
    optional: boolean
    onChange: (col: string | null) => void
}) {
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const v = e.target.value

        onChange(v === NONE_VALUE ? null : v)
    }
    return (
        <select
            value={value || NONE_VALUE}
            onChange={handleChange}
            className={SELECT_CLASS}
        >
            {optional && <option value={NONE_VALUE}>-- aucune --</option>}
            {availableColumns.map(col => (
                <option key={col} value={col}>{col}</option>
            ))}
        </select>
    )
}

// ─── Composant principal ──────────────────────────────────────────────────────

