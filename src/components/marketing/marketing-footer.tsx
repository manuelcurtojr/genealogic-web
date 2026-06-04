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
import { Dog } from 'lucide-react'
import { Wordmark } from '@/components/ui/wordmark'
import { getTranslator } from '@/lib/i18n'
import LanguageSwitcher from '@/components/ui/language-switcher'

// URL de la ficha de la app en la App Store (sin región → redirige a la store de cada país).
const APP_STORE_URL = 'https://apps.apple.com/app/genealogic/id6761951683'

export default function MarketingFooter({ locale = 'es' }: { locale?: string }) {
  const t = getTranslator(locale)
  return (
    <footer className="bg-surface-dark text-on-dark">
      <div className="mx-auto max-w-[1200px] px-6 pt-16 pb-12 lg:px-12">
        {/* ═════ BANDA DESCARGA APP iOS (sin marco, sobre el fondo del footer) ═════ */}
        <div className="relative overflow-hidden">
          <div className="flex flex-col items-center gap-10 lg:flex-row lg:items-center lg:justify-center lg:gap-[50px]">
            {/* iPhone real con la CAPTURA real del login — IZQUIERDA en desktop,
                con un destello/nebulosa naranja detrás. */}
            <div className="relative flex flex-shrink-0 justify-center lg:order-1">
              <div className="pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FE6620]/35 blur-[90px]" />
              <div className="relative w-[200px] sm:w-[220px] rounded-[2.7rem] border-[8px] border-[#1c1c1e] bg-[#1c1c1e] shadow-[0_24px_60px_rgba(0,0,0,0.6)]">
                {/* botones laterales */}
                <div className="absolute -left-[10px] top-[110px] h-12 w-[3px] rounded-l bg-[#0e0e0f]" />
                <div className="absolute -right-[10px] top-[90px] h-16 w-[3px] rounded-r bg-[#0e0e0f]" />
                <div className="overflow-hidden rounded-[2.05rem] bg-white">
                  {/* barra de estado con Dynamic Island */}
                  <div className="relative flex h-6 items-center justify-center bg-white">
                    <div className="h-3.5 w-14 rounded-full bg-black" />
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/mockups/login-iphone.png"
                    alt={t('Pantalla de inicio de sesión de Genealogic en iOS')}
                    width={390}
                    height={844}
                    loading="lazy"
                    className="block w-full"
                  />
                </div>
              </div>
            </div>

            {/* Texto + badge — DERECHA en desktop */}
            <div className="flex max-w-[440px] flex-col items-center text-center lg:order-2 lg:items-start lg:text-left">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                <Dog className="h-3 w-3" />
                {t('App iOS')}
              </span>
              <h2 className="mt-4 max-w-[16ch] text-2xl font-semibold leading-[1.1] tracking-[-0.03em] text-white sm:text-3xl">
                {t('La app de Genealogic, ya en iOS')}
              </h2>
              <p className="mt-3 text-[14px] leading-[1.55] text-on-dark-soft">
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
          </div>
        </div>
      </div>

      {/* Divisor full-bleed: ocupa TODO el ancho de la pantalla */}
      <div className="border-t border-white/10" />

      <div className="mx-auto max-w-[1200px] px-6 pb-16 pt-14 lg:px-12">
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
