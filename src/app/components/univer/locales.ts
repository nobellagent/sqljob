// Locales Univer chargées à la demande (un chunk par langue).

export type LocaleEntry = {
    type: string
    loader: () => Promise<{ default: any }>
    tableLoader: () => Promise<{ default: any }>
    sortLoader: () => Promise<{ default: any }>
}
export const LOCALE_MAP: Record<string, LocaleEntry> = {
    'en-US': { type: 'enUS', loader: () => import('@univerjs/preset-sheets-core/locales/en-US'), tableLoader: () => import('@univerjs/preset-sheets-table/lib/locales/en-US'), sortLoader: () => import('@univerjs/sheets-sort-ui/locale/en-US') },
    'fr-FR': { type: 'frFR', loader: () => import('@univerjs/preset-sheets-core/locales/fr-FR'), tableLoader: () => import('@univerjs/preset-sheets-table/lib/locales/fr-FR'), sortLoader: () => import('@univerjs/sheets-sort-ui/locale/fr-FR') },
    'zh-CN': { type: 'zhCN', loader: () => import('@univerjs/preset-sheets-core/locales/zh-CN'), tableLoader: () => import('@univerjs/preset-sheets-table/lib/locales/zh-CN'), sortLoader: () => import('@univerjs/sheets-sort-ui/locale/zh-CN') },
    'zh-TW': { type: 'zhTW', loader: () => import('@univerjs/preset-sheets-core/locales/zh-TW'), tableLoader: () => import('@univerjs/preset-sheets-table/lib/locales/zh-TW'), sortLoader: () => import('@univerjs/sheets-sort-ui/locale/zh-TW') },
    'ru-RU': { type: 'ruRU', loader: () => import('@univerjs/preset-sheets-core/locales/ru-RU'), tableLoader: () => import('@univerjs/preset-sheets-table/lib/locales/ru-RU'), sortLoader: () => import('@univerjs/sheets-sort-ui/locale/ru-RU') },
    'ja-JP': { type: 'jaJP', loader: () => import('@univerjs/preset-sheets-core/locales/ja-JP'), tableLoader: () => import('@univerjs/preset-sheets-table/lib/locales/ja-JP'), sortLoader: () => import('@univerjs/sheets-sort-ui/locale/ja-JP') },
    'es-ES': { type: 'esES', loader: () => import('@univerjs/preset-sheets-core/locales/es-ES'), tableLoader: () => import('@univerjs/preset-sheets-table/lib/locales/es-ES'), sortLoader: () => import('@univerjs/sheets-sort-ui/locale/es-ES') },
    'ca-ES': { type: 'caES', loader: () => import('@univerjs/preset-sheets-core/locales/ca-ES'), tableLoader: () => import('@univerjs/preset-sheets-table/lib/locales/ca-ES'), sortLoader: () => import('@univerjs/sheets-sort-ui/locale/ca-ES') },
    'sk-SK': { type: 'skSK', loader: () => import('@univerjs/preset-sheets-core/locales/sk-SK'), tableLoader: () => import('@univerjs/preset-sheets-table/lib/locales/sk-SK'), sortLoader: () => import('@univerjs/sheets-sort-ui/locale/sk-SK') },
    'fa-IR': { type: 'faIR', loader: () => import('@univerjs/preset-sheets-core/locales/fa-IR'), tableLoader: () => import('@univerjs/preset-sheets-table/lib/locales/fa-IR'), sortLoader: () => import('@univerjs/sheets-sort-ui/locale/fa-IR') },
}

/** Retourne l'entrée de locale demandée, ou l'anglais par défaut. */
export function resolveLocaleEntry(locale: string): LocaleEntry {
    return LOCALE_MAP[locale] ?? LOCALE_MAP['en-US']
}
