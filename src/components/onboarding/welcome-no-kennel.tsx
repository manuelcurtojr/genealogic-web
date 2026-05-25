/**
 * Pantalla de bienvenida para usuarios sin kennel todavía.
 *
 * Reemplaza el dashboard "frío" (con todo a 0) por una pantalla clara
 * que explica qué es Genealogic, qué van a hacer aquí, y un solo CTA
 * gigante: "Crear mi criadero".
 *
 * Si el user es un PROPIETARIO puro (recibió perro como cliente, no
 * criador), también le ofrece ir a /mis-perros — la duda del setup ahí
 * no aplica.
 */
import Link from 'next/link'
import { Store, Dog, Globe, Mail, BarChart3, ArrowRight, Sparkles } from 'lucide-react'

export default function WelcomeNoKennel({
  displayName,
  isClient,
}: {
  displayName: string | null
  isClient: boolean
}) {
  return (
    <div className="max-w-3xl mx-auto py-8">
      {/* Hero */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-ink mb-5">
          <Sparkles className="w-7 h-7 text-on-primary" />
        </div>
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">
          Bienvenido a Genealogic
        </p>
        <h1 className="mt-3 text-3xl sm:text-4xl font-bold text-ink tracking-tight">
          Hola{displayName ? `, ${displayName}` : ''}.
        </h1>
        <p className="mt-3 text-body text-base max-w-xl mx-auto">
          Genealogic es la plataforma para criadores serios de perros de raza.
          Pedigree, web pública, gestión de clientes, emailbot — todo en un sitio.
        </p>
      </div>

      {/* Caso A: tiene reservas/perros como cliente → ofrecer Mis perros */}
      {isClient && (
        <div className="rounded-2xl border border-hairline bg-canvas p-5 mb-6">
          <p className="text-sm font-semibold text-ink mb-1">¿Vienes a ver el perro que reservaste?</p>
          <p className="text-xs text-body mb-4">
            Tu panel de propietario ya tiene tus reservas y perros recibidos.
          </p>
          <Link
            href="/mis-reservas"
            className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-canvas px-4 py-2 text-sm font-semibold text-body hover:border-ink/30 hover:text-ink"
          >
            Ir a Mis reservas
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Caso B: criador nuevo — CTA grande para crear kennel */}
      <div className="rounded-2xl border-2 border-ink bg-canvas p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-3">
          <Store className="w-5 h-5 text-ink" />
          <h2 className="text-xl font-bold text-ink">Empieza creando tu criadero</h2>
        </div>
        <p className="text-sm text-body mb-5">
          Registra tu afijo, tu raza principal y tus datos de contacto. Después
          podrás añadir perros, configurar tu web pública y empezar a recibir
          consultas de clientes.
        </p>

        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <BenefitItem icon={Dog} title="Pedigree completo">
            Registra perros con padres, abuelos y descendencia. Búsqueda y exportación incluidos.
          </BenefitItem>
          <BenefitItem icon={Globe} title="Web pública">
            Tu propio sitio en <code>genealogic.io/c/tu-afijo</code> o tu dominio personalizado.
          </BenefitItem>
          <BenefitItem icon={Mail} title="Gestión de clientes">
            Pipeline de reservas, contratos, mensajería bidireccional con cada interesado.
          </BenefitItem>
          <BenefitItem icon={BarChart3} title="Analíticas reales">
            Quién visita tu web, de dónde, qué perros miran más. Sin Google Analytics ni cookies.
          </BenefitItem>
        </ul>

        <Link
          href="/kennel/new"
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-ink text-on-primary px-6 py-3 text-sm font-bold hover:opacity-90"
        >
          Crear mi criadero
          <ArrowRight className="w-4 h-4" />
        </Link>
        <p className="text-[11px] text-muted text-center mt-3">
          Tarda menos de 3 minutos. Después puedes ir editando todo a tu ritmo.
        </p>
      </div>

      {/* Soft links */}
      <div className="mt-6 flex items-center justify-center gap-6 text-xs text-muted">
        <Link href="/kennels" className="hover:text-ink">
          Explorar otros criaderos →
        </Link>
        <Link href="/search" className="hover:text-ink">
          Buscar perros por raza →
        </Link>
        <a href="mailto:hola@genealogic.io" className="hover:text-ink">
          Pedir ayuda →
        </a>
      </div>
    </div>
  )
}

function BenefitItem({
  icon: Icon, title, children,
}: { icon: typeof Store; title: string; children: React.ReactNode }) {
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
