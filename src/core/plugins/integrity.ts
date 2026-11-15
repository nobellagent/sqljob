/**
 * Vérification d'intégrité des plugins (sha256), avec l'API Web Crypto.
 *
 * L'empreinte est portée par le manifeste (`integrity: "sha256-<base64>"`) et
 * couvre les octets exacts du module ES téléchargé.
 */
import {PluginError} from './manifest'

function toBase64(bytes: ArrayBuffer): string {
    const view = new Uint8Array(bytes)
    let binary = ''
    for (let i = 0; i < view.length; i += 1) binary += String.fromCharCode(view[i])
    if (typeof btoa === 'function') return btoa(binary)
    return Buffer.from(view).toString('base64')
}

/** Calcule l'empreinte d'un module au format `sha256-<base64>`. */
export async function sha256Integrity(bytes: Uint8Array): Promise<string> {
    const digest = await crypto.subtle.digest('SHA-256', bytes.slice().buffer)
    return `sha256-${toBase64(digest)}`
}

/** Lève `integrity_mismatch` si les octets ne correspondent pas à l'empreinte. */
export async function verifyIntegrity(bytes: Uint8Array, integrity: string): Promise<void> {
    const actual = await sha256Integrity(bytes)
    if (actual !== integrity) {
        throw new PluginError(
            'integrity_mismatch',
            `empreinte incorrecte (attendu ${integrity}, obtenu ${actual})`,
        )
    }
}

/** Vérifie la taille annoncée par le registre, si elle est présente. */
export function verifySize(bytes: Uint8Array, expected?: number): void {
    if (expected !== undefined && bytes.byteLength !== expected) {
        throw new PluginError(
            'size_mismatch',
            `taille incorrecte (attendu ${expected} octets, obtenu ${bytes.byteLength})`,
        )
    }
}
