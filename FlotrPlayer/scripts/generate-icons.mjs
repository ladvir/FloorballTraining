// assets/logo/logo-mark.svg is the app-icon master: a tactics-court + ball mark (transparent
// background), recolored from FloTr's web icon to this app's own theme tokens (see the SVG's own
// comment). This script composites it onto the app's real colors for each icon surface.
// Run after changing assets/logo/logo-mark.svg: npm run icons
// The generated PNGs are committed - the CI build does not run this script.
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const assetsDir = fileURLToPath(new URL('../assets', import.meta.url))
const svgPath = path.join(assetsDir, 'logo', 'logo-mark.svg')

// colors.background/gradientStart from src/theme/tokens.ts - kept in sync manually, tokens.ts has
// no build-time export a plain Node script can import without pulling in React Native.
const BACKGROUND = '#0B1120'
const GRADIENT_START = '#3B82F6'
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 }
const CANVAS = 1024

/** The app-icon backdrop: brand blue fading into the app's own dark background, matching the
 * gradient used on primary buttons/active states elsewhere in the app. */
const renderGradientBg = (size) =>
  sharp(
    Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${GRADIENT_START}"/><stop offset="1" stop-color="${BACKGROUND}"/></linearGradient></defs><rect width="${size}" height="${size}" fill="url(#g)"/></svg>`
    )
  )
    .png()
    .toBuffer()

const renderMark = (size) => sharp(svgPath, { density: 300 }).resize(size, size).png().toBuffer()

/** White silhouette of the mark (alpha shape kept, color flattened) - Android's monochrome
 * icon layer is tinted by the OS, so the source just needs to be opaque-white-on-transparent. */
const renderMarkWhite = async (size) =>
  sharp(await renderMark(size))
    .tint({ r: 255, g: 255, b: 255 })
    .png()
    .toBuffer()

await mkdir(assetsDir, { recursive: true })

// App icon (iOS requires a fully opaque icon, hence flatten onto the gradient background). The
// mark's own viewBox already has the court+ball composed with sensible padding, so it's rendered
// near full-size rather than shrunk further.
await sharp(await renderGradientBg(CANVAS))
  .composite([{ input: await renderMark(Math.round(CANVAS * 0.95)), gravity: 'center' }])
  .flatten({ background: BACKGROUND })
  .png()
  .toFile(path.join(assetsDir, 'icon.png'))
console.log('generated icon.png (1024x1024)')

// Splash image for the expo-splash-screen plugin - mark only, transparent, plugin controls
// on-screen size/background via app.json.
await sharp({ create: { width: CANVAS, height: CANVAS, channels: 4, background: TRANSPARENT } })
  .composite([{ input: await renderMark(Math.round(CANVAS * 0.8)), gravity: 'center' }])
  .png()
  .toFile(path.join(assetsDir, 'splash-icon.png'))
console.log('generated splash-icon.png (1024x1024)')

// Android adaptive icon background layer - gradient fill behind android-icon-foreground.png.
await sharp(await renderGradientBg(CANVAS))
  .png()
  .toFile(path.join(assetsDir, 'android-icon-background.png'))
console.log('generated android-icon-background.png (1024x1024)')

// Android adaptive icon foreground - transparent, mark kept inside the ~66% launcher safe zone.
const FOREGROUND_SIZE = 512
await sharp({ create: { width: FOREGROUND_SIZE, height: FOREGROUND_SIZE, channels: 4, background: TRANSPARENT } })
  .composite([{ input: await renderMark(Math.round(FOREGROUND_SIZE * 0.9)), gravity: 'center' }])
  .png()
  .toFile(path.join(assetsDir, 'android-icon-foreground.png'))
console.log(`generated android-icon-foreground.png (${FOREGROUND_SIZE}x${FOREGROUND_SIZE})`)

// Android 13+ themed (monochrome) icon - Android applies its own tint, so this is the mark's
// alpha shape recolored flat white, same safe zone as the foreground layer.
const MONOCHROME_SIZE = 432
await sharp({ create: { width: MONOCHROME_SIZE, height: MONOCHROME_SIZE, channels: 4, background: TRANSPARENT } })
  .composite([{ input: await renderMarkWhite(Math.round(MONOCHROME_SIZE * 0.9)), gravity: 'center' }])
  .png()
  .toFile(path.join(assetsDir, 'android-icon-monochrome.png'))
console.log(`generated android-icon-monochrome.png (${MONOCHROME_SIZE}x${MONOCHROME_SIZE})`)

// Web favicon - small, so the mark fills more of the frame to stay legible.
const FAVICON_SIZE = 48
await sharp(await renderGradientBg(FAVICON_SIZE))
  .composite([{ input: await renderMark(Math.round(FAVICON_SIZE * 0.95)), gravity: 'center' }])
  .flatten({ background: BACKGROUND })
  .png()
  .toFile(path.join(assetsDir, 'favicon.png'))
console.log(`generated favicon.png (${FAVICON_SIZE}x${FAVICON_SIZE})`)
