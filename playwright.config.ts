/**
 * Playwright config — tests E2E mínimos contra prod (genealogic.io).
 *
 * Por qué contra prod en lugar de local:
 *  - No queremos mantener `vercel env pull` + `npm run dev` cada vez.
 *  - Lo que cuenta es que el deploy de producción funcione realmente.
 *  - Los tests son read-only (smoke tests). No crean datos ni borran.
 *
 * Para tests que requieran login / mutaciones, usar PLAYWRIGHT_USE_LOCAL=1
 * y `npm run dev` en otra terminal (config detecta y apunta a localhost).
 *
 * Comando: `npx playwright test`
 * Comando ui: `npx playwright test --ui`
 */
import { defineConfig, devices } from '@playwright/test'

const useLocal = process.env.PLAYWRIGHT_USE_LOCAL === '1'
const baseURL = useLocal ? 'http://localhost:3000' : 'https://www.genealogic.io'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL,
    trace: 'on-first-retry',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
    // User-Agent identificable para excluir del analytics propio
    userAgent: 'Mozilla/5.0 (compatible; GenealogicE2E/1.0)',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
})
