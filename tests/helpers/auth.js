import { expect } from '@playwright/test'

function getAuthStorageKey() {
  const fromEnv = typeof process !== 'undefined' && process.env.VITE_SUPABASE_URL
  const u = (fromEnv && fromEnv.trim()) || 'https://gxweakeahiofjxocoavo.supabase.co'
  const host = new URL(u.startsWith('http') ? u : `https://${u}`).hostname
  return `sb-${host.split('.')[0]}-auth-token`
}

const MOCK_USER = {
  id: 'a0000000-0000-4000-8000-000000000001',
  email: 'fercreek@gmail.com',
  role: 'authenticated',
  aud: 'authenticated',
  user_metadata: { name: 'Fernando' },
}

const MOCK_PROFILE = {
  id: MOCK_USER.id,
  name: 'Fernando',
  photo_url: null,
  plan: 'pro',
}

// Minimal valid-structure JWT (signature ignored — we mock the server)
function makeFakeJwt(payload) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const body = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  return `${header}.${body}.fakesig`
}

const ACCESS_TOKEN = makeFakeJwt({
  sub: MOCK_USER.id,
  email: MOCK_USER.email,
  role: 'authenticated',
  aud: 'authenticated',
  exp: 9999999999,
  iat: Math.floor(Date.now() / 1000),
})

const MOCK_SESSION = {
  access_token: ACCESS_TOKEN,
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: 9999999999,
  refresh_token: 'fake-refresh-token',
  user: MOCK_USER,
}

/**
 * Injects a fake Supabase session into localStorage and mocks network calls.
 * Call in test beforeEach or at start of each test.
 */
export async function loginAs(page, { user = MOCK_USER, profile = MOCK_PROFILE } = {}) {
  const STORAGE_KEY = getAuthStorageKey()
  const sessionPayload = { ...MOCK_SESSION, user }

  await page.route(/\/auth\/v1\/user/, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(user) })
  )

  await page.route(/\/auth\/v1\/token/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(sessionPayload),
    })
  )

  await page.route('**/rest/v1/profiles**', (route) => {
    if (route.request().method() !== 'GET') return route.continue()
    const u = route.request().url()
    if (u.includes(encodeURIComponent(user.id)) || u.includes(user.id)) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(profile) })
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
  })

  const sessionJson = JSON.stringify(sessionPayload)
  await page.addInitScript(
    ([k, j]) => {
      localStorage.setItem(k, j)
    },
    [STORAGE_KEY, sessionJson]
  )
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
  await expect(page.getByText(/Hola/)).toBeVisible({ timeout: 20000 })
}
