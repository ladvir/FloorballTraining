// Generates the PNG app icons from the SVG masters in public/.
// Run after changing icon-512.svg / icon-maskable.svg:  npm run icons
// The generated PNGs are committed — the CI build does not run this script.
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const publicDir = fileURLToPath(new URL('../public', import.meta.url))

// apple-touch-icon uses the maskable (full-bleed) master: iOS applies its own corner rounding.
const jobs = [
  { src: 'icon-512.svg', out: 'icons/pwa-192.png', size: 192 },
  { src: 'icon-512.svg', out: 'icons/pwa-512.png', size: 512 },
  { src: 'icon-512.svg', out: 'icons/favicon-96.png', size: 96 },
  { src: 'icon-maskable.svg', out: 'icons/pwa-maskable-512.png', size: 512 },
  { src: 'icon-maskable.svg', out: 'apple-touch-icon.png', size: 180 },
]

await mkdir(path.join(publicDir, 'icons'), { recursive: true })

for (const { src, out, size } of jobs) {
  await sharp(path.join(publicDir, src), { density: 300 })
    .resize(size, size)
    .png()
    .toFile(path.join(publicDir, out))
  console.log(`generated ${out} (${size}x${size})`)
}
