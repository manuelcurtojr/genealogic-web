'use server'

import { revalidatePath } from 'next/cache'
import { createKennelAdminClient } from '@/lib/supabase/server'
import { getMyKennel } from '@/lib/kennel-site'
import { THEMES } from '@/lib/kennel/themes'

const HEX = /^#[0-9a-fA-F]{6}$/

export async function updateKennelTheme(formData: FormData) {
  const kennel = await getMyKennel()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any

  const theme_id = String(formData.get('theme_id') ?? 'classic')
  if (!THEMES.some((t) => t.id === theme_id)) {
    throw new Error('tema_no_valido')
  }

  const overrides: Record<string, string> = {}
  for (const key of ['primary', 'accent', 'canvas', 'ink'] as const) {
    const raw = formData.get(`override_${key}`)
    if (typeof raw === 'string' && raw.trim() && HEX.test(raw.trim())) {
      overrides[key] = raw.trim().toLowerCase()
    }
  }
  const useOverrides = String(formData.get('use_overrides') ?? '') === 'on'

  await admin
    .from('kennels')
    .update({
      theme_id,
      theme_overrides: useOverrides && Object.keys(overrides).length > 0 ? overrides : null,
    })
    .eq('id', kennel.id)

  revalidatePath('/web/general')
  revalidatePath(`/c/${kennel.slug}`)
}
