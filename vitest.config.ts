import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        include: ['tests/**/*.test.ts'],
        environment: 'node',
        reporters: 'default',
        // Les paquets @sqlrooms sont livrés avec des imports internes sans extension :
        // il faut les faire passer par Vite pour qu'ils se résolvent.
        server: {
            deps: {
                inline: [/@sqlrooms\//],
            },
        },
    },
})
