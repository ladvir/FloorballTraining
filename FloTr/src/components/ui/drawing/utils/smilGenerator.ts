import type { Frame } from '../DrawingTypes'

const SVG_NS = 'http://www.w3.org/2000/svg'

interface Segment {
  begin: number
  dur: number
  from: string
  to: string
  freeze: boolean
}

/** Builds one segment per frame transition if the value changes anywhere across the storyboard. */
function buildSegments(
  beginTimes: number[],
  durationsMs: number[],
  valuesPerFrame: string[]
): Segment[] | null {
  const changed = valuesPerFrame.some((v) => v !== valuesPerFrame[0])
  if (!changed) return null
  const segments: Segment[] = []
  for (let i = 0; i < valuesPerFrame.length - 1; i++) {
    segments.push({
      begin: beginTimes[i],
      dur: durationsMs[i],
      from: valuesPerFrame[i],
      to: valuesPerFrame[i + 1],
      freeze: i === valuesPerFrame.length - 2,
    })
  }
  return segments
}

function appendAnimate(doc: Document, target: Element, attributeName: string, segments: Segment[]) {
  for (const seg of segments) {
    const el = doc.createElementNS(SVG_NS, 'animate')
    el.setAttribute('attributeName', attributeName)
    el.setAttribute('begin', `${seg.begin}ms`)
    el.setAttribute('dur', `${seg.dur}ms`)
    el.setAttribute('from', seg.from)
    el.setAttribute('to', seg.to)
    el.setAttribute('fill', seg.freeze ? 'freeze' : 'remove')
    target.appendChild(el)
  }
}

function appendAnimateTranslate(doc: Document, target: Element, segments: Segment[]) {
  for (const seg of segments) {
    const el = doc.createElementNS(SVG_NS, 'animateTransform')
    el.setAttribute('attributeName', 'transform')
    el.setAttribute('type', 'translate')
    el.setAttribute('begin', `${seg.begin}ms`)
    el.setAttribute('dur', `${seg.dur}ms`)
    el.setAttribute('from', seg.from)
    el.setAttribute('to', seg.to)
    el.setAttribute('fill', seg.freeze ? 'freeze' : 'remove')
    target.appendChild(el)
  }
}

function animateNumeric(
  doc: Document,
  target: Element | null,
  attributeName: string,
  beginTimes: number[],
  durationsMs: number[],
  valuesPerFrame: number[]
) {
  if (!target) return
  const segments = buildSegments(beginTimes, durationsMs, valuesPerFrame.map(String))
  if (segments) appendAnimate(doc, target, attributeName, segments)
}

/**
 * Injects SMIL <animate>/<animateTransform> elements into a serialized drawing SVG,
 * based on a multi-frame storyboard. Items are matched to frame data positionally —
 * frames[k].positions.players[i] is "the same" player as frames[k+1].positions.players[i] —
 * mirroring the index-based identity already used by moveUtils.ts for drag/move.
 *
 * ponytail: freehand paths, `shoot`-type lines, and equipment whose rotation or
 * secondary endpoint (x2/y2) changes across frames are left static (frame 0's values) —
 * they don't reduce to a single simple attribute animation. Extend when a real
 * storyboard needs them.
 */
