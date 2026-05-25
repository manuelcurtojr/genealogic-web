/**
 * MarketingFooter — footer único de TODAS las páginas marketing/públicas.
 *
 * Montado por (public)/layout.tsx, así que aplica a:
 *   /, /criadores, /propietarios, /blog, /pricing, /api-docs
 *   + páginas públicas de perro/criadero (cuando no logueado).
 *
 * Diseño dark con 4 columnas: brand · Producto · Cuenta · Legal.
 */
import Link from 'next/link'
import { Wordmark } from '@/components/ui/wordmark'

export default function MarketingFooter() {
  return (
    <footer className="bg-surface-dark text-on-dark">
      <div className="mx-auto max-w-[1200px] px-6 py-16 lg:px-12">
        <div className="grid gap-10 sm:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Wordmark size="text-2xl" className="!text-white" asLink={false} />
            <p className="mt-3 max-w-[280px] text-[13px] leading-[1.55] text-on-dark-soft">
              El registro público de genealogías caninas. Para criadores serios y propietarios que documentan a sus perros.
            </p>
          </div>

          <FooterCol
            title="Producto"
            links={[
              { label: 'Para criadores', href: '/criadores' },
              { label: 'Para propietarios', href: '/propietarios' },
              { label: 'Precios', href: '/pricing' },
              { label: 'Buscar perros', href: '/search' },
              { label: 'Directorio criaderos', href: '/kennels' },
              { label: 'API pública', href: '/api-docs' },
            ]}
          />

          <FooterCol
            title="Cuenta"
            links={[
              { label: 'Iniciar sesión', href: '/login' },
              { label: 'Crear cuenta criador', href: '/register?intent=breeder' },
              { label: 'Crear cuenta propietario', href: '/register?intent=owner' },
              { label: 'Recuperar contraseña', href: '/forgot-password' },
              { label: 'Soporte', href: '/soporte' },
            ]}
          />

          <FooterCol
            title="Recursos"
            links={[
              { label: 'Blog', href: '/blog' },
              { label: 'Términos', href: '/terms' },
              { label: 'Privacidad', href: '/privacy' },
              { label: 'Cookies', href: '/legal' },
              { label: 'Contacto', href: 'mailto:hola@genealogic.io' },
            ]}
          />
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-white/10 pt-6 text-[12px] text-on-dark-soft sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Genealogic · Hecho en España</span>
          <span>El pedigree de tu perro, donde tiene que estar.</span>
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
