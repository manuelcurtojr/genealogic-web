import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'API Docs',
  description:
    'Documentación de la API pública de Genealogic — perros, camadas y criaderos en tiempo real',
}

export default function ApiDocsPage() {
  return (
    <main className="min-h-screen bg-canvas text-ink">
      <div className="mx-auto max-w-[820px] px-6 py-10 sm:px-8 sm:py-14">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-body transition hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" /> Volver al inicio
        </Link>

        <div className="mt-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
            API · Versión 1
          </p>
          <h1 className="mt-3 font-sans text-5xl font-normal leading-[1] tracking-[-0.025em] sm:text-6xl">
            La <span className="italic font-light">API</span> de Genealogic.
          </h1>
          <p className="mt-6 max-w-[560px] text-[17px] leading-[1.55] text-body">
            Accede a tus perros, camadas y datos del criadero en tiempo real desde
            aplicaciones externas como Pawdoq Breeders u otros chatbots / CRMs.
          </p>
        </div>

        {/* Quick start */}
        <Section num="01" label="Quick start" title="Empieza en 3 pasos">
          <ol className="space-y-3 text-[15px] leading-[1.6] text-body">
            <Step n={1}>
              Genera una API key en{' '}
              <Link href="/kennel/api" className="text-ink underline decoration-hairline underline-offset-4 hover:decoration-ink">
                Mi Criadero → API
              </Link>
              .
            </Step>
            <Step n={2}>Cópiala y guárdala (solo se muestra una vez).</Step>
            <Step n={3}>
              Llama a la API con header{' '}
              <code className="rounded bg-surface-card px-1.5 py-0.5 font-mono text-[13px]">
                Authorization: Bearer gnl_…
              </code>
              .
            </Step>
          </ol>
        </Section>

        {/* Auth */}
        <Section num="02" label="Autenticación" title="Bearer token por kennel">
          <p className="text-[15px] leading-[1.6] text-body">
            Todos los endpoints requieren una API key válida en el header HTTP:
          </p>
          <pre className="mt-5 overflow-x-auto rounded-card border border-hairline bg-surface-card p-5 font-mono text-[13px] leading-[1.6] text-ink">
{`curl https://www.genealogic.io/api/v1/kennel \\
  -H "Authorization: Bearer gnl_tu_api_key"`}
          </pre>
          <p className="mt-4 text-sm leading-[1.55] text-muted">
            La API key está vinculada a un único criadero. Las respuestas se filtran
            automáticamente al criadero propietario de la key.
          </p>
        </Section>

        {/* Endpoints */}
        <Section num="03" label="Endpoints" title="Recursos disponibles">
          <div className="space-y-6">
            <Endpoint
              method="GET"
              path="/api/v1/kennel"
              desc="Información completa del criadero (nombre, web, RRSS, WhatsApp, fecha de fundación)."
              example={`{
  "id": "uuid",
  "name": "Irema Curtó",
  "slug": "irema-curto",
  "website": "https://iremacurto.com",
  "social_instagram": "...",
  "whatsapp_phone": "+34685343971",
  "foundation_date": "1975-01-01"
}`}
            />

            <Endpoint
              method="GET"
              path="/api/v1/dogs"
              desc="Lista de perros del criadero (públicos)."
              params={[
                ['sex', `'male' | 'female'`],
                ['for_sale', `'true' | 'false'`],
                ['reproductive', `'true' | 'false'`],
                ['limit', '1–100 (default 50)'],
                ['offset', '0+ (default 0)'],
              ]}
              example={`{
  "data": [
    {
      "id": "uuid",
      "name": "Sirio de L'Argentería",
      "slug": "sirio-de-largenteria",
      "sex": "male",
      "birth_date": "2017-04-15",
      "thumbnail_url": "https://…",
      "is_for_sale": false,
      "is_reproductive": true,
      "breed": { "id": "...", "name": "Galgo Italiano" },
      "color": { "id": "...", "name": "Leonado" }
    }
  ],
  "pagination": { "total": 42, "limit": 50, "offset": 0 }
}`}
            />

            <Endpoint
              method="GET"
              path="/api/v1/dogs/:slug"
              desc="Un perro concreto con genealogía completa (sin límite de generaciones) y galería de fotos."
            />

            <Endpoint
              method="GET"
              path="/api/v1/litters"
              desc="Camadas del criadero (públicas)."
              params={[
                ['status', `'planned' | 'mated' | 'born'`],
                ['limit', '1–100 (default 50)'],
                ['offset', '0+ (default 0)'],
              ]}
            />

            <Endpoint
              method="GET"
              path="/api/v1/litters/upcoming"
              desc='Camadas planificadas o en gestación. Optimizado para chatbots respondiendo "¿hay camadas próximamente?"'
            />

            <Endpoint
              method="GET"
              path="/api/v1/litters/available-puppies"
              desc='Cachorros y perros listos para vender. Para chatbots respondiendo "¿hay cachorros disponibles?"'
            />

            <Endpoint
              method="GET"
              path="/api/v1/breeds"
              desc="Razas que cría este kennel (basado en los perros que tiene registrados)."
            />

            <Endpoint
              method="PATCH"
              path="/api/v1/dogs/:slug"
              desc='Actualiza datos de venta o reproducción de un perro. Pensado para que apps externas (Pawdoq) marquen un perro como vendido al cobrar la seña.'
              body={[
                ['is_for_sale', 'boolean'],
                ['sale_price', 'number | null'],
                ['sale_currency', 'string | null'],
                ['sale_description', 'string | null'],
                ['sale_location', 'string | null'],
                ['sale_zipcode', 'string | null'],
                ['sale_reservation_price', 'number | null'],
                ['is_reproductive', 'boolean'],
                ['breeding_rights', 'boolean'],
              ]}
            />

            <Endpoint
              method="GET"
              path="/api/v1/litters/:id"
              desc="Una camada concreta del criadero."
            />

            <Endpoint
              method="PATCH"
              path="/api/v1/litters/:id"
              desc="Avanza el estado de una camada (planificada → cubrición → nacimiento → confirmada) o ajusta fechas y nº de cachorros."
              body={[
                ['status', `'planned' | 'mated' | 'born' | 'confirmed'`],
                ['mating_date', 'ISO date | null'],
                ['birth_date', 'ISO date | null'],
                ['puppy_count', 'number | null'],
                ['is_public', 'boolean'],
              ]}
            />
          </div>
        </Section>

        {/* Errors */}
        <Section num="04" label="Errores" title="Códigos HTTP">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-hairline text-left">
                <th className="pb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">Código</th>
                <th className="pb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">Significado</th>
              </tr>
            </thead>
            <tbody className="text-body">
              <tr className="border-b border-hairline">
                <td className="py-3 font-mono text-[13px] text-ink">401</td>
                <td className="py-3">API key faltante, inválida o revocada</td>
              </tr>
              <tr className="border-b border-hairline">
                <td className="py-3 font-mono text-[13px] text-ink">403</td>
                <td className="py-3">El recurso no es público o no pertenece al kennel</td>
              </tr>
              <tr className="border-b border-hairline">
                <td className="py-3 font-mono text-[13px] text-ink">404</td>
                <td className="py-3">Recurso no encontrado</td>
              </tr>
              <tr>
                <td className="py-3 font-mono text-[13px] text-ink">500</td>
                <td className="py-3">Error del servidor</td>
              </tr>
            </tbody>
          </table>
        </Section>

        {/* Rate limits */}
        <Section num="05" label="Rate limits" title="Sin límites estrictos por ahora">
          <p className="text-[15px] leading-[1.6] text-body">
            Si abusas, te capamos. Recomendado: cachear respuestas en Pawdoq (TTL 60s) y
            usar webhooks para tiempo real.
          </p>
        </Section>

        <p className="mt-16 border-t border-hairline pt-6 font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
          Genealogic API v1 · 2026
        </p>
      </div>
    </main>
  )
}

