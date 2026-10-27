/**
 * Utility functions for parsing SVG XML
 */

import { playerTools } from '../playerConstants'
import { equipmentTools } from '../EquipmentSelector'
import type { PlayerOnCanvas, EquipmentOnCanvas, Line, FreehandLine } from '../DrawingTypes'

export interface ParsedSvgData {
  isFlotr: boolean
  players: PlayerOnCanvas[]
  equipment: EquipmentOnCanvas[]
  lines: Line[]
  freehandLines: FreehandLine[]
}

/**
 * Parses SVG XML and extracts drawing elements
 */
export function parseSvgXmlToCollections(svgXml: string): ParsedSvgData {
  const parser = new window.DOMParser()
  const doc = parser.parseFromString(svgXml, 'image/svg+xml')
  const svg = doc.querySelector('svg')

  if (!svg) {
    return { isFlotr: false, players: [], equipment: [], lines: [], freehandLines: [] }
  }

  const isFlotr = svg.getAttribute('src') === 'flotr'
  if (!isFlotr) {
    return { isFlotr: false, players: [], equipment: [], lines: [], freehandLines: [] }
  }

  // Parse players
  const players: PlayerOnCanvas[] = []
  doc.querySelectorAll('circle[data-type="player"]').forEach((el) => {
    players.push({
      tool: {
        toolId: el.getAttribute('data-tool-id') || 'player',
        category: 'player',
        label: el.getAttribute('data-label') || '',
        type: 'player',
        radius: Number(el.getAttribute('r')),
        fill: el.getAttribute('fill') || '',
        stroke: el.getAttribute('stroke') || '',
        strokeWidth: Number(el.getAttribute('stroke-width')),
        text: el.getAttribute('data-text') || '',
        textColor: el.getAttribute('data-text-color') || '#000',
      },
      x: Number(el.getAttribute('cx')),
      y: Number(el.getAttribute('cy')),
    })
  })

  // Parse equipment
  const equipment: EquipmentOnCanvas[] = []
  doc.querySelectorAll('[data-type="equipment"]').forEach((el) => {
    const ballsAttr = el.getAttribute('data-balls')
    equipment.push({
      tool: {
        toolId: el.getAttribute('data-tool-id') || 'equipment',
        category: 'equipment',
        label: el.getAttribute('data-label') || '',
        type: 'equipment',
        radius: Number(el.getAttribute('r')),
        fill: el.getAttribute('fill') || undefined,
        stroke: el.getAttribute('stroke') || undefined,
        strokeWidth: Number(el.getAttribute('stroke-width')),
        width: Number(el.getAttribute('width')),
        height: Number(el.getAttribute('height')),
        length: Number(el.getAttribute('data-length')),
      },
      x: Number(el.getAttribute('cx')) || Number(el.getAttribute('x')) || 0,
      y: Number(el.getAttribute('cy')) || Number(el.getAttribute('y')) || 0,
      balls: ballsAttr ? JSON.parse(ballsAttr) : undefined,
    })
  })

  // Parse lines
  const lines: Line[] = []
  doc.querySelectorAll('line[data-type="line"]').forEach((el) => {
    lines.push({
      x1: Number(el.getAttribute('x1')),
      y1: Number(el.getAttribute('y1')),
      x2: Number(el.getAttribute('x2')),
      y2: Number(el.getAttribute('y2')),
      color: el.getAttribute('stroke') || '',
      type: el.getAttribute('data-line-type') || 'line',
      dash: el.getAttribute('stroke-dasharray') || '',
      arrow: el.getAttribute('data-arrow') === 'true',
      strokeWidth: Number(el.getAttribute('stroke-width')),
    })
  })

  // Parse freehand lines
  const freehandLines: FreehandLine[] = []
  doc.querySelectorAll('path[data-type="freehand"]').forEach((el) => {
    const pointsAttr = el.getAttribute('data-points')
    const points = pointsAttr ? JSON.parse(pointsAttr) : []
    freehandLines.push({
      points,
      color: el.getAttribute('stroke') || 'black',
      dash: el.getAttribute('stroke-dasharray') || '',
      strokeWidth: Number(el.getAttribute('stroke-width')),
      arrow: el.getAttribute('data-arrow') === 'true',
    })
  })

  return { isFlotr, players, equipment, lines, freehandLines }
}

const STATE_ID = 'flotr-state'

/** Embeds the full drawing state in the SVG, so a downloaded file can be loaded back losslessly. */
export function embedFlotrState(svgString: string, stateJson: string): string {
  const meta = `<metadata id='${STATE_ID}'><![CDATA[${stateJson.replace(/]]>/g, ']]]]><![CDATA[>')}]]></metadata>`
  const i = svgString.lastIndexOf('</svg>')
  return i < 0 ? svgString : svgString.slice(0, i) + meta + svgString.slice(i)
}

