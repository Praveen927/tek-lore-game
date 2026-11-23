// Product pictures: put the full-size originals in src/images/products/originals/ (git-ignored with the rest of the folder),
// then run `npm run images` to write web-sized WebP files next to them. The game only bundles the WebP files.
import sharp from 'sharp'
import { readdirSync, mkdirSync, statSync } from 'node:fs'
import { join, parse } from 'node:path'

const source = 'src/images/products/originals'
const target = 'src/images/products'
const width = 1280
mkdirSync(source, { recursive: true })

for(const file of readdirSync(source).filter((_file) => /\.(png|jpe?g|webp)$/i.test(_file)))
{
    const out = join(target, `${parse(file).name}.webp`)
    await sharp(join(source, file)).resize({ width, withoutEnlargement: true }).webp({ quality: 82 }).toFile(out)
    console.log(`${file} (${Math.round(statSync(join(source, file)).size / 1024)} KB) -> ${out} (${Math.round(statSync(out).size / 1024)} KB)`)
}