export function injectSmilAnimation(svgString: string, frames: Frame[]): string {
  if (frames.length < 2) return svgString

  const durationsMs = frames.slice(0, -1).map((f) => f.durationMs)
  const beginTimes: number[] = [0]
  for (const d of durationsMs) beginTimes.push(beginTimes[beginTimes.length - 1] + d)

  const doc = new DOMParser().parseFromString(svgString, 'image/svg+xml')

  const first = frames[0].positions

  // Players & equipment: single <g> positioned via transform="translate(x,y)".
  first.players.forEach((_, i) => {
    const values = frames.map((f) => f.positions.players[i])
    if (values.some((v) => !v)) return
    const target = doc.getElementById(`player-${i}`)
    if (!target) return
    const segments = buildSegments(
      beginTimes,
      durationsMs,
      values.map((v) => `${v.x},${v.y}`)
    )
    if (segments) appendAnimateTranslate(doc, target, segments)
  })

  first.equipment.forEach((_, i) => {
    const values = frames.map((f) => f.positions.equipment[i])
    if (values.some((v) => !v)) return
    const rotation0 = values[0].rotation ?? 0
    if (values.some((v) => (v.rotation ?? 0) !== rotation0)) return
    const offset0 = {
      dx: (values[0].x2 ?? values[0].x) - values[0].x,
      dy: (values[0].y2 ?? values[0].y) - values[0].y,
    }
    const rigid = values.every((v) => {
      const dx = (v.x2 ?? v.x) - v.x
      const dy = (v.y2 ?? v.y) - v.y
      return dx === offset0.dx && dy === offset0.dy
    })
    if (!rigid) return
    const target = doc.getElementById(`equipment${i}`)
    if (!target) return
    const segments = buildSegments(
      beginTimes,
      durationsMs,
      values.map((v) => `${v.x},${v.y}`)
    )
    if (segments) appendAnimateTranslate(doc, target, segments)
  })

  // Lines: direct x1/y1/x2/y2 attributes. 'shoot' lines render as three offset
  // sub-lines with no single positioned element — not supported here.
  first.lines.forEach((line, i) => {
    if (line.type === 'shoot') return
    const values = frames.map((f) => f.positions.lines[i])
    if (values.some((v) => !v)) return
    const target = doc.getElementById(`line${i}`)
    if (!target) return
    animateNumeric(
      doc,
      target,
      'x1',
      beginTimes,
      durationsMs,
      values.map((v) => v.x1)
    )
    animateNumeric(
      doc,
      target,
      'y1',
      beginTimes,
      durationsMs,
      values.map((v) => v.y1)
    )
    animateNumeric(
      doc,
      target,
      'x2',
      beginTimes,
      durationsMs,
      values.map((v) => v.x2)
    )
    animateNumeric(
      doc,
      target,
      'y2',
      beginTimes,
      durationsMs,
      values.map((v) => v.y2)
    )
  })

  // Texts & numbers: <text id="..."> with x/y attributes.
  first.texts.forEach((_, i) => {
    const values = frames.map((f) => f.positions.texts[i])
    if (values.some((v) => !v)) return
    const target = doc.getElementById(`text${i}`)
    animateNumeric(
      doc,
      target,
      'x',
      beginTimes,
      durationsMs,
      values.map((v) => v.x)
    )
    animateNumeric(
      doc,
      target,
      'y',
      beginTimes,
      durationsMs,
      values.map((v) => v.y)
    )
  })

  first.numbers.forEach((_, i) => {
    const values = frames.map((f) => f.positions.numbers[i])
    if (values.some((v) => !v)) return
    const target = doc.getElementById(`number${i}`)
    animateNumeric(
      doc,
      target,
      'x',
      beginTimes,
      durationsMs,
      values.map((v) => v.x)
    )
    animateNumeric(
      doc,
      target,
      'y',
      beginTimes,
      durationsMs,
      values.map((v) => v.y)
    )
  })

  // Shapes: position attribute depends on shape type.
  first.shapes.forEach((shape, i) => {
    const values = frames.map((f) => f.positions.shapes[i])
    if (values.some((v) => !v || v.type !== shape.type)) return
    const target = doc.getElementById(`shape${i}`)
    if (!target) return
    if (shape.type === 'rectangle' || shape.type === 'square') {
      animateNumeric(
        doc,
        target,
        'x',
        beginTimes,
        durationsMs,
        values.map((v) => v.x)
      )
      animateNumeric(
        doc,
        target,
        'y',
        beginTimes,
        durationsMs,
        values.map((v) => v.y)
      )
    } else if (shape.type === 'circle' || shape.type === 'ellipse') {
      animateNumeric(
        doc,
        target,
        'cx',
        beginTimes,
        durationsMs,
        values.map((v) => v.cx)
      )
      animateNumeric(
        doc,
        target,
        'cy',
        beginTimes,
        durationsMs,
        values.map((v) => v.cy)
      )
    } else if (shape.type === 'triangle') {
      if (values.some((v) => v.points.length !== shape.points.length)) return
      const segments = buildSegments(
        beginTimes,
        durationsMs,
        values.map((v) => v.points.map((p) => `${p.x},${p.y}`).join(' '))
      )
      if (segments) appendAnimate(doc, target, 'points', segments)
    }
  })

  return new XMLSerializer().serializeToString(doc)
}
