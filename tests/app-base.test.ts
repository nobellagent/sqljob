import {describe, expect, it} from 'vitest'
import {CANONICAL_APP_BASE, resolveAppBase} from '../src/lib/appBase'

describe('resolveAppBase', () => {
    it('suit le dossier dist-cdn du module (GitHub Pages)', () => {
        expect(resolveAppBase({
            moduleUrl: 'https://nobellagent.github.io/sqljob/dist-cdn/sqljob-C1GKp247.js',
            pageUrl: 'https://nobellagent.github.io/sqljob/?x=1',
        })).toBe('https://nobellagent.github.io/sqljob/')
    })

    it('suit le dossier dist-cdn du module (jsDelivr, embed ailleurs)', () => {
        expect(resolveAppBase({
            moduleUrl: 'https://cdn.jsdelivr.net/gh/nobellagent/sqljob@gh-pages/dist-cdn/sqljob-C1GKp247.js',
            pageUrl: 'https://client.example.org/page.html',
        })).toBe('https://cdn.jsdelivr.net/gh/nobellagent/sqljob@gh-pages/')
    })

    it('suit le dossier dist-cdn d’un zip servi localement', () => {
        expect(resolveAppBase({
            moduleUrl: 'http://localhost:8099/dist-cdn/sqljob-C1GKp247.js',
            pageUrl: 'http://localhost:8099/index.html',
        })).toBe('http://localhost:8099/')
    })

    it('retombe sur le dossier de la page quand le module n’est pas dans dist-cdn', () => {
        expect(resolveAppBase({
            moduleUrl: 'http://localhost:5173/src/main.tsx',
            pageUrl: 'http://localhost:5173/sqljob/?a=b',
        })).toBe('http://localhost:5173/sqljob/')
    })

    it('accepte une surcharge explicite', () => {
        expect(resolveAppBase({
            moduleUrl: 'https://nobellagent.github.io/sqljob/dist-cdn/sqljob.js',
            override: 'https://exemple.org/app',
        })).toBe('https://exemple.org/app/')
    })

    it('retombe sur le déploiement canonique en file:// ou sans contexte', () => {
        expect(resolveAppBase({pageUrl: 'file:///home/x/index.html'})).toBe(CANONICAL_APP_BASE)
        expect(resolveAppBase({})).toBe(CANONICAL_APP_BASE)
    })

    it('ne pointe jamais vers le projet d’origine', () => {
        const base = resolveAppBase({
            moduleUrl: 'https://nobellagent.github.io/sqljob/dist-cdn/sqljob.js',
        })
        expect(base).not.toContain('ihatexcel')
    })
})
