/**
 * OwnersLanding — landing dedicada a propietarios.
 *
 * Mensaje principal: tu perro tiene una ficha digital seria y privada.
 * Sub-mensajes:
 *   - Genealogía real y verificable
 *   - Papeles del cachorro siempre a mano
 *   - Calendario vet con recordatorios
 *   - Vincular con tu criador (si vino de uno en la plataforma)
 *   - Reclamar tu perro si lo encuentras en el catálogo
 *
 * Stack visual: igual que /criadores pero con paleta azul (#3b82f6) en
 * lugar de naranja (#FE6620). Tono más cálido, menos "business".
 */
'use client'

import Link from 'next/link'
import {
  ArrowRight, Dog, Camera, GitBranch, Calendar, Stethoscope,
  ShieldCheck, Heart, FileText, Search, CheckCircle2, Smartphone,
} from 'lucide-react'
import { useT } from '@/components/i18n/locale-provider'

export default function OwnersLanding() {
  const t = useT()
  return (
    <main className="bg-canvas">
      {/* ═════ HERO ═════ */}
      <section className="border-b border-hairline">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-6 lg:px-12 py-12 sm:py-20 lg:py-24">
          <div className="grid lg:grid-cols-[1.1fr_1fr] gap-8 lg:gap-12 items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-900">
                <Dog className="w-3 h-3" />
                {t('Para propietarios')}
              </span>
              <h1
                className="mt-4 sm:mt-5 max-w-[20ch] sm:max-w-[15ch] font-semibold text-ink"
                style={{ fontSize: 'clamp(28px, 6vw, 64px)', lineHeight: 1.04, letterSpacing: '-0.04em' }}
              >
                {t('Tu perro merece su historia bien contada.')}
              </h1>
              <p
                className="mt-4 sm:mt-5 max-w-[480px] text-body"
                style={{ fontSize: 'clamp(15px, 1.5vw, 19px)', lineHeight: 1.55 }}
              >
                {t('Genealogic guarda la genealogía, los papeles, las vacunas y la galería de tu perro en un solo sitio. Privado por defecto. Gratis para siempre.')}
              </p>
              <div className="mt-6 sm:mt-7 flex flex-col sm:flex-row gap-2.5">
                <Link
                  href="/register?intent=owner"
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-ink text-on-primary px-5 sm:px-6 py-3 text-sm font-bold hover:opacity-90 transition"
                >
                  {t('Crear mi cuenta gratis')}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/search"
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-hairline bg-canvas px-5 sm:px-6 py-3 text-sm font-bold text-body hover:text-ink hover:border-ink/30 transition"
                >
                  <Search className="w-4 h-4" />
                  {t('Buscar a mi perro')}
                </Link>
              </div>
              <p className="mt-3 text-[11px] uppercase tracking-wider font-bold text-emerald-700">
                {t('Sin tarjeta · Sin límites de perros')}
              </p>
            </div>

            {/* Mock visual: ficha de perro */}
            <div className="relative">
              <div className="rounded-2xl sm:rounded-3xl border-2 border-hairline bg-canvas shadow-[0_8px_32px_rgba(0,0,0,0.08)] overflow-hidden max-w-md mx-auto lg:mx-0">
                <div className="aspect-[4/3] bg-gradient-to-br from-blue-50 via-surface-card to-amber-50 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Dog className="w-20 h-20 sm:w-24 sm:h-24 text-ink/10" />
                  </div>
                  <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex items-center gap-1.5 rounded-full bg-canvas/95 backdrop-blur px-2.5 py-1 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[11px] font-semibold text-ink">Verificado</span>
                  </div>
                </div>
                <div className="p-4 sm:p-5">
                  <p className="text-[18px] sm:text-[20px] font-bold text-ink">Luna del Valle</p>
                  <p className="text-[12.5px] sm:text-[13px] text-muted mt-0.5">Hembra · Pastor Alemán · 3 años</p>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-surface-card p-2 sm:p-2.5">
                      <p className="text-[10px] uppercase tracking-wider text-muted font-bold">Genealogía</p>
                      <p className="mt-1 text-sm font-bold text-ink">5 gen</p>
                    </div>
                    <div className="rounded-lg bg-surface-card p-2 sm:p-2.5">
                      <p className="text-[10px] uppercase tracking-wider text-muted font-bold">Papeles</p>
                      <p className="mt-1 text-sm font-bold text-ink">7</p>
                    </div>
                    <div className="rounded-lg bg-surface-card p-2 sm:p-2.5">
                      <p className="text-[10px] uppercase tracking-wider text-muted font-bold">Vacunas</p>
                      <p className="mt-1 text-sm font-bold text-ink">Al día</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═════ POR QUÉ ═════ */}
      <section className="border-b border-hairline bg-surface-soft/40">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-6 lg:px-12 py-12 sm:py-20">
          <div className="max-w-2xl mb-8 sm:mb-10">
            <p className="text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.1em] sm:tracking-[0.12em] text-muted">{t('Qué te ofrecemos')}</p>
            <h2 className="mt-2 font-semibold tracking-[-0.04em] text-ink" style={{ fontSize: 'clamp(22px, 4vw, 36px)', lineHeight: 1.05 }}>
              {t('Todo sobre tu perro, en un solo sitio que sí es tuyo.')}
            </h2>
            <p className="mt-3 sm:mt-4 text-body text-[14px] sm:text-[16px]">
              {t('Sin anuncios, sin vender tus datos. Tu información es tuya — puedes exportarla o borrarla cuando quieras.')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <Feature
              icon={Camera}
              title={t('Ficha completa con galería')}
              desc={t('Fotos, datos físicos, microchip, color, peso, altura. La cartilla de identidad digital de tu perro.')}
            />
            <Feature
              icon={GitBranch}
              title={t('Genealogía y árbol genealógico')}
              desc={t('Genealogía completa sin límite de generaciones, ancestros con foto y enlace al criadero original. Investiga la sangre real de tu perro.')}
            />
            <Feature
              icon={FileText}
              title={t('Papeles digitalizados')}
              desc={t('Cartilla sanitaria, contrato de venta, certificado de genealogía, microchip. Todo escaneado y a mano.')}
            />
            <Feature
              icon={Calendar}
              title={t('Calendario veterinario')}
              desc={t('Recordatorios automáticos de vacunas, desparasitaciones y revisiones. Te avisamos antes de que se te pase.')}
            />
            <Feature
              icon={Stethoscope}
              title={t('Historial clínico')}
              desc={t('Cada visita al vet, cada tratamiento, cada análisis registrado y buscable. Para ti y para futuros vets.')}
            />
            <Feature
              icon={Heart}
              title={t('Vincula a tu criador')}
              desc={t('Si compraste a tu perro en un criadero de Genealogic, la genealogía se actualiza automáticamente.')}
            />
          </div>
        </div>
      </section>

      {/* ═════ RECLAMAR ═════ */}
      <section className="border-b border-hairline">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-6 lg:px-12 py-12 sm:py-20">
          <div className="grid lg:grid-cols-[1fr_1.1fr] gap-8 lg:gap-12 items-center">
            <div className="rounded-2xl sm:rounded-3xl border-2 border-hairline bg-surface-soft p-6 sm:p-8 lg:p-10">
              <ShieldCheck className="w-9 h-9 sm:w-10 sm:h-10 text-ink mb-4" />
              <p className="text-[14px] font-semibold text-ink mb-3">{t('¿Es tuyo este perro?')}</p>
              <div className="rounded-xl border-2 border-dashed border-ink/20 bg-canvas px-3 sm:px-4 py-3.5 flex items-center gap-2.5 sm:gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-ink/10 flex items-center justify-center flex-shrink-0">
                  <Dog className="w-5 h-5 text-ink" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-ink truncate">Rocky de los Pirineos</p>
                  <p className="text-[11px] text-muted truncate">Importado desde club nacional · Sin propietario</p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-lg bg-ink text-on-primary px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-bold flex-shrink-0">
                  <span className="hidden sm:inline">Reclamar</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>

            <div>
              <p className="text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.1em] sm:tracking-[0.12em] text-muted">{t('Catálogo público')}</p>
              <h2 className="mt-2 font-semibold tracking-[-0.04em] text-ink" style={{ fontSize: 'clamp(22px, 4vw, 36px)', lineHeight: 1.05 }}>
                {t('¿Tu perro ya está aquí?')}
              </h2>
              <p className="mt-3 sm:mt-4 text-body text-[14px] sm:text-[16px] leading-[1.55]">
                {t('Genealogic tiene importados miles de perros de genealogías, clubes de raza y federaciones. Es posible que el tuyo ya tenga un perfil esperando dueño.')}
              </p>
              <ul className="mt-5 sm:mt-6 space-y-2.5 text-[13.5px] sm:text-[14.5px]">
                <Check>{t('Búscalo por nombre, microchip o afijo.')}</Check>
                <Check>{t('Pulsa "Reclamar" y sube tus papeles (genealogía, cartilla, contrato).')}</Check>
                <Check>{t('Un humano revisa en menos de 72h y te transfiere la titularidad.')}</Check>
              </ul>
              <Link
                href="/search"
                className="mt-6 sm:mt-7 inline-flex items-center gap-1.5 rounded-xl bg-ink text-on-primary px-5 sm:px-6 py-3 text-sm font-bold hover:opacity-90 transition"
              >
                <Search className="w-4 h-4" />
                {t('Buscar a mi perro')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═════ APP MÓVIL ═════ */}
      <section className="border-b border-hairline bg-surface-soft/40">
        <div className="mx-auto max-w-3xl px-5 sm:px-6 lg:px-12 py-12 sm:py-20 text-center">
          <Smartphone className="w-7 h-7 sm:w-8 sm:h-8 mx-auto mb-4 text-ink" />
          <h2 className="font-semibold tracking-[-0.04em] text-ink mx-auto" style={{ fontSize: 'clamp(22px, 4vw, 36px)', lineHeight: 1.05, maxWidth: '20ch' }}>
            {t('Tu perro contigo siempre.')}
          </h2>
          <p className="mt-3 sm:mt-4 text-body text-[14px] sm:text-[16px] leading-[1.55] max-w-xl mx-auto">
            {t('Próximamente en iOS y Android. La cartilla sanitaria de tu perro disponible offline cuando el vet la pida.')}
          </p>
        </div>
      </section>

      {/* ═════ FINAL CTA ═════ */}
      <section className="bg-ink text-on-primary">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-6 lg:px-12 py-14 sm:py-24 text-center">
          <h2 className="font-semibold tracking-[-0.04em] max-w-[18ch] mx-auto leading-[1.1]" style={{ fontSize: 'clamp(26px, 5vw, 44px)' }}>
            {t('Tu perro empieza a tener historia desde hoy.')}
          </h2>
          <p className="mt-3 sm:mt-4 text-[14px] sm:text-[16px] text-white/70 max-w-md mx-auto">
            {t('Crea tu cuenta en 30 segundos. Gratis para siempre.')}
          </p>
          <Link
            href="/register?intent=owner"
            className="mt-7 sm:mt-8 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#FE6620] text-white px-5 sm:px-6 py-3 text-sm font-bold hover:opacity-90 transition"
          >
            {t('Crear mi cuenta')}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer global lo aporta (public)/layout.tsx. */}
    </main>
  )
}

function Feature({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-hairline bg-canvas p-6">
      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
        <Icon className="w-5 h-5 text-blue-700" />
      </div>
      <h3 className="text-[16px] font-bold text-ink">{title}</h3>
      <p className="mt-1.5 text-[13.5px] text-body leading-[1.55]">{desc}</p>
    </div>
  )
}

function Check({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-body">
      <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-600 flex-shrink-0" />
      <span>{children}</span>
    </li>
  )
}
