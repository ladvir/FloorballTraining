import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AnimatedSvgPlayer } from './AnimatedSvgPlayer'

const SVG =
  '<svg xmlns="http://www.w3.org/2000/svg"><circle id="player-0"><animate attributeName="cx" /></circle></svg>'

beforeEach(() => {
  let n = 0
  vi.stubGlobal('URL', {
    ...URL,
    createObjectURL: vi.fn(() => `blob:mock-${n++}`),
    revokeObjectURL: vi.fn(),
  })
})

describe('AnimatedSvgPlayer', () => {
  it('renders the SVG via an <object> pointing at a blob URL', () => {
    render(<AnimatedSvgPlayer svg={SVG} />)
    const obj = document.querySelector('object')
    expect(obj).toBeInTheDocument()
    expect(obj?.getAttribute('data')).toMatch(/^blob:mock-/)
    expect(obj?.getAttribute('type')).toBe('image/svg+xml')
  })

  it('replay button restarts the object without triggering onClick', async () => {
    const onClick = vi.fn()
    render(<AnimatedSvgPlayer svg={SVG} onClick={onClick} />)
    const objBefore = document.querySelector('object')

    await userEvent.click(screen.getByTitle('activities.replayAnimation'))

    expect(onClick).not.toHaveBeenCalled()
    // key change remounts the <object> node
    expect(document.querySelector('object')).not.toBe(objBefore)
  })

  it('clicking the image area calls onClick when provided', async () => {
    const onClick = vi.fn()
    render(<AnimatedSvgPlayer svg={SVG} onClick={onClick} />)
    await userEvent.click(document.querySelector('button.cursor-zoom-in')!)
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
