import { test, expect } from '@playwright/test'

test.describe('Foundry home', () => {
  test('SSR ships title, hero, and notebook skeleton', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Foundry · Rust REPL/)
    await expect(page.locator('h1')).toContainText(/Type Rust/i)
    await expect(page.locator('text=Run it where it lives')).toBeVisible()
  })

  test('client hydrates the notebook and mounts CodeMirror', async ({ page }) => {
    await page.goto('/')
    // Skeleton is replaced by the real Notebook on hydration.
    await expect(page.locator('text=Loading notebook…')).toHaveCount(0, { timeout: 8_000 })
    // CM6 mounts client-side and adds .cm-editor.
    await expect(page.locator('.cm-editor').first()).toBeVisible()
  })

  test('share button updates the URL hash with the source', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.cm-editor').first()).toBeVisible()
    // Stub clipboard so the button works even when the browser denies clipboard perms.
    await page.evaluate(() => {
      ;(window as unknown as { __copied: string }).__copied = ''
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText: (s: string) => {
            ;(window as unknown as { __copied: string }).__copied = s
            return Promise.resolve()
          },
        },
      })
    })
    await page.getByRole('button', { name: /^share$/i }).click()
    const copied = await page.evaluate(
      () => (window as unknown as { __copied: string }).__copied,
    )
    expect(copied).toMatch(/#code=/)
  })

  test('Shift+Enter triggers a compile (mocked upstream)', async ({ page }) => {
    // Mock play.rust-lang.org so we don't depend on the public service in CI.
    await page.route('https://play.rust-lang.org/execute', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          stdout: 'hello from e2e\n',
          stderr: '',
          exitDetail: 'Exited with status 0',
        }),
      }),
    )

    await page.goto('/')
    await expect(page.locator('.cm-editor').first()).toBeVisible()

    // Focus the editor and trigger the run shortcut.
    await page.locator('.cm-content').first().click()
    await page.keyboard.press('Shift+Enter')

    await expect(page.locator('text=hello from e2e')).toBeVisible({ timeout: 10_000 })
  })
})
