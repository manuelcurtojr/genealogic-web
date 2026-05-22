import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sparkles, Check, ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getPlanLabel } from '@/lib/permissions'

export const metadata = { title: 'Suscripción · Genealogic Pro' }

export default async function SuscripcionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, plan_is_founder, plan_started_at, plan_expires_at')
    .eq('id', user.id)
    .single()

  const plan = (profile as any)?.plan || 'free'
  const isFounder = Boolean((profile as any)?.plan_is_founder)
  const startedAt = (profile as any)?.plan_started_at
  const startedDate = startedAt ? new Date(startedAt) : null

  const proIncluded = [
    'Pipeline de reservas (Kanban con drag&drop)',
    'CRM de clientes con búsqueda',
    'Mini-sitio del criador con custom domain',
    'Biblioteca de conocimiento',
    'Emailbot con tu Biblioteca como contexto',
    'Newsletter (gestión de suscriptores)',
    'Estadísticas del perfil público',
    'Soporte por email',
  ]

  const premiumExtras = [
    'Todo lo del plan Pro',
    'Multi-kennel (varios afijos en una misma cuenta)',
    'API B2B para integraciones',
    '5 verificaciones oficiales /mes incluidas',
    'Featured listing incluido',
    'Soporte prioritario',
  ]

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ink tracking-tight">Suscripción</h1>
        <p className="text-sm text-muted mt-0.5">Gestión de tu plan y próximos pasos.</p>
      </div>

      {/* Current plan card */}
      <div className="rounded-2xl border border-ink bg-canvas p-6 lg:p-8 mb-6 relative overflow-hidden">
        <div className="absolute top-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-ink text-on-primary px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]">
          <Sparkles className="w-3 h-3" />
          Activa
        </div>
        <div className="mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted mb-1">Plan actual</p>
          <div className="flex items-baseline gap-3 flex-wrap">
            <h2 className="text-3xl font-bold text-ink">Genealogic {getPlanLabel(plan)}</h2>
            {isFounder && (
              <span className="inline-flex items-center rounded-full bg-surface-card border border-hairline px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.06em] text-ink">
                Founder · 39€/mes para siempre
              </span>
            )}
          </div>
        </div>

        {startedDate && (
          <p className="text-sm text-body mb-4">
            Activo desde el <strong>{startedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>.
            {isFounder && ' Como Founder mantienes el precio original mientras la cuenta esté activa.'}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mt-6">
          {proIncluded.map(f => (
            <div key={f} className="flex items-start gap-2 text-sm text-body">
              <Check className="w-4 h-4 mt-0.5 text-ink flex-shrink-0" />
              <span>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Billing CTA */}
      <div className="rounded-xl border border-hairline bg-surface-card p-5 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-[260px]">
            <p className="text-sm font-semibold text-ink mb-1">Facturación</p>
            <p className="text-sm text-body">
              Tu facturación con Stripe llega en la próxima fase: ahí verás historial de pagos,
              método de pago y datos fiscales. Por ahora, si necesitas algo factúrame escríbeme a{' '}
              <a href="mailto:hola@genealogic.io" className="text-ink underline">hola@genealogic.io</a>.
            </p>
          </div>
          <Button variant="secondary" size="sm" href="/cuenta/facturacion">
            Facturación
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Premium upsell */}
      {plan !== 'premium' && (
        <div className="rounded-2xl border border-hairline bg-canvas p-6 lg:p-8">
          <div className="flex items-baseline gap-3 mb-1 flex-wrap">
            <h3 className="text-lg font-bold text-ink">Genealogic Premium</h3>
            <span className="text-xl font-bold text-ink">149€<span className="text-sm text-muted font-normal">/mes</span></span>
          </div>
          <p className="text-sm text-body mb-5">
            Para criaderos grandes, multi-afijo, con necesidad de API y verificaciones oficiales mensuales.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mb-6">
            {premiumExtras.map(f => (
              <div key={f} className="flex items-start gap-2 text-sm text-body">
                <Check className="w-4 h-4 mt-0.5 text-ink flex-shrink-0" />
                <span>{f}</span>
              </div>
            ))}
          </div>
          <Button
            variant="primary" size="md"
            href="mailto:hola@genealogic.io?subject=Upgrade%20a%20Premium"
          >
            Hablar con nosotros para Premium
            <ArrowUpRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
