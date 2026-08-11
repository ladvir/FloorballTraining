import { describe, it, expect } from 'vitest'
import { injectSmilAnimation } from './smilGenerator'
import type { Frame, FramePositions } from '../DrawingTypes'

const emptyPositions = (): FramePositions => ({
  players: [],
  equipment: [],
  lines: [],
  freehandLines: [],
  texts: [],
  numbers: [],
  shapes: [],
})

function svgWithPlayer(x: number, y: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240"><g id="player-0" transform="translate(${x},${y})"><circle r="6" /></g></svg>`
}

function frame(x: number, y: number, durationMs: number): Frame {
  const positions = emptyPositions()
  positions.players = [{ tool: {} as never, x, y }]
  return { positions, durationMs }
}

function getAnimateTransforms(svg: string) {
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml')
  return Array.from(doc.getElementById('player-0')!.getElementsByTagName('animateTransform'))
}

describe('injectSmilAnimation', () => {
  it('returns the SVG unchanged for fewer than 2 frames', () => {
    const base = svgWithPlayer(10, 20)
    expect(injectSmilAnimation(base, [frame(10, 20, 1000)])).toBe(base)
  })

  it('generates one freeze segment for a 2-frame storyboard', () => {
    const base = svgWithPlayer(10, 20)
    const frames = [frame(10, 20, 1000), frame(50, 60, 1000)]
    const result = injectSmilAnimation(base, frames)
    const anims = getAnimateTransforms(result)

    expect(anims).toHaveLength(1)
    expect(anims[0].getAttribute('type')).toBe('translate')
    expect(anims[0].getAttribute('begin')).toBe('0ms')
    expect(anims[0].getAttribute('dur')).toBe('1000ms')
    expect(anims[0].getAttribute('from')).toBe('10,20')
    expect(anims[0].getAttribute('to')).toBe('50,60')
    expect(anims[0].getAttribute('fill')).toBe('freeze')
  })

  it('chains cumulative begin times across 3+ frames, freezing only the last segment', () => {
    const base = svgWithPlayer(0, 0)
    const frames = [frame(0, 0, 500), frame(100, 0, 700), frame(100, 200, 300)]
    const result = injectSmilAnimation(base, frames)
    const anims = getAnimateTransforms(result)

    expect(anims).toHaveLength(2)

    expect(anims[0].getAttribute('begin')).toBe('0ms')
    expect(anims[0].getAttribute('dur')).toBe('500ms')
    expect(anims[0].getAttribute('from')).toBe('0,0')
    expect(anims[0].getAttribute('to')).toBe('100,0')
    expect(anims[0].getAttribute('fill')).toBe('remove')

    expect(anims[1].getAttribute('begin')).toBe('500ms')
    expect(anims[1].getAttribute('dur')).toBe('700ms')
    expect(anims[1].getAttribute('from')).toBe('100,0')
    expect(anims[1].getAttribute('to')).toBe('100,200')
    expect(anims[1].getAttribute('fill')).toBe('freeze')
  })

  it('generates no animation for an item that never changes position', () => {
    const base = svgWithPlayer(30, 30)
    const frames = [frame(30, 30, 1000), frame(30, 30, 1000), frame(30, 30, 1000)]
    const result = injectSmilAnimation(base, frames)

    expect(getAnimateTransforms(result)).toHaveLength(0)
  })
})
