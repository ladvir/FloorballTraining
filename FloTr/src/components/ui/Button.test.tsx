import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'

describe('Button', () => {
  it('renders its children', () => {
    render(<Button>Uložit</Button>)
    expect(screen.getByRole('button', { name: 'Uložit' })).toBeInTheDocument()
  })

  it('calls onClick when pressed', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Klikni</Button>)

    await userEvent.click(screen.getByRole('button', { name: 'Klikni' }))

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled while loading', () => {
    render(<Button loading>Načítám</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
