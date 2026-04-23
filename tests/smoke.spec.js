import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/auth.js'

const ROSTER = [
  { id: 'c1', name: 'Ale', photo_url: null, frequency_count: 5, repeat_count: 0, last_danced_at: null, user_id: null },
  { id: 'c2', name: 'Dani', photo_url: null, frequency_count: 3, repeat_count: 0, last_danced_at: null, user_id: null },
  { id: 'c3', name: 'Fer', photo_url: null, frequency_count: 2, repeat_count: 0, last_danced_at: null, user_id: null },
]

async function mockSupabase(page) {
  await page.route('**/rest/v1/competitors?**', (route) => {
    if (route.request().method() !== 'GET') return route.continue()
    const u = route.request().url()
    if (u.includes('is_active')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    }
    if (u.includes('repeat_count') && u.includes('frequency_count')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ROSTER) })
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
  })
  await page.route(/\/rest\/v1\/practice_sessions/, (route) => {
    if (route.request().method() === 'POST') {
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'sess-1', created_at: new Date().toISOString() }),
      })
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
  })
}

test('dashboard con sesión (smoke)', async ({ page }) => {
  await loginAs(page)
  await expect(page).toHaveURL(/\/dashboard/)
  await expect(page.getByText(/Hola/)).toBeVisible()
})

test('landing sin sesión (smoke)', async ({ browser }) => {
  const page = await browser.newPage()
  await page.goto('/')
  await expect(page.getByText('Empezar gratis')).toBeVisible()
  await page.close()
})

test('práctica: setup → rondas en vivo (smoke)', async ({ page }) => {
  await loginAs(page)
  await mockSupabase(page)
  await page.goto('/practice/setup')
  await expect(page.getByRole('heading', { name: /Nueva sesión/i })).toBeVisible()
  await page.getByPlaceholder(/Pega nombres/i).fill('A, B')
  await page.getByRole('button', { name: /Agregar 2/ }).click()
  await page.getByRole('button', { name: /ARMAR RONDAS/i }).click()
  await expect(page).toHaveURL(/\/practice\/live/)
  await expect(page.getByRole('heading', { name: /Ronda 1\// })).toBeVisible()
  await page.getByRole('button', { name: /Bailarines/i }).click()
  await expect(page.getByRole('heading', { name: 'Bailarines' })).toBeVisible()
  await page.locator('.fixed.inset-0 button.border-zinc-700').filter({ hasText: 'Cerrar' }).click()
})
