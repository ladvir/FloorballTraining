import { describe, it, expect } from 'vitest'
import { embedFlotrState, extractFlotrState, parseLegacyFlotrSvg } from './svgParser'

describe('flotr state embedding', () => {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" src="flotr"><g/></svg>'

  it('round-trips the state JSON, even with ]]> inside', () => {
    const json = JSON.stringify({ fieldId: 'a', t: 'x]]>y <b>&' })
    expect(extractFlotrState(embedFlotrState(svg, json))).toBe(json)
  })

  it('rejects SVGs without src="flotr" or without embedded state', () => {
    expect(
      extractFlotrState(embedFlotrState('<svg xmlns="http://www.w3.org/2000/svg"><g/></svg>', '{}'))
    ).toBeNull()
    expect(extractFlotrState(svg)).toBeNull()
  })
})

describe('parseLegacyFlotrSvg', () => {
  const legacy = `<?xml version="1.0" standalone="no"?>
<svg id="svg-canvas" viewBox="0 0 970 600" src="flotr" xmlns="http://www.w3.org/2000/svg"><g id="content-layer">
<g> // note<defs><filter id="dilate"/></defs><line id="line0" x1="1" y1="2" x2="3" y2="4" stroke="#cc0000" stroke-width="2" stroke-dasharray="" fill="none"/></g>
<g><g id="player-0" transform="translate(28.5,93.8)"><circle r="16" fill="red" stroke="black" stroke-width="1.5"/></g></g>
<g><g id="player-1" transform="translate(5,6)"><polygon points="0,-18 16,9 -16,9" fill="white" stroke="black"/></g></g>
<g><g id="equipment0" transform="translate(85,110)"><g id="equipment0" transform="translate(-6,-5.5)"><path d="M6.01 10.53c-.14"/></g></g></g>
<g><g id="equipment1" transform="translate(46,283)"><g id="equipment1" transform="translate(-16,-15.5)"><path d="M25.0329,18.04"/></g></g></g>
</g></svg>`

  it('rebuilds players, equipment and lines from rendered shapes', () => {
    const r = parseLegacyFlotrSvg(legacy)!
    expect(r.players.map((p) => [p.tool.toolId, p.x, p.y])).toEqual([
      ['player-red', 28.5, 93.8],
      ['tri-white', 5, 6],
    ])
    expect(r.equipment.map((e) => [e.tool.toolId, e.x, e.y])).toEqual([
      ['ball', 85, 110],
      ['low-cone', 46, 283],
    ])
    expect(r.lines).toHaveLength(1)
    expect(r.lines[0]).toMatchObject({ x2: 3, color: '#cc0000', strokeWidth: 2 })
  })

  it('returns null without src="flotr"', () => {
    expect(parseLegacyFlotrSvg('<svg xmlns="http://www.w3.org/2000/svg"/>')).toBeNull()
  })
})
