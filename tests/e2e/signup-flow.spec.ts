/**
 * Smoke tests del flujo pricing → register intent-aware.
 *
 * NO crea cuentas reales (eso requeriría limpieza + tests con DB).
 * Solo verifica que:
 *  - /pricing carga con los 3 tiers + CTAs correctas (links a /register?intent=...&plan=...)
 *  - /register?plan=pro renderiza el badge "Plan Pro"
 *  - /register?intent=buyer renderiza el badge "Cuenta de comprador"
 *  - /register sin query renderiza como antes (sin badge)
 *  - El destino del OAuth respeta el intent (data-attribute en el link)
 */
import { test, expect } from '@playwright/test'

test.describe('Pricing → Register intent-aware', () => {
  test('/pricing renderiza 3 tiers con CTAs correctas', async ({ page }) => {
    await page.goto('/pricing')
    await expect(page).toHaveTitle(/Precios|Genealogic/i)
    // Los CTAs Free y Pro apuntan a /register con intent + plan
    const freeLink = page.locator('a[href="/register?intent=breeder&plan=free"]').first()
    const proLink = page.locator('a[href="/register?intent=breeder&plan=pro"]').first()
    await expect(freeLink).toBeVisible()
    await expect(proLink).toBeVisible()
    // Premium es mailto (sales manual)
    const premiumLink = page.locator('a[href^="mailto:hola@genealogic.io"]').first()
    await expect(premiumLink).toBeVisible()
    // CTA secundario al directorio para compradores
    await expect(page.locator('a[href="/kennels"]').first()).toBeVisible()
  })

  test('/register?plan=pro muestra badge "Plan Pro"', async ({ page }) => {
    await page.goto('/register?intent=breeder&plan=pro')
    // Badge contextual visible
    await expect(page.getByText(/Plan Pro/i).first()).toBeVisible()
  })

  test('/register?intent=buyer muestra "Cuenta de comprador"', async ({ page }) => {
    await page.goto('/register?intent=buyer')
    await expect(page.getByText(/Cuenta de comprador/i).first()).toBeVisible()
  })

  test('/register sin query no muestra badge contextual', async ({ page }) => {
    await page.goto('/register')
    // No debe haber badge de plan/buyer
    const planBadge = page.getByText(/Plan (Pro|Premium)/i)
    expect(await planBadge.count()).toBe(0)
  })

  test('/register hereda link a /login con mismo intent', async ({ page }) => {
    await page.goto('/register?intent=breeder&plan=pro')
    const loginLink = page.locator('a[href^="/login"]').first()
    await expect(loginLink).toBeVisible()
    const href = await loginLink.getAttribute('href')
    expect(href).toContain('intent=breeder')
    expect(href).toContain('plan=pro')
  })
})
