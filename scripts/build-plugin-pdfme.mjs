/**
 * Construit le module du plugin pdfme.
 *
 * Le plugin doit être un seul fichier ES : pdfme, pdf-lib et les polices sont
 * donc inlinés. Le résultat est committé dans `public/plugins/pdfme-plugin/`
 * et son empreinte est vérifiée par la CI (`tests/plugin-example.test.ts`).
 *
 * Usage : node scripts/build-plugin-pdfme.mjs
 */
import {build} from 'esbuild'
import {createHash} from 'node:crypto'
import {readFile, writeFile, mkdir} from 'node:fs/promises'
import {dirname} from 'node:path'

const OUTPUT = 'public/plugins/pdfme-plugin/pdfme-plugin.mjs'
const MANIFEST = 'public/plugins/pdfme-plugin/cell-plugin.json'

await mkdir(dirname(OUTPUT), {recursive: true})

await build({
    entryPoints: ['plugins/pdfme-plugin/src/index.mjs'],
    bundle: true,
    format: 'esm',
    target: 'es2020',
    minify: true,
    legalComments: 'none',
    outfile: OUTPUT,
    define: {'process.env.NODE_ENV': '"production"'},
    loader: {'.ttf': 'binary', '.woff': 'binary', '.woff2': 'binary'},
})

const bytes = await readFile(OUTPUT)
const integrity = 'sha256-' + createHash('sha256').update(bytes).digest('base64')

const manifest = JSON.parse(await readFile(MANIFEST, 'utf8'))
manifest.integrity = integrity
await writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + '\n')

console.log(`module : ${OUTPUT} — ${(bytes.length / 1024).toFixed(0)} Ko`)
console.log(`sha256 : ${integrity}`)
console.log('penser à reporter integrity et size dans public/registry.json')