/** Returns the embedded state JSON of a FloTr SVG, or null if the file isn't one / has none. */
export function extractFlotrState(svgXml: string): string | null {
  const doc = new window.DOMParser().parseFromString(svgXml, 'image/svg+xml')
  const svg = doc.querySelector('svg')
  if (svg?.getAttribute('src') !== 'flotr') return null
  return doc.querySelector(`#${STATE_ID}`)?.textContent ?? null
}

// ── Legacy files (exported before the state was embedded) ────────────────────
// Rebuilds what can be recognised from the rendered shapes: players, equipment, plain lines.
// Texts, numbers, shapes and freehand lines aren't recoverable from the old markup.

function translateOf(el: Element): { x: number; y: number; rotation?: number } {
  const tr = el.getAttribute('transform') ?? ''
  const t = /translate\(\s*([-\d.eE]+)[ ,]+([-\d.eE]+)\s*\)/.exec(tr)
  const r = /rotate\(\s*([-\d.eE]+)/.exec(tr)
  return { x: Number(t?.[1] ?? 0), y: Number(t?.[2] ?? 0), rotation: r ? Number(r[1]) : undefined }
}

const topLevel = (doc: Document, prefix: string) =>
  [...doc.querySelectorAll(`g[id^="${prefix}"]`)].filter(
    (g) => g.hasAttribute('transform') && !(g.parentElement?.id ?? '').startsWith(prefix)
  )

export function parseLegacyFlotrSvg(svgXml: string): ParsedSvgData | null {
  const doc = new window.DOMParser().parseFromString(svgXml, 'image/svg+xml')
  const svg = doc.querySelector('svg')
  if (svg?.getAttribute('src') !== 'flotr' || doc.querySelector('parsererror')) return null

  const players: PlayerOnCanvas[] = topLevel(doc, 'player-').map((g) => {
    const { x, y } = translateOf(g)
    const circle = g.querySelector(':scope > circle')
    const poly = g.querySelector(':scope > polygon')
    const shape = circle ?? poly ?? g.querySelector('path')
    const fill = shape?.getAttribute('fill') ?? 'black'
    const stroke = shape?.getAttribute('stroke') ?? 'black'
    const type = circle ? undefined : poly ? 'playerC' : 'playerA'
    const base =
      playerTools.find(
        (p) =>
          p.fill === fill &&
          p.stroke === stroke &&
          (type ? p.type === type : ['playerB', 'coach', 'opponent'].includes(p.type)) &&
          (!circle || p.radius === Number(circle.getAttribute('r')))
      ) ??
      playerTools.find((p) => (type ? p.type === type : p.type === 'playerB')) ??
      playerTools[0]
    const text = g.querySelector(':scope > text')?.textContent
    return { tool: { ...base, fill, stroke, ...(text ? { text } : {}) }, x, y }
  })

  const equipment: EquipmentOnCanvas[] = []
  for (const g of topLevel(doc, 'equipment')) {
    const { x, y, rotation } = translateOf(g)
    const d = g.querySelector('path')?.getAttribute('d') ?? ''
    const toolId = d.startsWith('M6.01 10.53')
      ? 'ball'
      : d.startsWith('M25.0329')
        ? 'low-cone'
        : g.querySelector('polygon[points^="23.06"]')
          ? 'slalom-pole'
          : g.querySelector('[stroke="#e11d48"]')
            ? 'gate'
            : g.querySelectorAll('line').length > 2
              ? 'ladder'
              : null
    const tool = equipmentTools.find((t) => t.toolId === toolId)
    if (!tool) continue
    const item: EquipmentOnCanvas = { tool, x, y, ...(rotation ? { rotation } : {}) }
    if (toolId === 'ladder') {
      // The two rails run along the ladder; their end points average to the far end.
      const [r1, r2] = [...g.querySelectorAll('line')]
      const ex = (Number(r1.getAttribute('x2')) + Number(r2.getAttribute('x2'))) / 2
      const ey = (Number(r1.getAttribute('y2')) + Number(r2.getAttribute('y2'))) / 2
      item.x2 = x + ex
      item.y2 = y + ey
    }
    equipment.push(item)
  }

  const lines: Line[] = [...doc.querySelectorAll('line[id^="line"]')].map((el) => ({
    x1: Number(el.getAttribute('x1')),
    y1: Number(el.getAttribute('y1')),
    x2: Number(el.getAttribute('x2')),
    y2: Number(el.getAttribute('y2')),
    color: el.getAttribute('stroke') || '#000',
    type: 'line-solid',
    dash: el.getAttribute('stroke-dasharray') || '',
    arrow: !!el.getAttribute('marker-end'),
    strokeWidth: Number(el.getAttribute('stroke-width')) || 1,
  }))

  return { isFlotr: true, players, equipment, lines, freehandLines: [] }
}
