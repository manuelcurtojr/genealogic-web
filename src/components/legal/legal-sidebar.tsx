'use client'

/**
 * LegalSidebar — menú lateral persistente para las páginas legales.
 *
 * Mismo estilo visual que el sidebar del dashboard (tokens de color,
 * tipografía y micro-interacciones) pero simplificado: no depende de
 * sesión/permisos porque el área legal es pública.
 *
 * Para añadir una nueva política: añadir item al array LEGAL_PAGES.
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ScrollText, FileText, ShieldCheck, Cookie, Copyright, Flag, Mail,
} from 'lucide-react'
import { useT } from '@/components/i18n/locale-provider'

export const LEGAL_PAGES = [
  {
    href: '/legal',
    label: 'Aviso legal',
    desc: 'Datos del titular (LSSI)',
    icon: ScrollText,
  },
  {
    href: '/terms',
    label: 'Términos y condiciones',
    desc: 'Condiciones del servicio',
    icon: FileText,
  },
  {
    href: '/privacy',
    label: 'Privacidad',
    desc: 'Tratamiento de datos (RGPD)',
    icon: ShieldCheck,
  },
  {
    href: '/cookies',
    label: 'Cookies',
    desc: 'Tecnologías utilizadas',
    icon: Cookie,
  },
  {
    href: '/ip-policy',
    label: 'Propiedad intelectual',
    desc: 'Notice-and-action',
    icon: Copyright,
  },
] as const

export default function LegalSidebar() {
  const t = useT()
  const pathname = usePathname() || ''

  return (
    <nav aria-label={t('Documentación legal')} className="lg:sticky lg:top-8 space-y-6">
      {/* Encabezado del menú */}
      <div className="px-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
          {t('Documentación')}
        </p>
        <h2 className="mt-1 text-[18px] font-semibold tracking-[-0.02em] text-ink">
          {t('Legal y privacidad')}
        </h2>
        <p className="mt-1 text-[12px] leading-snug text-muted">
          {t('Toda la información jurídica de Genealogic en un solo sitio.')}
        </p>
      </div>

      {/* Lista de políticas */}
      <ul className="space-y-1">
        {LEGAL_PAGES.map((p) => {
          const active = pathname === p.href
          const Icon = p.icon
          return (
            <li key={p.href}>
              <Link
                href={p.href}
                aria-current={active ? 'page' : undefined}
                className={`group relative flex items-start gap-3 rounded-xl px-3 py-2.5 transition-all ${
                  active
                    ? 'bg-ink text-on-primary shadow-[0_1px_2px_rgba(0,0,0,0.08)]'
                    : 'text-body hover:bg-surface-soft hover:text-ink'
                }`}
              >
                {/* Indicador lateral cuando activo */}
                {active && (
                  <span
                    aria-hidden
                    className="absolute -left-3 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-ink"
                  />
                )}
                <Icon
                  className={`mt-0.5 h-4 w-4 flex-shrink-0 transition-transform group-hover:scale-110 ${
                    active ? 'text-on-primary' : 'text-muted group-hover:text-ink'
                  }`}
                />
                <div className="min-w-0">
                  <p
                    className={`text-[13.5px] font-medium leading-tight ${
                      active ? 'text-on-primary' : 'text-ink'
                    }`}
                  >
                    {t(p.label)}
                  </p>
                  <p
                    className={`mt-0.5 text-[11px] leading-tight ${
                      active ? 'text-on-primary/75' : 'text-muted'
                    }`}
                  >
                    {t(p.desc)}
                  </p>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>

      {/* CTA contacto + reportar */}
      <div className="mx-3 rounded-xl border border-hairline bg-surface-soft/60 p-4">
        <div className="flex items-center gap-2">
          <Mail className="h-3.5 w-3.5 text-muted" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
            {t('¿Algo que reportar?')}
          </p>
        </div>
        <p className="mt-2 text-[12px] leading-snug text-body">
          {t('Si has detectado contenido infractor o quieres ejercer un derecho RGPD, escríbenos. Respondemos en menos de 72 horas.')}
        </p>
        <a
          href="mailto:hola@genealogic.io?subject=Reporte%20de%20contenido"
          className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-medium text-ink underline-offset-4 hover:underline"
        >
          <Flag className="h-3 w-3" />
          hola@genealogic.io
        </a>
      </div>
    </nav>
  )
}
