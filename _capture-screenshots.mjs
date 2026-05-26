#!/usr/bin/env node
/**
 * Captura screenshots de Genealogic en las 2 medidas que pide App Store:
 *   - 6.9"  → 1290 × 2796 (iPhone 14/15/16 Pro Max)
 *   - 6.5"  → 1242 × 2688 (iPhone XS Max / 11 Pro Max)
 *
 * Estrategia: Playwright con device-scale-factor=3 para que el render sea
 * en physical pixels. Cookie `app_platform=ios` para activar el blindaje
 * iOS y que la web responda igual que dentro del WebView de Capacitor.
 *
 * Cada pantalla lleva un overlay de status bar simulado (9:41 + señal +
 * wifi + batería) inyectado vía CSS antes de capturar. Eso da el look
 * "nativo" que Apple prefiere.
 */
import { chromium } from 'playwright'
import path from 'path'
import fs from 'fs'

const EMAIL = 'screenshots@genealogic.io'
const PASSWORD = 'TestScreens-IviQlNLdKdAqzW'
const BASE = 'https://www.genealogic.io'

// CSS pixels (@DPR=3 da physical pixels = target Apple)
const SIZES = {
  '6.9-inch': { width: 430, height: 932, target: { w: 1290, h: 2796 } },
  '6.5-inch': { width: 414, height: 896, target: { w: 1242, h: 2688 } },
}

const STATUS_BAR_CSS = `
  body::before {
    content: '';
    position: fixed; top: 0; left: 0; right: 0;
    height: 47px;
    background: white;
    z-index: 99999;
    pointer-events: none;
  }
  body::after {
    content: '';
    position: fixed; top: 0; left: 0; right: 0;
    height: 47px;
    z-index: 100000;
    pointer-events: none;
    background-image:
      /* "9:41" izquierda */
      url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="22"><text x="0" y="16" font-family="-apple-system,system-ui" font-size="17" font-weight="600" fill="black">9:41</text></svg>'),
      /* Indicadores derecha: señal + wifi + batería */
      url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="14"><g fill="black"><rect x="0" y="9" width="3" height="5" rx="1"/><rect x="5" y="6" width="3" height="8" rx="1"/><rect x="10" y="3" width="3" height="11" rx="1"/><rect x="15" y="0" width="3" height="14" rx="1"/><path d="M30 10 a8 6 0 0 1 14 0 M32 11 a6 4 0 0 1 10 0 M35 12 a3 2 0 0 1 4 0"/><rect x="50" y="0" width="26" height="13" rx="3" fill="none" stroke="black" stroke-width="1.2"/><rect x="52" y="2" width="22" height="9" rx="1.5"/><rect x="77" y="4" width="2" height="5" rx="0.5"/></g></svg>');
    background-repeat: no-repeat;
    background-position: 24px 16px, right 18px top 17px;
  }
`

const SCREENS = [
  {
    name: '01-login',
    requiresAuth: false,
    url: '/login',
    waitFor: async (page) => {
      await page.waitForSelector('input[type="email"]', { timeout: 10000 })
    },
  },
  {
    name: '02-dashboard',
    requiresAuth: true,
    url: '/dashboard',
    waitFor: async (page) => {
      await page.waitForSelector('text=Hola', { timeout: 15000 }).catch(() => {})
      await page.waitForTimeout(1500)
    },
  },
  {
    name: '03-dogs-list',
    requiresAuth: true,
    url: '/dogs',
    waitFor: async (page) => {
      await page.waitForSelector('img[alt]', { timeout: 15000 }).catch(() => {})
      await page.waitForTimeout(2000)  // imágenes
    },
  },
  {
    name: '04-dog-detail',
    requiresAuth: true,
    url: null, // se calcula tras login (primer perro)
    dynamic: async (page) => {
      const firstDogHref = await page.$$eval('a[href*="/dogs/"]', (links) => {
        const dogLink = links.find((a) => /\/dogs\/[a-f0-9-]{36}/.test(a.href))
        return dogLink ? dogLink.getAttribute('href') : null
      }).catch(() => null)
      return firstDogHref || '/dogs'
    },
    waitFor: async (page) => {
      await page.waitForTimeout(2500)
    },
  },
  {
    name: '05-pedigree',
    requiresAuth: true,
    url: null,
    dynamic: async (page, ctx) => {
      // Asume que el /dogs/[id] anterior tiene una sub-ruta /pedigree
      return ctx.lastDogPath ? `${ctx.lastDogPath}/pedigree` : '/dogs'
    },
    waitFor: async (page) => {
      await page.waitForTimeout(2500)
    },
  },
  {
    name: '06-calendar',
    requiresAuth: true,
    url: '/calendar',
    waitFor: async (page) => {
      await page.waitForTimeout(2000)
    },
  },
]

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await page.fill('input[type="email"]', EMAIL)
  await page.fill('input[type="password"]', PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/dashboard|\/onboarding/, { timeout: 15000 })
  await page.waitForTimeout(2000) // animaciones post-login
}

async function captureForSize(browser, label, cfg) {
  const outDir = path.join('/tmp/genealogic-screenshots', label)
  fs.mkdirSync(outDir, { recursive: true })

  console.log(`\n━━━ ${label} (${cfg.target.w}×${cfg.target.h}) ━━━`)

  const context = await browser.newContext({
    viewport: { width: cfg.width, height: cfg.height },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 GenealogicIOSApp/1.0',
  })
  // Cookie iOS para forzar el blindaje server-side
  await context.addCookies([{
    name: 'app_platform', value: 'ios',
    domain: 'www.genealogic.io', path: '/',
  }])

  const page = await context.newPage()
  await page.addStyleTag({ content: STATUS_BAR_CSS }).catch(() => {})

  // Pantallas que requieren login → login una vez al inicio
  await login(page)

  const ctx = { lastDogPath: null }

  for (const s of SCREENS) {
    try {
      let target = s.url
      if (s.dynamic) target = await s.dynamic(page, ctx)
      if (target.startsWith('/dogs/') && /\/dogs\/[a-f0-9-]{36}/.test(target)) {
        ctx.lastDogPath = target.replace(/\/$/, '')
      }
      const fullUrl = target.startsWith('http') ? target : `${BASE}${target}`

      if (!s.requiresAuth) {
        // Para /login hay que salir primero
        await page.context().clearCookies()
        await context.addCookies([{
          name: 'app_platform', value: 'ios',
          domain: 'www.genealogic.io', path: '/',
        }])
      }

      await page.goto(fullUrl, { waitUntil: 'networkidle' })
      // Reinyectar status bar tras navegación
      await page.addStyleTag({ content: STATUS_BAR_CSS }).catch(() => {})
      if (s.waitFor) await s.waitFor(page)

      const out = path.join(outDir, `${s.name}.png`)
      await page.screenshot({ path: out, fullPage: false })
      console.log(`  ✓ ${s.name} → ${out}`)

      // Si era /login, re-login para los siguientes
      if (!s.requiresAuth) {
        await login(page)
      }
    } catch (err) {
      console.error(`  ✗ ${s.name}: ${err.message}`)
    }
  }

  await context.close()
}

const browser = await chromium.launch({ headless: true })
try {
  for (const [label, cfg] of Object.entries(SIZES)) {
    await captureForSize(browser, label, cfg)
  }
} finally {
  await browser.close()
}
console.log('\n✓ Todo capturado en /tmp/genealogic-screenshots/')
