'use client'

/**
 * NotificationsSection — preferencias de email del usuario.
 *
 * IMPORTANTE: la fuente de verdad real es la tabla `email_preferences`. El
 * sender (lib/email/send.ts) lee email_preferences[category] y hace skip si
 * está en false. Los antiguos toggles de profiles.notif_* NO los miraba nadie
 * del sistema de correo (solo el panel admin), así que estaban muertos: por eso
 * aquí escribimos directamente en email_preferences.
 *
 * RLS `email_prefs_own` permite al propio usuario leer + upsert su fila, así que
 * lo hacemos desde el cliente sin pasar por una API.
 *
 * Save-on-toggle: cada cambio actualiza el estado local de inmediato (optimista)
 * y dispara un upsert. Es resiliente: si el upsert falla, revierte el toggle y
 * no rompe la página.
 */

import { useEffect, useState } from 'react'
import ToggleSwitch from '@/components/ui/toggle'
import { createClient } from '@/lib/supabase/client'
import {
  Loader2, CalendarHeart, MessageSquare, Stethoscope, CalendarClock, Sparkles,
} from 'lucide-react'

type Prefs = {
  reservations: boolean
  messages: boolean
  vet_reminders: boolean
  weekly_digest: boolean
  marketing: boolean
}

const DEFAULT_PREFS: Prefs = {
  reservations: true,
  messages: true,
  vet_reminders: true,
  weekly_digest: true,
  marketing: true,
}

export default function NotificationsSection({ t }: { t: (k: string) => string }) {
  const [userId, setUserId] = useState<string | null>(null)
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS)
  const [loading, setLoading] = useState(true)
  // Qué fila está guardándose ahora mismo (para mostrar un mini-spinner).
  const [savingKey, setSavingKey] = useState<keyof Prefs | null>(null)

  useEffect(() => {
    let active = true
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { if (active) setLoading(false); return }
      if (active) setUserId(user.id)
      const { data } = await supabase
        .from('email_preferences')
        .select('reservations, messages, vet_reminders, weekly_digest, marketing')
        .eq('user_id', user.id)
        .maybeSingle()
      if (!active) return
      // Si no hay fila todavía, el default del sistema es "todo activado".
      setPrefs(data ? { ...DEFAULT_PREFS, ...data } : DEFAULT_PREFS)
      setLoading(false)
    }
    load()
    return () => { active = false }
  }, [])

  async function toggle(key: keyof Prefs, value: boolean) {
    if (!userId) return
    const prev = prefs
    const next = { ...prefs, [key]: value }
    // Optimista: pintamos el cambio ya.
    setPrefs(next)
    setSavingKey(key)
    const supabase = createClient()
    const { error } = await supabase
      .from('email_preferences')
      .upsert(
        {
          user_id: userId,
          reservations: next.reservations,
          messages: next.messages,
          vet_reminders: next.vet_reminders,
          weekly_digest: next.weekly_digest,
          marketing: next.marketing,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      )
    setSavingKey(null)
    // Si falla, revertimos sin romper nada.
    if (error) setPrefs(prev)
  }

  const rows: { key: keyof Prefs; icon: React.ElementType; label: string; desc: string }[] = [
    {
      key: 'reservations',
      icon: CalendarHeart,
      label: t('Reservas y camadas'),
      desc: t('Nuevas solicitudes de reserva, camadas registradas y cambios de estado.'),
    },
    {
      key: 'messages',
      icon: MessageSquare,
      label: t('Mensajes'),
      desc: t('Cuando recibes un mensaje nuevo en una conversación de reserva.'),
    },
    {
      key: 'vet_reminders',
      icon: Stethoscope,
      label: t('Recordatorios veterinarios'),
      desc: t('Vacunas, desparasitaciones, citas y avisos de celo y parto.'),
    },
    {
      key: 'weekly_digest',
      icon: CalendarClock,
      label: t('Resumen semanal'),
      desc: t('Un correo semanal con el resumen de tu actividad.'),
    },
    {
      key: 'marketing',
      icon: Sparkles,
      label: t('Novedades y consejos'),
      desc: t('Mejoras del producto, consejos de cría y novedades. Sin spam.'),
    },
  ]

  if (loading) {
    return (
      <div className="rounded-2xl border border-hairline bg-canvas p-5 sm:p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-hairline bg-canvas p-2 sm:p-2.5">
        <div className="divide-y divide-hairline">
          {rows.map(({ key, icon: Icon, label, desc }) => (
            <div key={key} className="flex items-center justify-between gap-4 px-3 py-3.5 sm:px-4">
              <div className="flex min-w-0 items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[color:var(--brand-soft)] text-[color:var(--brand)]">
                  <Icon className="h-[18px] w-[18px]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-medium text-ink">{label}</p>
                  <p className="mt-0.5 text-[12.5px] leading-snug text-muted">{desc}</p>
                </div>
              </div>
              <div className="flex flex-shrink-0 items-center gap-2">
                {savingKey === key && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted" />}
                <ToggleSwitch
                  value={prefs[key]}
                  onChange={(v) => toggle(key, v)}
                  color="bg-[color:var(--brand)]"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="px-1 text-[12px] leading-snug text-muted">
        {t('Los correos esenciales (seguridad, contratos, pagos y tu cuenta) se envían siempre.')}
      </p>
    </div>
  )
}
