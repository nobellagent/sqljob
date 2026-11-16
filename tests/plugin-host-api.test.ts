import {describe, expect, it} from 'vitest'
import {assertHostPermission, HostError, isReadOnlyQuery, sanitizeDownloadName, storageKeyFor} from '../src/core/plugins/hostApi'
import {parseManifest} from '../src/core/plugins/manifest'

const manifest = parseManifest({
    id: 'demo',
    version: '1.0.0',
    sqljobMinVersion: '0.4.0',
    types: ['demo'],
    permissions: ['duckdb:read', 'ui:download', 'storage:local'],
    entry: 'demo.mjs',
    integrity: 'sha256-LPJNul+wow4m6DsqxbninhsWHlwfp0JecwQzYpOLmCQ=',
})

describe('assertHostPermission', () => {
    it('accepte une méthode couverte par le manifeste', () => {
        expect(() => assertHostPermission(manifest, 'query')).not.toThrow()
        expect(() => assertHostPermission(manifest, 'download')).not.toThrow()
        expect(() => assertHostPermission(manifest, 'storage.set')).not.toThrow()
    })

    it('refuse une méthode non déclarée', () => {
        const restricted = parseManifest({
            id: 'demo', version: '1.0.0', sqljobMinVersion: '0.4.0', types: ['demo'],
            permissions: ['ui:render'], entry: 'demo.mjs',
            integrity: 'sha256-LPJNul+wow4m6DsqxbninhsWHlwfp0JecwQzYpOLmCQ=',
        })
        expect(() => assertHostPermission(restricted, 'query')).toThrow(HostError)
        expect(() => assertHostPermission(restricted, 'download')).toThrow(/ui:download/)
        expect(() => assertHostPermission(restricted, 'storage.get')).toThrow(/storage:local/)
    })

    it('refuse une méthode inconnue', () => {
        expect(() => assertHostPermission(manifest, 'eval' as never)).toThrow(/inconnue/)
    })
})

describe('isReadOnlyQuery', () => {
    it('accepte une lecture', () => {
        for (const sql of [
            'SELECT 1',
            '  select * from t where x = 1',
            'WITH x AS (SELECT 1) SELECT * FROM x',
            'SELECT 1;',
            '-- commentaire\nSELECT 1',
            '/* bloc */ SELECT * FROM t',
            'SELECT count(*) FROM t GROUP BY a',
        ]) {
            expect(isReadOnlyQuery(sql), sql).toBe(true)
        }
    })

    it('refuse une écriture ou une instruction multiple', () => {
        for (const sql of [
            'INSERT INTO t VALUES (1)',
            'UPDATE t SET a = 1',
            'DELETE FROM t',
            'DROP TABLE t',
            'CREATE TABLE t AS SELECT 1',
            'ATTACH \'x.db\'',
            'COPY t TO \'x.csv\'',
            'PRAGMA database_list',
            'SELECT 1; DROP TABLE t',
            'SELECT 1;SELECT 2',
            'SELECT * FROM t; insert into u values (1)',
            '',
            '   ',
        ]) {
            expect(isReadOnlyQuery(sql), sql).toBe(false)
        }
    })
})

describe('sanitizeDownloadName', () => {
    it('retire les séparateurs et les caractères de contrôle', () => {
        expect(sanitizeDownloadName('../../etc/passwd')).toBe('_.._etc_passwd')
        expect(sanitizeDownloadName('facture\u0000.pdf')).toBe('facture.pdf')
        expect(sanitizeDownloadName('.bashrc')).toBe('bashrc')
    })

    it('borne la longueur et fournit un défaut', () => {
        expect(sanitizeDownloadName('a'.repeat(500)).length).toBe(120)
        expect(sanitizeDownloadName(undefined)).toBe('export.bin')
        expect(sanitizeDownloadName('   ')).toBe('export.bin')
    })
})

describe('storageKeyFor', () => {
    it('préfixe par le plugin', () => {
        expect(storageKeyFor('demo', 'settings')).toBe('sqljob.plugin.demo.settings')
    })

    it('refuse une clé douteuse', () => {
        expect(() => storageKeyFor('demo', '../autre')).toThrow(HostError)
        expect(() => storageKeyFor('demo', 'a'.repeat(65))).toThrow(HostError)
    })
})
