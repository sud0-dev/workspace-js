import { describe, it, expect, vi } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { RustEditor } from '../RustEditor'

const noop = () => {}

describe('RustEditor · mount', () => {
  it('renders an editor host into the DOM', () => {
    const { container } = render(
      <RustEditor value="" onChange={noop} onRun={noop} onRunAndAdd={noop} />,
    )
    expect(container.querySelector('.cm-host')).not.toBeNull()
    expect(container.querySelector('.cm-editor')).not.toBeNull()
    cleanup()
  })

  it('shows initial source in the document', () => {
    const src = 'fn main() { println!("foundry"); }'
    const { container } = render(
      <RustEditor value={src} onChange={noop} onRun={noop} onRunAndAdd={noop} />,
    )
    expect(container.textContent ?? '').toContain('println!')
    cleanup()
  })

  it('mounts cleanly when disabled', () => {
    const { container } = render(
      <RustEditor value="x" onChange={noop} onRun={noop} onRunAndAdd={noop} disabled />,
    )
    expect(container.querySelector('.cm-editor')).not.toBeNull()
    cleanup()
  })

  it('does not call onChange on initial mount', () => {
    const onChange = vi.fn()
    render(
      <RustEditor value="seed" onChange={onChange} onRun={noop} onRunAndAdd={noop} />,
    )
    expect(onChange).not.toHaveBeenCalled()
    cleanup()
  })
})
