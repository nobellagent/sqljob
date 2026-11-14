import {describe, expect, it} from 'vitest'
import {GistEncrypt} from '../src/lib/GistEncrypt'

describe('GistEncrypt', () => {
    it('génère une passphrase hexadécimale de 32 caractères', () => {
        const passphrase = GistEncrypt.generatePassphrase()
        expect(passphrase).toMatch(/^[0-9a-f]{32}$/)
        expect(GistEncrypt.generatePassphrase()).not.toBe(passphrase)
    })

    it('chiffre puis déchiffre sans perte', async () => {
        const payload = JSON.stringify({pages: [{name: 'Analyse', cells: 3}]})
        const encrypted = await GistEncrypt.encrypt(payload, 'correct horse battery staple')

        expect(GistEncrypt.isEncrypted(encrypted)).toBe(true)
        expect(encrypted.ciphertext).toBeTruthy()
        expect(encrypted.ciphertext).not.toContain('Analyse')

        await expect(GistEncrypt.decrypt(encrypted, 'correct horse battery staple')).resolves.toBe(payload)
    }, 30_000)

    it('refuse une mauvaise passphrase', async () => {
        const encrypted = await GistEncrypt.encrypt('secret', 'bonne-passphrase')
        await expect(GistEncrypt.decrypt(encrypted, 'mauvaise-passphrase')).rejects.toThrow()
    }, 30_000)

    it('refuse un objet non chiffré', async () => {
        await expect(GistEncrypt.decrypt({hello: 'world'}, 'x')).rejects.toThrow(/format invalide/)
        expect(GistEncrypt.isEncrypted({hello: 'world'})).toBeFalsy()
    })
})
