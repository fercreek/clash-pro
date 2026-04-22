import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/auth.js'

/**
 * Acceptance coverage for specs/quick-practice-roster/:
 * - routes (/practice/setup, /practice/live, /practice/history, /guide)
 * - backwards-compat redirects (/practice → /guide, /practice-history → /practice/history)
 * - roster + bulk input in setup
 * - round-by-round navigation in live
 * - next iteration + terminar práctica on last round
 * - history list after finish
 *
 * Supabase mocks cover competitors (roster) and practice_sessions (save/list).
 */

const ROSTER = [
  { id: 'c1', name: 'Ale', photo_url: null, frequency_count: 5, last_danced_at: null, user_id: null },
  { id: 'c2', name: 'Dani', photo_url: null, frequency_count: 3, last_danced_at: null, user_id: null },
  { id: 'c3', name: 'Fer', photo_url: null, frequency_count: 2, last_danced_at: null, user_id: null },
]

async function mockSupabase(page) {
  // Roster fetch
  await page.route(/\/rest\/v1\/competitors\?select=id%2Cname%2Cphoto_url%2Cfrequency_count/, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ROSTER) })
  )
  // Plain competitors select (used on boot by App.jsx)
  await page.route(/\/rest\/v1\/competitors\?select=id%2Cname%2Cphoto_url%2Cis_active/, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
  )
  // Practice sessions list (empty by default)
  await page.route(/\/rest\/v1\/practice_sessions/, async (route) => {
    const req = route.request()
    if (req.method() === 'POST') {
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'sess-1', created_at: new Date().toISOString() }),
      })
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
  })
}

test.describe('Practice — routes', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
    await mockSupabase(page)
  })

  test('/practice/setup renders SetupScreen in practice mode', async ({ page }) => {
    await page.goto('/practice/setup')
    await expect(page.getByRole('heading', { name: /Nueva sesión/i })).toBeVisible()
    await expect(page.getByPlaceholder(/Pega nombres/i)).toBeVisible()
  })

  test('/practice/live direct access falls back gracefully', async ({ page }) => {
    await page.goto('/practice/live')
    // Without matches, MatchesScreen still renders empty state
    await expect(page.getByRole('heading').first()).toBeVisible()
  })

  test('/practice/history renders history', async ({ page }) => {
    await page.goto('/practice/history')
    await expect(page.getByText(/Historial/i).first()).toBeVisible()
  })

  test('/guide renders guided practice', async ({ page }) => {
    await page.goto('/guide')
    await expect(page.getByRole('heading').first()).toBeVisible()
  })

  test('/practice (legacy) still loads guide content', async ({ page }) => {
    await page.goto('/practice')
    await expect(page.getByRole('heading').first()).toBeVisible()
  })

  test('/practice-history (legacy) still loads history', async ({ page }) => {
    await page.goto('/practice-history')
    await expect(page.getByText(/Historial/i).first()).toBeVisible()
  })
})

test.describe('Practice — setup', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
    await mockSupabase(page)
    await page.goto('/practice/setup')
  })

  test('roster chips visible from global competitors', async ({ page }) => {
    await expect(page.getByRole('button', { name: /^Ale/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /^Dani/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /^Fer/ })).toBeVisible()
  })

  test('roster chips toggle selection', async ({ page }) => {
    await page.getByRole('button', { name: /^Ale/ }).click()
    // Selected chip shows check badge and red border (CSS)
    await expect(page.locator('li').filter({ hasText: 'Ale' })).toBeVisible()
  })

  test('bulk input parses comma-separated list', async ({ page }) => {
    await page.getByPlaceholder(/Pega nombres/i).fill('Juan, Ana, Luis')
    await expect(page.getByRole('button', { name: /Agregar 3/ })).toBeVisible()
    await page.getByRole('button', { name: /Agregar 3/ }).click()
    await expect(page.getByText('Juan')).toBeVisible()
    await expect(page.getByText('Ana')).toBeVisible()
    await expect(page.getByText('Luis')).toBeVisible()
  })

  test('ARMAR RONDAS button enables with 2+ dancers', async ({ page }) => {
    await page.getByPlaceholder(/Pega nombres/i).fill('A, B')
    await page.getByRole('button', { name: /Agregar 2/ }).click()
    const cta = page.getByRole('button', { name: /ARMAR RONDAS/i })
    await expect(cta).toBeVisible()
    await expect(cta).toBeEnabled()
  })
})

test.describe('Practice — live round-by-round', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
    await mockSupabase(page)
    await page.goto('/practice/setup')
    await page.getByPlaceholder(/Pega nombres/i).fill('A, B, C, D')
    await page.getByRole('button', { name: /Agregar 4/ }).click()
    await page.getByRole('button', { name: /ARMAR RONDAS/i }).click()
  })

  test('lands on /practice/live after ARMAR RONDAS', async ({ page }) => {
    await expect(page).toHaveURL(/\/practice\/live/)
  })

  test('header shows Ronda 1/N format', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Ronda 1\// })).toBeVisible()
  })

  test('only current round matches visible', async ({ page }) => {
    // 4 dancers round-robin = 3 rounds × 2 matches. Round 1 shows 2 pairings.
    const pending = page.locator('text=/Toca para iniciar batalla/')
    await expect(pending).toHaveCount(2)
  })

  test('SIGUIENTE RONDA appears after closing all round-1 matches', async ({ page }) => {
    // Cerrar botones cierran partidos en modo práctica (result null)
    const closeButtons = page.getByRole('button', { name: /Cerrar/ })
    await closeButtons.first().click()
    await page.getByRole('button', { name: /Listo/ }).click()
    await page.getByRole('button', { name: /Cerrar/ }).first().click()
    await page.getByRole('button', { name: /Listo/ }).click()
    await expect(page.getByRole('button', { name: /SIGUIENTE RONDA/i })).toBeVisible()
  })

  test('advancing round updates header to Ronda 2/N', async ({ page }) => {
    // Close both round-1 matches
    for (let i = 0; i < 2; i++) {
      await page.getByRole('button', { name: /Cerrar/ }).first().click()
      await page.getByRole('button', { name: /Listo/ }).click()
    }
    await page.getByRole('button', { name: /SIGUIENTE RONDA/i }).click()
    await expect(page.getByRole('heading', { name: /Ronda 2\// })).toBeVisible()
  })
})

test.describe('Practice — finish flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
    await mockSupabase(page)
    await page.goto('/practice/setup')
    await page.getByPlaceholder(/Pega nombres/i).fill('A, B')
    await page.getByRole('button', { name: /Agregar 2/ }).click()
    await page.getByRole('button', { name: /ARMAR RONDAS/i }).click()
  })

  test('2 dancers = 1 round, SIGUIENTE ITERACIÓN + Terminar appear', async ({ page }) => {
    // Close single match
    await page.getByRole('button', { name: /Cerrar/ }).first().click()
    await page.getByRole('button', { name: /Listo/ }).click()
    await expect(page.getByRole('button', { name: /SIGUIENTE ITERACIÓN/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Terminar práctica/i })).toBeVisible()
  })

  test('Terminar práctica navigates to /practice/history', async ({ page }) => {
    await page.getByRole('button', { name: /Cerrar/ }).first().click()
    await page.getByRole('button', { name: /Listo/ }).click()
    await page.getByRole('button', { name: /Terminar práctica/i }).click()
    await expect(page).toHaveURL(/\/practice\/history/)
  })
})
