/**
 * /kennel/legal — datos legales del criadero.
 *
 * Accesible a CUALQUIER dueño de kennel.
 * Su finalidad principal es alimentar los contratos de reserva / entrega
 * con razón social, CIF, domicilio, representante, etc. — sin esto los
 * contratos se generan con huecos en blanco.
 */
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import KennelLegalDataForm from '@/components/kennel/kennel-legal-data-form'
import { getTranslator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Datos legales · Genealogic' }

export default async function KennelLegalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: kennel } = await supabase
    .from('kennels')
    .select('id, slug, name, owner_id, legal_name, legal_id, legal_address, legal_email, legal_representative, legal_representative_id, sign_city, jurisdiction')
    .eq('owner_id', user.id)
    .maybeSingle()
  if (!kennel) redirect('/kennel/new')

  const t = getTranslator(await getLocale())

  // Cuántos campos están rellenos — barra de progreso visual arriba
  const requiredFields = [
    kennel.legal_name, kennel.legal_id, kennel.legal_address, kennel.legal_representative,
  ]
  const allFields = [
    ...requiredFields,
    kennel.legal_representative_id, kennel.sign_city, kennel.jurisdiction, kennel.legal_email,
  ]
  const requiredFilled = requiredFields.filter(Boolean).length
  const allFilled = allFields.filter(Boolean).length
  const isCompleteForContracts = requiredFilled === requiredFields.length

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12 space-y-7">
      <div>
        <Link
          href="/kennel"
          className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-muted hover:text-ink transition mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> {t('Mi criadero')}
        </Link>
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
          {t('Mi criadero')}
        </p>
        <h1 className="mt-1 text-[28px] sm:text-[32px] font-semibold tracking-[-0.03em] text-ink leading-tight">
          {t('Datos legales')}
        </h1>
        <p className="mt-2 text-[14.5px] text-body leading-snug max-w-prose">
          {t('Estos datos rellenan automáticamente tus contratos de reserva y compraventa. Sin ellos los contratos salen con huecos en blanco y no son válidos para firmar con clientes.')}
        </p>
      </div>

      {/* Tarjeta de estado */}
      <div className={`rounded-2xl border p-5 flex items-start gap-4 ${
        isCompleteForContracts
          ? 'border-emerald-200 bg-emerald-50/60'
          : 'border-amber-300 bg-amber-50'
      }`}>
        <div className={`flex-shrink-0 flex items-center justify-center h-11 w-11 rounded-full ${
          isCompleteForContracts ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
        }`}>
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-[14.5px] ${
            isCompleteForContracts ? 'text-emerald-900' : 'text-amber-900'
          }`}>
            {isCompleteForContracts
              ? t('Listo para generar contratos')
              : t('Faltan datos obligatorios')}
          </p>
          <p className={`mt-0.5 text-[12.5px] ${
            isCompleteForContracts ? 'text-emerald-800' : 'text-amber-800'
          }`}>
            {requiredFilled}/{requiredFields.length} {t('campos obligatorios')} ·{' '}
            {allFilled}/{allFields.length} {t('campos totales')}
          </p>
        </div>
      </div>

      <KennelLegalDataForm
        kennelId={kennel.id}
        legal={{
          legal_name: kennel.legal_name,
          legal_id: kennel.legal_id,
          legal_address: kennel.legal_address,
          legal_email: kennel.legal_email,
          legal_representative: kennel.legal_representative,
          legal_representative_id: kennel.legal_representative_id,
          sign_city: kennel.sign_city,
          jurisdiction: kennel.jurisdiction,
        }}
      />

    </div>
  )
}
