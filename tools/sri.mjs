#!/usr/bin/env node
/**
 * Calcule les empreintes d'intégrité (SRI, sha384) des fichiers d'un bundle.
 *
 * Le bundle CDN est découpé en chunks : `sqljob.js` n'est qu'un point d'entrée
 * de quelques octets qui importe un chunk haché. Vérifier l'entrée seule fixe le
 * nom du chunk, pas son contenu — d'où ce manifeste, qui couvre l'entrée ET tous
 * les chunks.
 *
 * Usage :
 *   node tools/sri.mjs [dossier] [fichier-de-sortie]
 *   node tools/sri.mjs dist-cdn dist-cdn/integrity.json
 */
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const dir = process.argv[2] ?? 'dist-cdn'
const out = process.argv[3] ?? join(dir, 'integrity.json')

function walk(root, current = root, acc = []) {
    for (const entry of readdirSync(current)) {
        const full = join(current, entry)
        const st = statSync(full)
        if (st.isDirectory()) walk(root, full, acc)
        else acc.push(full)
    }
    return acc
}

const files = {}
for (const full of walk(dir).sort()) {
    const rel = relative(dir, full).split(sep).join('/')
    if (rel === 'integrity.json' || rel.endsWith('.map')) continue
    const buf = readFileSync(full)
    files[rel] = {
        sha384: 'sha384-' + createHash('sha384').update(buf).digest('base64'),
        size: buf.length,
    }
}

const manifest = {
    generatedAt: new Date().toISOString(),
    algorithm: 'sha384',
    files,
}
writeFileSync(out, JSON.stringify(manifest, null, 2) + '\n')

const entry = files['sqljob.js']
if (entry) {
    console.log(`Entrée : sqljob.js`)
    console.log(`integrity="${entry.sha384}"`)
}
console.log(`${Object.keys(files).length} fichiers hachés → ${out}`)
