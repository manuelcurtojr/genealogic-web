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
import { Wordmark } from '@/components/ui/wordmark'
import { getTranslator } from '@/lib/i18n'
import LanguageSwitcher from '@/components/ui/language-switcher'

export default function MarketingFooter({ locale = 'es' }: { locale?: string }) {
  const t = getTranslator(locale)
  return (
    <footer className="bg-surface-dark text-on-dark">
      <div className="mx-auto max-w-[1200px] px-6 py-16 lg:px-12">
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
              { label: t('Para propietarios'), href: '/propietarios' },
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
