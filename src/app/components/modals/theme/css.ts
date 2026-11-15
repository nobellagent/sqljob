// Conversion d'une map de variables CSS en feuille de style.

export function css(vars: Record<string, string>): string {
    return Object.entries(vars).map(([k, v]) => `  --${k}: ${v};`).join('\n')
}
