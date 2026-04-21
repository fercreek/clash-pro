// Supabase project ref from VITE_SUPABASE_URL
const PROJECT_REF = 'gxweakeahiofjxocoavo'
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`
const STORAGE_KEY = `sb-${PROJECT_REF}-auth-token`

const MOCK_USER = {
  id: 'test-user-id-00000000',
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
  // Intercept Supabase auth + REST calls before navigation
  await page.route(/\/auth\/v1\/user/, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(user) })
  )

  await page.route(/\/auth\/v1\/token/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ...MOCK_SESSION, user }),
    })
  )

  await page.route(/\/rest\/v1\/profiles/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([profile]),
    })
  )

  // Navigate first (to get origin), then inject localStorage session
  await page.goto('/', { waitUntil: 'commit' })
  await page.evaluate(
    ([key, session]) => localStorage.setItem(key, JSON.stringify(session)),
    [STORAGE_KEY, MOCK_SESSION]
  )
  // Reload so the Supabase client picks up the stored session
  await page.reload()
}
