import { defineConfig } from '@playwright/test'
import { loadViteEnv } from './tests/helpers/loadViteEnv.js'

loadViteEnv()

const defaultSupabase = {
  VITE_SUPABASE_URL: 'https://gxweakeahiofjxocoavo.supabase.co',
  VITE_SUPABASE_ANON_KEY:
    process.env.VITE_SUPABASE_ANON_KEY
    || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
}

if (!process.env.VITE_SUPABASE_URL) {
  process.env.VITE_SUPABASE_URL = defaultSupabase.VITE_SUPABASE_URL
}
if (!process.env.VITE_SUPABASE_ANON_KEY) {
  process.env.VITE_SUPABASE_ANON_KEY = defaultSupabase.VITE_SUPABASE_ANON_KEY
}

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://localhost:5173',
    headless: !process.env.PWDEBUG,
    viewport: { width: 390, height: 844 },
    serviceWorkers: 'block',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 120_000,
    env: { ...process.env, ...defaultSupabase },
  },
})
