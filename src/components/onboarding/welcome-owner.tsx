/**
 * Pantalla welcome cuando el user eligió "Soy propietario".
 *
 * No empuja a crear kennel — empuja a registrar el primer perro.
 * Si tiene reservas vinculadas (vino con email matcheable), prioriza
 * el CTA a "Mis reservas".
 *
 * Permite cambiar a "Soy criador" si se equivocó al elegir.
 */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Dog, Calendar, FileText, Stethoscope, ArrowRight, Sparkles, RefreshCw, Store } from 'lucide-react'
import { useT } from '@/components/i18n/locale-provider'

export default function WelcomeOwner({
  displayName,
  hasReservations,
}: {
  displayName: string | null
  hasReservations: boolean
}) {
  const t = useT()
  const router = useRouter()
  const [showSwitch, setShowSwitch] = useState(false)
  const [navigating, setNavigating] = useState(false)

  return (
    <div className="max-w-3xl mx-auto py-8">
      {/* Hero */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-ink mb-5">
          <Dog className="w-7 h-7 text-on-primary" />
        </div>
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">
          {t('Bienvenido a Genealogic')}
        </p>
        <h1 className="mt-3 text-3xl sm:text-4xl font-bold text-ink tracking-tight">
          {t('Hola')}{displayName ? `, ${displayName}` : ''}.
        </h1>
        <p className="mt-3 text-body text-base max-w-xl mx-auto">
          {t('Genealogic guarda la genealogía y la historia de tus perros. Vincúlate con los criaderos donde los compraste y centraliza papeles, vacunas y reservas.')}
        </p>
      </div>

      {/* Caso A: tiene reservas — empujarlas a "Mis reservas" */}
      {hasReservations && (
        <div className="rounded-2xl border-2 border-ink bg-canvas p-6 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <Sparkles className="w-5 h-5 text-ink" />
            <h2 className="text-xl font-bold text-ink">{t('Tienes reservas vinculadas')}</h2>
          </div>
          <p className="text-sm text-body mb-5">
            {t('Hemos detectado reservas en criaderos con tu email. Revisa el estado, mensajes y papeles desde tu panel de propietario.')}
          </p>
          <Link
            href="/mis-reservas"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-ink text-on-primary px-6 py-3 text-sm font-bold hover:opacity-90"
          >
            {t('Ver mis reservas')}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* CTA principal: añadir primer perro */}
      <div className="rounded-2xl border border-hairline bg-canvas p-6 mb-4">
        <div className="flex items-center gap-3 mb-3">
          <Dog className="w-5 h-5 text-ink" />
          <h2 className="text-xl font-bold text-ink">
            {hasReservations ? t('Registra también tus perros') : t('Empieza añadiendo tu primer perro')}
          </h2>
        </div>
        <p className="text-sm text-body mb-5">
          {t('Sube fotos, datos básicos y enlaza con padres registrados en Genealogic. La genealogía se completa sola para perros con genealogía conocida.')}
        </p>

        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <BenefitItem icon={Dog} title={t('Ficha completa')}>
            {t('Foto, raza, color, fecha de nacimiento, microchip, registro.')}
          </BenefitItem>
          <BenefitItem icon={FileText} title={t('Papeles del perro')}>
            {t('Cartilla sanitaria, vacunas, contrato, genealogía — todo guardado.')}
          </BenefitItem>
          <BenefitItem icon={Calendar} title={t('Calendario')}>
            {t('Vacunas, desparasitaciones, citas vet. Recordatorios automáticos.')}
          </BenefitItem>
          <BenefitItem icon={Stethoscope} title={t('Historia clínica')}>
            {t('Visitas vet con notas y archivos adjuntos.')}
          </BenefitItem>
        </ul>

        <Link
          href="/dogs/new"
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-ink text-on-primary px-6 py-3 text-sm font-bold hover:opacity-90"
        >
          {t('Añadir mi primer perro')}
          <ArrowRight className="w-4 h-4" />
        </Link>
        <p className="text-[11px] text-muted text-center mt-3">
          {t('Gratis para siempre. Sin tarjeta, sin límite de perros.')}
        </p>
      </div>

      {/* Soft links */}
      <div className="flex items-center justify-center gap-6 text-xs text-muted">
        <Link href="/kennels" className="hover:text-ink">
          {t('Explorar criaderos →')}
        </Link>
        <Link href="/search" className="hover:text-ink">
          {t('Buscar perros →')}
        </Link>
        <a href="mailto:hola@genealogic.io" className="hover:text-ink">
          {t('Pedir ayuda →')}
        </a>
      </div>

      {/* Cambio de rol */}
      <p className="mt-8 text-center text-[12px] text-muted">
        {t('¿Me equivoqué — soy criador?')}{' '}
        <button
          onClick={() => setShowSwitch(true)}
          className="text-ink underline hover:opacity-80 inline-flex items-center gap-1"
        >
          {t('Cambiar a perfil de criador')}
        </button>
      </p>

      {/* Modal en la web (no confirm del navegador) para pasar a criador.
          OJO: no cambiamos el rol aquí — solo llevamos al formulario de crear
          criadero. El rol pasa a 'breeder' cuando el criadero se crea de verdad. */}
      {showSwitch && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
          onClick={() => setShowSwitch(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-canvas p-6 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.4)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink/10">
                <Store className="h-5 w-5 text-ink" />
              </div>
              <h3 className="text-lg font-bold text-ink">{t('Cambiar a perfil de criador')}</h3>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-body">
              {t('Vas a convertir tu cuenta de propietario en una de CRIADERO. Es un tipo de perfil distinto: tendrás afijo, camadas, reservas y el panel de criador en lugar del de propietario.')}
            </p>
            <p className="mt-3 rounded-lg border border-hairline bg-surface-soft px-3 py-2.5 text-[13px] leading-relaxed text-body">
              {t('No cambiamos tu perfil todavía: sigues siendo propietario hasta que CREES tu criadero. Al continuar te llevamos al formulario para crearlo.')}
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowSwitch(false)}
                className="rounded-lg border border-hairline px-4 py-2 text-sm font-medium text-body transition hover:bg-surface-soft"
              >
                {t('Cancelar')}
              </button>
              <button
                onClick={() => { setNavigating(true); router.push('/kennel/new') }}
                disabled={navigating}
                className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-bold text-on-primary transition hover:opacity-90 disabled:opacity-50"
              >
                {navigating && <RefreshCw className="h-4 w-4 animate-spin" />}
                {t('Crear mi criadero')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function BenefitItem({
  icon: Icon, title, children,
}: { icon: typeof Dog; title: string; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-surface-card flex items-center justify-center">
        <Icon className="w-4 h-4 text-ink" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="text-xs text-muted mt-0.5 leading-snug">{children}</p>
      </div>
    </li>
  )
}
