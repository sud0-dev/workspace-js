import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { AnsiOutput } from '../AnsiOutput'

describe('AnsiOutput', () => {
  it('renders plain text unchanged', () => {
    const { container } = render(<AnsiOutput text="hello world" />)
    expect(container.textContent).toBe('hello world')
  })

  it('maps red ANSI to ansi-red class', () => {
    const text = '\x1b[31merror\x1b[0m'
    const { container } = render(<AnsiOutput text={text} />)
    const span = container.querySelector('.ansi-red')
    expect(span).not.toBeNull()
    expect(span?.textContent).toBe('error')
  })

  it('handles bold + color combo', () => {
    const text = '\x1b[1;33mwarn\x1b[0m'
    const { container } = render(<AnsiOutput text={text} />)
    const span = container.querySelector('.ansi-yellow.ansi-bold')
    expect(span).not.toBeNull()
  })

  it('preserves the wrapping .ansi container for mono styling', () => {
    const { container } = render(<AnsiOutput text="x" />)
    expect(container.firstElementChild?.classList.contains('ansi')).toBe(true)
  })

  it('renders multi-segment ANSI in order', () => {
    const text = 'before \x1b[32mok\x1b[0m after'
    const { container } = render(<AnsiOutput text={text} />)
    expect(container.textContent).toBe('before ok after')
    expect(container.querySelector('.ansi-green')?.textContent).toBe('ok')
  })
})
