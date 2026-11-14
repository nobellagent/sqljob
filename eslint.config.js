import js from '@eslint/js'
import tseslint from 'typescript-eslint'

/**
 * Lint incrémental : il ne couvre que le code nouveau (core/commands/tests).
 * Le code historique sera rattaché progressivement, fichier par fichier,
 * au fur et à mesure de son découpage (phase P3).
 */
export default tseslint.config(
    {
        ignores: ['dist/**', 'dist-cdn/**', 'node_modules/**', 'coverage/**'],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['src/core/**/*.ts', 'tests/**/*.ts'],
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-vars': ['error', {argsIgnorePattern: '^_'}],
        },
    },
)
