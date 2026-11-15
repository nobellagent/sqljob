import type {TopNStep} from '../../../../../lib/SqlBlockTypes'

export function TopNStepUI({ step, onChange }: { step: TopNStep; onChange: (s: TopNStep) => void }) {
    return (
        <div className="flex flex-col gap-2">
            <div className="flex gap-1">
                {(['limit', 'sample_percent', 'sample_rows'] as const).map(m => (
                    <button key={m} onClick={() => onChange({ ...step, mode: m })}
                        className={`px-2 py-0.5 rounded border text-xs transition-colors ${step.mode === m ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'}`}>
                        {m === 'limit' ? 'LIMIT' : m === 'sample_percent' ? 'SAMPLE %' : 'SAMPLE lignes'}
                    </button>
                ))}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
                <label className="text-xs text-muted-foreground shrink-0">N :</label>
                <input type="number" min={0} className="w-24 h-6 rounded border border-border bg-background px-1.5 text-xs"
                    value={step.n} onChange={e => onChange({ ...step, n: Number(e.target.value) })} />
                {step.mode === 'limit' && <>
                    <label className="text-xs text-muted-foreground shrink-0">Offset :</label>
                    <input type="number" min={0} className="w-20 h-6 rounded border border-border bg-background px-1.5 text-xs"
                        value={step.offset ?? ''} onChange={e => onChange({ ...step, offset: e.target.value ? Number(e.target.value) : undefined })} placeholder="0" />
                </>}
                {step.mode !== 'limit' && <>
                    <label className="text-xs text-muted-foreground shrink-0">Méthode :</label>
                    <select className="h-6 rounded border border-border bg-background px-1 text-xs"
                        value={step.sampleMethod ?? ''} onChange={e => onChange({ ...step, sampleMethod: (e.target.value || undefined) as any })}>
                        <option value="">défaut</option>
                        <option value="reservoir">reservoir</option>
                        <option value="bernoulli">bernoulli</option>
                        <option value="system">system</option>
                    </select>
                </>}
            </div>
        </div>
    )
}