function Section({
  num,
  label,
  title,
  children,
}: {
  num: string
  label: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="mt-16 border-t border-hairline pt-10">
      <div className="flex items-center gap-[10px] font-mono text-xs tracking-[1px] text-muted">
        <span>{num}</span>
        <span className="h-px w-6 bg-hair-strong" />
        <span className="uppercase">{label}</span>
      </div>
      <h2 className="mt-4 font-sans text-3xl font-normal leading-[1.1] tracking-[-0.02em] sm:text-4xl">
        {title}
      </h2>
      <div className="mt-6">{children}</div>
    </section>
  )
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="font-mono text-muted">0{n}</span>
      <span className="flex-1">{children}</span>
    </li>
  )
}

function Endpoint({
  method,
  path,
  desc,
  params,
  body,
  example,
}: {
  method: string
  path: string
  desc: string
  params?: [string, string][]
  body?: [string, string][]
  example?: string
}) {
  const methodColor =
    method === 'GET'
      ? 'bg-emerald-500/15 text-emerald-400'
      : method === 'PATCH'
        ? 'bg-amber-500/15 text-amber-400'
        : method === 'POST'
          ? 'bg-blue-500/15 text-blue-400'
          : method === 'DELETE'
            ? 'bg-red-500/15 text-red-400'
            : 'bg-emerald-500/15 text-emerald-400'

  return (
    <div className="rounded-card border border-hairline bg-surface-card p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <span className={`rounded px-2 py-0.5 font-mono text-[11px] font-bold uppercase tracking-[0.06em] ${methodColor}`}>
          {method}
        </span>
        <code className="font-mono text-sm text-ink">{path}</code>
      </div>
      <p className="mt-3 text-sm leading-[1.55] text-body">{desc}</p>

      {params && params.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
            Query params
          </p>
          <ul className="space-y-1">
            {params.map(([k, v]) => (
              <li key={k} className="font-mono text-[13px]">
                <span className="text-ink">{k}</span>{' '}
                <span className="text-muted">— {v}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {body && body.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
            Body (JSON, todos opcionales)
          </p>
          <ul className="space-y-1">
            {body.map(([k, v]) => (
              <li key={k} className="font-mono text-[13px]">
                <span className="text-ink">{k}</span>{' '}
                <span className="text-muted">— {v}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {example && (
        <details className="mt-4">
          <summary className="cursor-pointer font-mono text-[11px] uppercase tracking-[0.12em] text-muted hover:text-body">
            Ver respuesta de ejemplo
          </summary>
          <pre className="mt-3 overflow-x-auto rounded-lg border border-hairline bg-canvas p-4 font-mono text-[12.5px] leading-[1.55] text-ink">
            {example}
          </pre>
        </details>
      )}
    </div>
  )
}
