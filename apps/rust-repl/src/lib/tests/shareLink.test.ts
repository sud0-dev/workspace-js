import { describe, it, expect, beforeEach } from 'vitest'
import { buildShareLink, consumeShareLink } from '../shareLink'

beforeEach(() => {
  history.replaceState(null, '', '/')
})

describe('shareLink · round-trip', () => {
  it('build → consume restores source exactly', () => {
    const src = `fn main() {\n  let s = "hë 🦀 / + = ?";\n  println!("{s}");\n}`
    const url = buildShareLink(src)!
    expect(url).toContain('#code=')
    history.replaceState(null, '', new URL(url).pathname + new URL(url).hash)
    expect(consumeShareLink()).toBe(src)
  })

  it('clears the hash after consuming', () => {
    const url = buildShareLink('let x = 1;')!
    history.replaceState(null, '', new URL(url).pathname + new URL(url).hash)
    consumeShareLink()
    expect(window.location.hash).toBe('')
  })

  it('returns null when no #code= is present', () => {
    history.replaceState(null, '', '/')
    expect(consumeShareLink()).toBeNull()
  })

  it('refuses sources beyond the size cap', () => {
    const huge = 'x'.repeat(33 * 1024)
    expect(buildShareLink(huge)).toBeNull()
  })

  it('survives garbage in the hash', () => {
    history.replaceState(null, '', '/#code=$$$not-base64$$$')
    expect(() => consumeShareLink()).not.toThrow()
  })
})
