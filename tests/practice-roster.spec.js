import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/auth.js'

test.describe('Practice roster + history', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
  })

  test('/practice-history route works', async ({ page }) => {
    await page.goto('/practice-history')
    await expect(page.getByText(/Historial|práctica|Aún no hay/i).first()).toBeVisible()
  })

  test('practice setup shows bulk input', async ({ page }) => {
    await page.getByRole('button', { name: /^Práctica\b/i }).first().click()
    await expect(page.getByPlaceholder(/Pega nombres/i)).toBeVisible()
  })

  test('bulk add parses comma names', async ({ page }) => {
    await page.getByRole('button', { name: /^Práctica\b/i }).first().click()
    const textarea = page.getByPlaceholder(/Pega nombres/i)
    await textarea.fill('Juan, Ana, Luis')
    await expect(page.getByRole('button', { name: /Agregar 3/ })).toBeVisible()
    await page.getByRole('button', { name: /Agregar 3/ }).click()
    await expect(page.getByText('Juan')).toBeVisible()
    await expect(page.getByText('Ana')).toBeVisible()
    await expect(page.getByText('Luis')).toBeVisible()
  })

  test('ARMAR RONDAS button appears with 2+ dancers', async ({ page }) => {
    await page.getByRole('button', { name: /^Práctica\b/i }).first().click()
    await page.getByPlaceholder(/Pega nombres/i).fill('Fer, Ale')
    await page.getByRole('button', { name: /Agregar 2/ }).click()
    await expect(page.getByRole('button', { name: /ARMAR RONDAS/i })).toBeVisible()
  })
})
