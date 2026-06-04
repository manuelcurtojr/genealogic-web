/**
 * MarketingFooter — footer único de TODAS las páginas marketing/públicas.
 *
 * Montado por (public)/layout.tsx, así que aplica a:
 *   /, /criadores, /propietarios, /blog, /pricing, /api-docs
 *   + páginas públicas de perro/criadero (cuando no logueado).
 *
 * Diseño dark con 4 columnas: brand · Producto · Cuenta · Legal.
 * i18n: recibe `locale` (resuelto server-side) y traduce con getTranslator.
 * Incluye el LanguageSwitcher (cliente) para que el anónimo cambie idioma.
 */
import Link from 'next/link'
import { Dog, ShieldCheck, GitBranch } from 'lucide-react'
import { Wordmark } from '@/components/ui/wordmark'
import { getTranslator } from '@/lib/i18n'
import LanguageSwitcher from '@/components/ui/language-switcher'

// URL de la ficha de la app en la App Store (sin región → redirige a la store de cada país).
const APP_STORE_URL = 'https://apps.apple.com/app/genealogic/id6761951683'

export default function MarketingFooter({ locale = 'es' }: { locale?: string }) {
  const t = getTranslator(locale)
  return (
    <footer className="bg-surface-dark text-on-dark">
      <div className="mx-auto max-w-[1200px] px-6 py-16 lg:px-12">
        {/* ═════ BANDA DESCARGA APP iOS ═════ */}
        <div className="mb-12 rounded-2xl bg-surface-dark-elevated border border-white/10 px-6 py-8 sm:px-10 sm:py-10">
          <div className="grid items-center gap-8 lg:grid-cols-[1.2fr_1fr] lg:gap-12">
            {/* Texto + badge */}
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                <Dog className="h-3 w-3" />
                {t('App iOS')}
              </span>
              <h2 className="mt-4 max-w-[16ch] text-2xl font-semibold leading-[1.1] tracking-[-0.03em] text-white sm:text-3xl">
                {t('La app de Genealogic, ya en iOS')}
              </h2>
              <p className="mt-3 max-w-[440px] text-[14px] leading-[1.55] text-on-dark-soft">
                {t('La ficha y la cartilla veterinaria de tu perro en el bolsillo. La genealogía y los recordatorios, contigo siempre — y la cartilla disponible offline cuando el vet la pida.')}
              </p>
              <a
                href={APP_STORE_URL}
                target="_blank"
                rel="noreferrer"
                aria-label={t('Descargar en la App Store')}
                className="mt-6 inline-flex items-center gap-2.5 rounded-xl bg-white px-4 py-2.5 text-black transition hover:opacity-90"
              >
                <AppleLogo className="h-7 w-7" />
                <span className="flex flex-col leading-none text-left">
                  <span className="text-[10px] font-medium">{t('Descárgalo en la')}</span>
                  <span className="text-[19px] font-semibold leading-tight tracking-[-0.01em]">App Store</span>
                </span>
              </a>
            </div>

            {/* Mockup iPhone con mini-ficha */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative w-[210px] rounded-[2.2rem] border-[6px] border-[#2a2a2a] bg-black p-2 shadow-[0_20px_50px_rgba(0,0,0,0.55)]">
                {/* notch */}
                <div className="absolute left-1/2 top-2 h-4 w-20 -translate-x-1/2 rounded-full bg-black" />
                <div className="overflow-hidden rounded-[1.7rem] bg-white">
                  {/* cabecera con foto/placeholder */}
                  <div className="relative aspect-[4/3] bg-gradient-to-br from-blue-100 via-slate-100 to-amber-100">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Dog className="h-14 w-14 text-black/10" />
                    </div>
                    <div className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 shadow-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[9px] font-semibold text-black">{t('Verificado')}</span>
                    </div>
                  </div>
                  {/* datos de la ficha */}
                  <div className="px-3 py-3">
                    <p className="text-[15px] font-bold leading-tight text-black">Luna del Valle</p>
                    <p className="mt-0.5 text-[10.5px] text-zinc-500">Pastor Alemán · 3 años</p>
                    <div className="mt-3 space-y-1.5">
                      <div className="flex items-center gap-2 rounded-lg bg-zinc-100 px-2.5 py-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0 text-emerald-600" />
                        <span className="text-[11px] font-semibold text-black">{t('Vacunas al día')}</span>
                      </div>
                      <div className="flex items-center gap-2 rounded-lg bg-zinc-100 px-2.5 py-1.5">
                        <GitBranch className="h-3.5 w-3.5 flex-shrink-0 text-blue-600" />
                        <span className="text-[11px] font-semibold text-black">{t('Genealogía 5 gen')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-12 border-t border-white/10" />

        <div className="grid gap-10 sm:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Wordmark size="text-2xl" className="!text-white" asLink={false} />
            <p className="mt-3 max-w-[280px] text-[13px] leading-[1.55] text-on-dark-soft">
              {t('El registro público de genealogías caninas. Para criadores serios y propietarios que documentan a sus perros.')}
            </p>
          </div>

          <FooterCol
            title={t('Producto')}
            links={[
              { label: t('Para criadores'), href: '/criadores' },
              { label: t('Para propietarios'), href: '/' },
              { label: t('Precios'), href: '/pricing' },
              { label: t('Buscar perros'), href: '/search' },
              { label: t('Directorio criaderos'), href: '/kennels' },
              { label: t('Blog'), href: '/blog' },
              { label: t('API pública'), href: '/api-docs' },
            ]}
          />

          <FooterCol
            title={t('Cuenta')}
            links={[
              { label: t('Iniciar sesión'), href: '/login' },
              { label: t('Crear cuenta criador'), href: '/register?intent=breeder' },
              { label: t('Crear cuenta propietario'), href: '/register?intent=owner' },
              { label: t('Recuperar contraseña'), href: '/forgot-password' },
              { label: t('Soporte'), href: '/soporte' },
            ]}
          />

          <FooterCol
            title={t('Legal')}
            links={[
              { label: t('Aviso legal'), href: '/legal' },
              { label: t('Términos y condiciones'), href: '/terms' },
              { label: t('Privacidad'), href: '/privacy' },
              { label: t('Cookies'), href: '/cookies' },
              { label: t('Propiedad intelectual'), href: '/ip-policy' },
              { label: t('Reportar contenido'), href: 'mailto:hola@genealogic.io?subject=Reporte%20de%20contenido' },
            ]}
          />
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col gap-4 text-[12px] text-on-dark-soft sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} <strong className="font-medium text-white/90">Manuel Curtó SL</strong> · B56932098 · Tenerife, España</span>
          <div className="flex items-center gap-5">
            <span className="hidden sm:inline">{t('La genealogía de tu perro, donde tiene que estar.')}</span>
            <LanguageSwitcher current={locale} variant="dark" />
          </div>
        </div>
      </div>
    </footer>
  )
}

// Glifo del logo de Apple recreado en SVG (sin imagen externa) para el badge.
function AppleLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 384 512" aria-hidden="true" fill="currentColor" className={className}>
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
  )
}

function FooterCol({
  title,
  links,
}: {
  title: string
  links: { label: string; href: string }[]
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white">{title}</p>
      <ul className="mt-4 space-y-2.5 text-[13.5px] text-on-dark-soft">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="transition hover:text-white">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
