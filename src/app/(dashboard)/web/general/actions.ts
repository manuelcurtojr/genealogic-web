'use server'

import { revalidatePath } from 'next/cache'
import { createKennelAdminClient } from '@/lib/supabase/server'
import { getMyKennel } from '@/lib/kennel-site'
import { THEMES, BUTTON_RADIUS_PX, DISPLAY_FONT_LABELS, type ButtonRadius, type DisplayFont } from '@/lib/kennel/themes'

const HEX = /^#[0-9a-fA-F]{6}$/
const VALID_RADII = new Set(Object.keys(BUTTON_RADIUS_PX))
const VALID_FONTS = new Set(Object.keys(DISPLAY_FONT_LABELS))

export async function updateKennelTheme(formData: FormData) {
  const kennel = await getMyKennel()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any

  const theme_id = String(formData.get('theme_id') ?? 'classic')
  if (!THEMES.some((t) => t.id === theme_id)) {
    throw new Error('tema_no_valido')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const overrides: Record<string, any> = {}
  for (const key of ['primary', 'accent', 'canvas', 'ink', 'on_primary'] as const) {
    const raw = formData.get(`override_${key}`)
    if (typeof raw === 'string' && raw.trim() && HEX.test(raw.trim())) {
      overrides[key] = raw.trim().toLowerCase()
    }
  }
  const rawRadius = String(formData.get('override_button_radius') ?? '')
  if (VALID_RADII.has(rawRadius)) overrides.button_radius = rawRadius as ButtonRadius
  const rawFont = String(formData.get('override_font_display') ?? '')
  if (VALID_FONTS.has(rawFont)) overrides.font_display = rawFont as DisplayFont

  // Stripe colors (1-3 hex). Solo se persisten los válidos en orden.
  const stripeColors: string[] = []
  for (let i = 0; i < 3; i++) {
    const raw = formData.get(`override_stripe_${i}`)
    if (typeof raw === 'string' && raw.trim() && HEX.test(raw.trim())) {
      stripeColors.push(raw.trim().toLowerCase())
    }
  }
  if (stripeColors.length > 0) overrides.stripe_colors = stripeColors

  const useOverrides = String(formData.get('use_overrides') ?? '') === 'on'

  // Las overrides de tipografía/forma/stripe SIEMPRE se persisten si el
  // usuario las tocó. Solo los 5 colores principales dependen del toggle
  // "Colores personalizados".
  const colorKeys = new Set(['primary', 'accent', 'canvas', 'ink', 'on_primary'])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const persistedOverrides: Record<string, any> = {}
  for (const [k, v] of Object.entries(overrides)) {
    if (colorKeys.has(k)) {
      if (useOverrides) persistedOverrides[k] = v
    } else {
      persistedOverrides[k] = v
    }
  }

  const { error } = await admin
    .from('kennels')
    .update({
      theme_id,
      theme_overrides: Object.keys(persistedOverrides).length > 0 ? persistedOverrides : null,
    })
    .eq('id', kennel.id)

  // Si las columnas aún no existen (migración no aplicada) damos un mensaje claro
  if (error) {
    if (/column.*theme/i.test(error.message)) {
      throw new Error(
        'La migración del sistema de temas aún no está aplicada en Supabase. Ejecuta el SQL de supabase/migrations/20260530_kennel_theme.sql en el SQL Editor.',
      )
    }
    throw new Error(error.message)
  }

  revalidatePath('/web/general')
  revalidatePath(`/c/${kennel.slug}`)
}
