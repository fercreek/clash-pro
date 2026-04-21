import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/auth.js'

test.describe('Dashboard (authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
  })

  test('lands on /dashboard after login', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('shows greeting with name', async ({ page }) => {
    // greeting contains the profile name — wait for async profile load
    await expect(page.locator('text=Hola').first()).toBeVisible()
  })

  test('mode cards visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Competición/i }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: /^Práctica/i }).first()).toBeVisible()
  })

  test('tool buttons visible', async ({ page }) => {
    await expect(page.getByText('Patrones')).toBeVisible()
    await expect(page.getByText('Guía')).toBeVisible()
    await expect(page.getByText('Base')).toBeVisible()
  })

  test('Competición → SETUP screen', async ({ page }) => {
    await page.getByRole('button', { name: /Competición/i }).first().click()
    await expect(page.getByText(/competidores|Agregar/i).first()).toBeVisible()
  })

  test('Práctica → SETUP screen', async ({ page }) => {
    // exact button via role — avoids matching "Guía de práctica"
    await page.getByRole('button', { name: /^Práctica\b/i }).first().click()
    await expect(page.getByText(/competidores|Agregar/i).first()).toBeVisible()
  })

  test('/patterns route works', async ({ page }) => {
    await page.goto('/patterns')
    await expect(page.getByText('Secuenciador de ritmos')).toBeVisible()
  })

  test('/practice route works', async ({ page }) => {
    await page.goto('/practice')
    // GuiaScreen header
    await expect(page.getByRole('heading').first()).toBeVisible()
  })

  test('/blog route works', async ({ page }) => {
    await page.goto('/blog')
    await expect(page.getByRole('heading', { name: /Aprender Salsa/i })).toBeVisible()
  })
})

test.describe('Landing (unauthenticated)', () => {
  test('shows landing at /', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /CLASHPRO/i })).toBeVisible()
    await expect(page.getByText('Empezar gratis')).toBeVisible()
  })

  test('sign-in form visible', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByPlaceholder(/usuario/i)).toBeVisible()
    await expect(page.getByPlaceholder(/contraseña/i)).toBeVisible()
  })
})
