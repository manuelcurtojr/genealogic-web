import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'API Docs',
  description:
    'Documentación de la API pública de Genealogic — perros, camadas y criaderos en tiempo real',
}

export default function ApiDocsPage() {
  return (
    <main className="min-h-screen bg-ink-900 text-fg">
      <div className="mx-auto max-w-[820px] px-6 py-10 sm:px-8 sm:py-14">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-fg-dim transition hover:text-fg"
        >
          <ArrowLeft className="h-4 w-4" /> Volver al inicio
        </Link>

        <div className="mt-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-fg-mute">
            API · Versión 1
          </p>
          <h1 className="mt-3 font-display text-5xl font-normal leading-[1] tracking-[-0.025em] sm:text-6xl">
            La <span className="italic font-light">API</span> de Genealogic.
          </h1>
          <p className="mt-6 max-w-[560px] text-[17px] leading-[1.55] text-fg-dim">
            Accede a tus perros, camadas y datos del criadero en tiempo real desde
            aplicaciones externas como Pawdoq Breeders u otros chatbots / CRMs.
          </p>
        </div>

        {/* Quick start */}
        <Section num="01" label="Quick start" title="Empieza en 3 pasos">
          <ol className="space-y-3 text-[15px] leading-[1.6] text-fg-dim">
            <Step n={1}>
              Genera una API key en{' '}
              <Link href="/kennel/api" className="text-fg underline decoration-fg-mute underline-offset-4 hover:decoration-fg">
                Mi Criadero → API
              </Link>
              .
            </Step>
            <Step n={2}>Cópiala y guárdala (solo se muestra una vez).</Step>
            <Step n={3}>
              Llama a la API con header{' '}
              <code className="rounded bg-chip px-1.5 py-0.5 font-mono text-[13px]">
                Authorization: Bearer gnl_…
              </code>
              .
            </Step>
          </ol>
        </Section>

        {/* Auth */}
        <Section num="02" label="Autenticación" title="Bearer token por kennel">
          <p className="text-[15px] leading-[1.6] text-fg-dim">
            Todos los endpoints requieren una API key válida en el header HTTP:
          </p>
          <pre className="mt-5 overflow-x-auto rounded-card border border-hair bg-ink-800 p-5 font-mono text-[13px] leading-[1.6] text-fg">
{`curl https://www.genealogic.io/api/v1/kennel \\
  -H "Authorization: Bearer gnl_tu_api_key"`}
          </pre>
          <p className="mt-4 text-sm leading-[1.55] text-fg-mute">
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
              desc="Un perro concreto con genealogía completa (5 generaciones) y galería de fotos."
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
          </div>
        </Section>

        {/* Errors */}
        <Section num="04" label="Errores" title="Códigos HTTP">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-hair text-left">
                <th className="pb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-fg-mute">Código</th>
                <th className="pb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-fg-mute">Significado</th>
              </tr>
            </thead>
            <tbody className="text-fg-dim">
              <tr className="border-b border-hair">
                <td className="py-3 font-mono text-[13px] text-fg">401</td>
                <td className="py-3">API key faltante, inválida o revocada</td>
              </tr>
              <tr className="border-b border-hair">
                <td className="py-3 font-mono text-[13px] text-fg">403</td>
                <td className="py-3">El recurso no es público o no pertenece al kennel</td>
              </tr>
              <tr className="border-b border-hair">
                <td className="py-3 font-mono text-[13px] text-fg">404</td>
                <td className="py-3">Recurso no encontrado</td>
              </tr>
              <tr>
                <td className="py-3 font-mono text-[13px] text-fg">500</td>
                <td className="py-3">Error del servidor</td>
              </tr>
            </tbody>
          </table>
        </Section>

        {/* Rate limits */}
        <Section num="05" label="Rate limits" title="Sin límites estrictos por ahora">
          <p className="text-[15px] leading-[1.6] text-fg-dim">
            Si abusas, te capamos. Recomendado: cachear respuestas en Pawdoq (TTL 60s) y
            usar webhooks para tiempo real.
          </p>
        </Section>

        <p className="mt-16 border-t border-hair pt-6 font-mono text-[11px] uppercase tracking-[0.12em] text-fg-mute">
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
    <section className="mt-16 border-t border-hair pt-10">
      <div className="flex items-center gap-[10px] font-mono text-xs tracking-[1px] text-fg-mute">
        <span>{num}</span>
        <span className="h-px w-6 bg-hair-strong" />
        <span className="uppercase">{label}</span>
      </div>
      <h2 className="mt-4 font-display text-3xl font-normal leading-[1.1] tracking-[-0.02em] sm:text-4xl">
        {title}
      </h2>
      <div className="mt-6">{children}</div>
    </section>
  )
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="font-mono text-fg-mute">0{n}</span>
      <span className="flex-1">{children}</span>
    </li>
  )
}

function Endpoint({
  method,
  path,
  desc,
  params,
  example,
}: {
  method: string
  path: string
  desc: string
  params?: [string, string][]
  example?: string
}) {
  return (
    <div className="rounded-card border border-hair bg-ink-800 p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="rounded bg-emerald-500/15 px-2 py-0.5 font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-emerald-400">
          {method}
        </span>
        <code className="font-mono text-sm text-fg">{path}</code>
      </div>
      <p className="mt-3 text-sm leading-[1.55] text-fg-dim">{desc}</p>

      {params && params.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-fg-mute">
            Query params
          </p>
          <ul className="space-y-1">
            {params.map(([k, v]) => (
              <li key={k} className="font-mono text-[13px]">
                <span className="text-fg">{k}</span>{' '}
                <span className="text-fg-mute">— {v}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {example && (
        <details className="mt-4">
          <summary className="cursor-pointer font-mono text-[11px] uppercase tracking-[0.12em] text-fg-mute hover:text-fg-dim">
            Ver respuesta de ejemplo
          </summary>
          <pre className="mt-3 overflow-x-auto rounded-lg border border-hair bg-ink-900 p-4 font-mono text-[12.5px] leading-[1.55] text-fg">
            {example}
          </pre>
        </details>
      )}
    </div>
  )
}
