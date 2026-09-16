import { GIFEncoder, quantize, applyPalette } from 'gifenc'
import type { Frame } from '../DrawingTypes'
import {
  prepareSvgClone,
  serializeSvgElement,
  rasterizeSvgToCanvas,
  downloadBlob,
} from './svgExportUtils'

const GIF_FPS = 10
const MAX_GIF_FRAMES = 120

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function findBracket(frames: Frame[], tMs: number): { lo: number; hi: number; localT: number } {
  let acc = 0
  for (let i = 0; i < frames.length - 1; i++) {
    const dur = frames[i].durationMs
    if (tMs <= acc + dur || i === frames.length - 2) {
      return {
        lo: i,
        hi: i + 1,
        localT: dur > 0 ? Math.min(1, Math.max(0, (tMs - acc) / dur)) : 1,
      }
    }
    acc += dur
  }
  return { lo: 0, hi: 0, localT: 0 }
}

/**
 * Raster-export counterpart to smilGenerator's <animate> injection: mutates a cloned SVG's
 * item elements to their interpolated position at tMs, mirroring the same per-item
 * "what's animatable" rules (see smilGenerator.ts) so the GIF matches the live preview.
 */
function applyInterpolatedFrame(clone: SVGSVGElement, frames: Frame[], tMs: number): void {
  const { lo, hi, localT } = findBracket(frames, tMs)
  const a = frames[lo].positions
  const b = frames[hi].positions

  a.players.forEach((pa, i) => {
    const pb = b.players[i]
    if (!pa || !pb) return
    const el = clone.querySelector(`#player-${i}`)
    if (!el) return
    el.setAttribute(
      'transform',
      `translate(${lerp(pa.x, pb.x, localT)},${lerp(pa.y, pb.y, localT)})`
    )
  })

  a.equipment.forEach((ea, i) => {
    const eb = b.equipment[i]
    if (!ea || !eb) return
    if ((ea.rotation ?? 0) !== (eb.rotation ?? 0)) return
    const dxA = (ea.x2 ?? ea.x) - ea.x
    const dyA = (ea.y2 ?? ea.y) - ea.y
    const dxB = (eb.x2 ?? eb.x) - eb.x
    const dyB = (eb.y2 ?? eb.y) - eb.y
    if (dxA !== dxB || dyA !== dyB) return
    const el = clone.querySelector(`#equipment${i}`)
    if (!el) return
    el.setAttribute(
      'transform',
      `translate(${lerp(ea.x, eb.x, localT)},${lerp(ea.y, eb.y, localT)})`
    )
  })

  a.lines.forEach((la, i) => {
    if (la.type === 'shoot') return
    const lb = b.lines[i]
    if (!lb) return
    const el = clone.querySelector(`#line${i}`)
    if (!el) return
    el.setAttribute('x1', String(lerp(la.x1, lb.x1, localT)))
    el.setAttribute('y1', String(lerp(la.y1, lb.y1, localT)))
    el.setAttribute('x2', String(lerp(la.x2, lb.x2, localT)))
    el.setAttribute('y2', String(lerp(la.y2, lb.y2, localT)))
  })

  a.texts.forEach((ta, i) => {
    const tb = b.texts[i]
    if (!ta || !tb) return
    const el = clone.querySelector(`#text${i}`)
    if (!el) return
    el.setAttribute('x', String(lerp(ta.x, tb.x, localT)))
    el.setAttribute('y', String(lerp(ta.y, tb.y, localT)))
  })

  a.numbers.forEach((na, i) => {
    const nb = b.numbers[i]
    if (!na || !nb) return
    const el = clone.querySelector(`#number${i}`)
    if (!el) return
    el.setAttribute('x', String(lerp(na.x, nb.x, localT)))
    el.setAttribute('y', String(lerp(na.y, nb.y, localT)))
  })

  a.shapes.forEach((sa, i) => {
    const sb = b.shapes[i]
    if (!sa || !sb || sb.type !== sa.type) return
    const el = clone.querySelector(`#shape${i}`)
    if (!el) return
    if (sa.type === 'rectangle' || sa.type === 'square') {
      el.setAttribute('x', String(lerp(sa.x, sb.x, localT)))
      el.setAttribute('y', String(lerp(sa.y, sb.y, localT)))
    } else if (sa.type === 'circle' || sa.type === 'ellipse') {
      el.setAttribute('cx', String(lerp(sa.cx, sb.cx, localT)))
      el.setAttribute('cy', String(lerp(sa.cy, sb.cy, localT)))
    } else if (sa.type === 'triangle') {
      if (sa.points.length !== sb.points.length) return
      const pts = sa.points
        .map((p, j) => `${lerp(p.x, sb.points[j].x, localT)},${lerp(p.y, sb.points[j].y, localT)}`)
        .join(' ')
      el.setAttribute('points', pts)
    }
  })
}

/** Renders a multi-frame SMIL storyboard to an auto-playing animated GIF and downloads it. */
export async function exportAnimatedGif(svg: SVGSVGElement, frames: Frame[]): Promise<void> {
  if (frames.length < 2) return

  const totalMs = frames.slice(0, -1).reduce((sum, f) => sum + f.durationMs, 0)
  const idealStep = 1000 / GIF_FPS
  const sampleCount = Math.min(MAX_GIF_FRAMES, Math.max(1, Math.round(totalMs / idealStep)))
  const step = totalMs / sampleCount

  const gif = GIFEncoder()

  for (let i = 0; i <= sampleCount; i++) {
    const t = Math.min(i * step, totalMs)
    const { clone, width, height } = prepareSvgClone(svg)
    applyInterpolatedFrame(clone, frames, t)
    const svgString = serializeSvgElement(clone)
    const canvas = await rasterizeSvgToCanvas(svgString, width, height)
    const ctx = canvas.getContext('2d')
    if (!ctx) continue
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const palette = quantize(data, 256)
    const index = applyPalette(data, palette)
    gif.writeFrame(index, canvas.width, canvas.height, { palette, delay: step, repeat: 0 })
  }

  gif.finish()
  downloadBlob(new Blob([new Uint8Array(gif.bytes())], { type: 'image/gif' }), 'animace.gif')
}
