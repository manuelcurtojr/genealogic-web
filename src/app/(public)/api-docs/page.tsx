/**
 * /api-docs — documentación pública de la API Genealogic v1.
 *
 * Acceso a la API restringido a Kennel Enterprise (149€/mes).
 * Cualquier otro plan recibe 403 en cada request.
 *
 * Cubre 17 endpoints públicos organizados en 7 secciones:
 *   01 Quick start
 *   02 Autenticación + gate Enterprise
 *   03 Mi criadero (kennel + dogs + litters + reservations)
 *   04 Recursos por perro (pedigree, fotos, vet, palmarés, genotipos, audit)
 *   05 Catálogo global (search, breeds/all, kennels/{slug})
 *   06 Mutaciones (PATCH dogs, PATCH litters)
 *   07 Errores + rate limits + idempotencia
 */
import Link from 'next/link'
import { ArrowLeft, Crown, Lock } from 'lucide-react'
import { getTranslator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'

export const metadata = {
  title: 'API Docs',
  description:
    'API pública v1 de Genealogic: perros, genealogías, camadas, reservas, palmarés, genotipos, vet, audit log, búsqueda global, razas. Disponible para Kennel Enterprise.',
}

export default async function ApiDocsPage() {
  const t = getTranslator(await getLocale())
  return (
    <main className="min-h-screen bg-canvas text-ink">
      <div className="mx-auto max-w-[820px] px-6 py-10 sm:px-8 sm:py-14">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-body transition hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" /> {t('Volver al inicio')}
        </Link>

        <div className="mt-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
            {t('API · Versión 1')}
          </p>
          <h1 className="mt-3 font-sans text-5xl font-normal leading-[1] tracking-[-0.025em] sm:text-6xl">
            {t('La')} <span className="italic font-light">API</span> {t('de Genealogic.')}
          </h1>
          <p className="mt-6 max-w-[620px] text-[17px] leading-[1.55] text-body">
            {t('REST sobre HTTPS. JSON entra, JSON sale. Cubre 17 endpoints: tu criadero, tus perros con genealogía y COI, camadas, reservas, palmarés, cartilla veterinaria, genotipos, histórico de cambios, y búsqueda global en el catálogo público (+250.000 perros).')}
          </p>

          {/* Badge Enterprise gate — lo más importante de toda la página */}
          <div className="mt-7 inline-flex items-center gap-2.5 rounded-full border-2 border-[#8b5cf6] bg-[#8b5cf6]/5 px-4 py-2">
            <Crown className="h-4 w-4 text-[#8b5cf6]" />
            <p className="text-[13px] font-semibold text-ink">
              {t('Solo disponible en')} <span className="text-[#8b5cf6]">Kennel Enterprise</span>
            </p>
            <Link
              href="/pricing"
              className="text-[12px] font-bold text-[#8b5cf6] underline decoration-[#8b5cf6]/30 underline-offset-4 hover:decoration-[#8b5cf6]"
            >
              {t('Ver planes')} →
            </Link>
          </div>
        </div>

        {/* ── 01 Quick start ──────────────────────────────────────────── */}
        <Section num="01" label={t('Quick start')} title={t('Empieza en 3 pasos')}>
          <ol className="space-y-3 text-[15px] leading-[1.6] text-body">
            <Step n={1}>
              {t('Suscríbete a')}{' '}
              <Link href="/pricing" className="text-ink underline decoration-hairline underline-offset-4 hover:decoration-ink">
                Kennel Enterprise
              </Link>{' '}
              {t('y completa la activación con soporte (hola@genealogic.io).')}
            </Step>
            <Step n={2}>
              {t('Genera una API key en')}{' '}
              <Link href="/kennel/api" className="text-ink underline decoration-hairline underline-offset-4 hover:decoration-ink">
                {t('Mi criadero → API')}
              </Link>
              . {t('Solo se muestra una vez — guárdala en tu gestor de secretos.')}
            </Step>
            <Step n={3}>
              {t('Llama a la API con header')}{' '}
              <code className="rounded bg-surface-card px-1.5 py-0.5 font-mono text-[13px]">
                Authorization: Bearer gnl_…
              </code>
              .
            </Step>
          </ol>
        </Section>

        {/* ── 02 Auth ─────────────────────────────────────────────────── */}
        <Section num="02" label={t('Autenticación')} title={t('Bearer token + plan Enterprise')}>
          <p className="text-[15px] leading-[1.6] text-body">
            {t('Todos los endpoints requieren una API key válida en el header HTTP y que el criadero propietario de la key esté en plan Kennel Enterprise. Si el plan baja por cualquier motivo, todas las keys del kennel siguen presentes pero devuelven 403 hasta que el plan vuelva a estar activo.')}
          </p>

          <pre className="mt-5 overflow-x-auto rounded-card border border-hairline bg-surface-card p-5 font-mono text-[13px] leading-[1.6] text-ink">
{`curl https://www.genealogic.io/api/v1/kennel \\
  -H "Authorization: Bearer gnl_tu_api_key"`}
          </pre>

          <div className="mt-5 rounded-card border border-amber-200 bg-amber-50/40 p-4">
            <p className="text-[13px] font-semibold text-amber-900 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" /> {t('Lo que la API key NO te da')}
            </p>
            <ul className="mt-2 space-y-1.5 text-[13px] text-amber-900/80 list-disc pl-5">
              <li>{t('No expone datos sensibles del solicitante de una reserva (email, teléfono, dirección) — esos campos solo viven en el dashboard.')}</li>
              <li>{t('No puede generar PDFs de contratos ni firmas — esos son flujos del dashboard porque requieren consentimiento explícito.')}</li>
              <li>{t('No puede crear ni borrar API keys propias por seguridad.')}</li>
            </ul>
          </div>
        </Section>

        {/* ── 03 Mi criadero ──────────────────────────────────────────── */}
        <Section num="03" label={t('Mi criadero')} title={t('Recursos del kennel autenticado')}>
          <p className="mb-5 text-[14px] leading-[1.6] text-body">
            {t('Estos endpoints devuelven datos del criadero al que pertenece tu API key. El filtrado por')} <code className="font-mono text-[12.5px]">kennel_id</code> {t('es automático.')}
          </p>
          <div className="space-y-6">
            <Endpoint
              method="GET"
              path="/api/v1/kennel"
              desc={t('Información completa de tu criadero: nombre, redes sociales, WhatsApp, custom domain, fecha de fundación, etc.')}
            />

            <Endpoint
              method="GET"
              path="/api/v1/dogs"
              desc={t('Listado paginado de los perros de tu criadero.')}
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
      "name": "Néstor de Irema Curtó",
      "slug": "nestor-de-irema-curto",
      "sex": "male",
      "birth_date": "1998-02-25",
      "thumbnail_url": "https://…",
      "is_for_sale": false,
      "is_reproductive": true,
      "breed": { "id": "...", "name": "Presa Canario" },
      "color": { "id": "...", "name": "Bardino gris" }
    }
  ],
  "pagination": { "total": 451, "limit": 50, "offset": 0 }
}`}
            />

            <Endpoint
              method="GET"
              path="/api/v1/dogs/:slug"
              desc={t('Ficha completa de un perro: padres, identidad, medidas, registro oficial, kennel.')}
            />

            <Endpoint
              method="GET"
              path="/api/v1/litters"
              desc={t('Camadas del criadero.')}
              params={[
                ['status', `'planned' | 'mated' | 'born' | 'confirmed'`],
                ['limit', '1–100 (default 50)'],
                ['offset', '0+ (default 0)'],
              ]}
            />

            <Endpoint
              method="GET"
              path="/api/v1/litters/upcoming"
              desc={t('Camadas planificadas o en gestación. Optimizado para chatbots: "¿hay camadas próximamente?"')}
            />

            <Endpoint
              method="GET"
              path="/api/v1/litters/available-puppies"
              desc={t('Cachorros y perros listos para vender. Para chatbots: "¿hay cachorros disponibles?"')}
            />

            <Endpoint
              method="GET"
              path="/api/v1/litters/:id"
              desc={t('Detalle de una camada concreta.')}
            />

            <Endpoint
              method="GET"
              path="/api/v1/breeds"
              desc={t('Razas que cría este kennel (deducido de los perros registrados).')}
            />

            <Endpoint
              method="GET"
              path="/api/v1/reservations"
              desc={t('Pipeline de reservas del criadero. NO incluye email/teléfono/dirección del solicitante por compliance.')}
              params={[
                ['status', `'new' | 'evaluating' | 'deposit' | 'contract' | 'delivery' | 'lost'`],
                ['active', `'true' (default) | 'false' (incluye cerradas y perdidas)`],
                ['limit', '1–100 (default 50)'],
                ['offset', '0+ (default 0)'],
              ]}
              example={`{
  "data": [
    {
      "id": "uuid",
      "status": "deposit",
      "litter_id": "uuid",
      "puppy_dog_id": null,
      "position_in_queue": 3,
      "preference_sex": "female",
      "preference_color": "leonado",
      "deposit_amount_cents": 30000,
      "total_price_cents": 120000,
      "currency": "EUR",
      "deposit_paid_at": "2026-04-12T10:00:00Z",
      "created_at": "2026-04-01T09:30:00Z",
      "source": "web_form"
    }
  ],
  "pagination": { "total": 17, "limit": 50, "offset": 0 }
}`}
            />
          </div>
        </Section>

        {/* ── 04 Por perro ───────────────────────────────────────────── */}
        <Section num="04" label={t('Por perro')} title={t('Recursos vinculados a un perro')}>
          <p className="mb-5 text-[14px] leading-[1.6] text-body">
            {t('Todos requieren que el perro pertenezca a tu criadero. Usan el slug del perro (igual que en la URL pública /dogs/[slug]).')}
          </p>
          <div className="space-y-6">
            <Endpoint
              method="GET"
              path="/api/v1/dogs/:slug/pedigree"
              desc={t('Grafo plano de la genealogía hasta N generaciones. Cada nodo lleva father_id/mother_id para reconstruir el árbol cliente-side y calcular COI Wright.')}
              params={[['generations', '1–10 (default 5)']]}
              example={`{
  "root_dog_id": "uuid",
  "root_dog_name": "Néstor de Irema Curtó",
  "generations": 5,
  "nodes": [
    { "id": "uuid", "name": "Néstor", "sex": "male", "father_id": "uuid", "mother_id": "uuid", "gen": 0 },
    { "id": "uuid", "name": "Leon (Irema Curtó)", "sex": "male", "father_id": "uuid", "mother_id": "uuid", "gen": 1 },
    { "id": "uuid", "name": "Quina de Irema Curtó", "sex": "female", "father_id": "uuid", "mother_id": "uuid", "gen": 1 }
  ]
}`}
            />

            <Endpoint
              method="GET"
              path="/api/v1/dogs/:slug/photos"
              desc={t('Galería completa del perro, ordenada por posición.')}
            />

            <Endpoint
              method="GET"
              path="/api/v1/dogs/:slug/vet-records"
              desc={t('Cartilla veterinaria pública del perro: vacunas, desparasitaciones, tratamientos, cirugías. Solo registros con is_public=true.')}
              example={`{
  "data": [
    {
      "id": "uuid",
      "type": "vaccine",
      "title": "Polivalente anual",
      "date": "2026-03-12",
      "next_date": "2027-03-12",
      "notes": "...",
      "file_url": "https://…/certificado.pdf"
    }
  ]
}`}
            />

            <Endpoint
              method="GET"
              path="/api/v1/dogs/:slug/awards"
              desc={t('Palmarés público: CAC, CACIB, BIS, BOB, etc. con juez y certificado adjunto.')}
            />

            <Endpoint
              method="GET"
              path="/api/v1/dogs/:slug/genotypes"
              desc={t('Genotipos del perro: loci de color (E, B, K, D, A, S) y pruebas raciales (DM, PLL, displasia).')}
              example={`{
  "data": [
    { "locus": "E (Extension)", "allele_1": "E", "allele_2": "E", "source": "Embark", "confidence": "high" },
    { "locus": "B (Brown)", "allele_1": "B", "allele_2": "b", "source": "Embark", "confidence": "high" }
  ]
}`}
            />

            <Endpoint
              method="GET"
              path="/api/v1/dogs/:slug/history"
              desc={t('Audit log del perro: foto subida, peso editado, transferencia, palmarés añadido, etc. Útil para feeds de actividad.')}
              params={[['limit', '1–200 (default 50)']]}
              example={`{
  "data": [
    {
      "action": "photo_added",
      "payload": { "url": "https://…" },
      "actor_name": "Irema Curtó",
      "created_at": "2026-05-12T14:23:00Z"
    },
    {
      "action": "updated",
      "payload": { "weight": { "from": 32.1, "to": 33.4 } },
      "actor_name": "Irema Curtó",
      "created_at": "2026-05-12T14:18:00Z"
    }
  ]
}`}
            />
          </div>
        </Section>

        {/* ── 05 Catálogo global ──────────────────────────────────────── */}
        <Section num="05" label={t('Catálogo global')} title={t('Búsqueda y referencias en toda la red')}>
          <p className="mb-5 text-[14px] leading-[1.6] text-body">
            {t('Estos endpoints leen del catálogo público (+250.000 perros, miles de criaderos, cientos de razas). NO filtran por tu kennel.')}
          </p>
          <div className="space-y-6">
            <Endpoint
              method="GET"
              path="/api/v1/search"
              desc={t('Búsqueda global por perros, criaderos y razas. Usa índices GIN trigram — devuelve respuesta en <50ms sobre 250k filas.')}
              params={[
                ['q', 'cadena (mínimo 2 caracteres)'],
                ['type', `'dogs' | 'kennels' | 'breeds' | 'all' (default 'all')`],
                ['limit', '1–50 por tipo (default 10)'],
              ]}
              example={`{
  "q": "nestor",
  "dogs": [{ "id": "...", "name": "Néstor de Irema Curtó", "slug": "...", "thumbnail_url": "..." }],
  "kennels": [],
  "breeds": []
}`}
            />

            <Endpoint
              method="GET"
              path="/api/v1/breeds/all"
              desc={t('Catálogo global de razas para construir selectors o enlazar al estándar.')}
              params={[
                ['q', 'búsqueda por nombre (mínimo 2 caracteres)'],
                ['limit', '1–200 (default 100)'],
              ]}
            />

            <Endpoint
              method="GET"
              path="/api/v1/kennels/:slug"
              desc={t('Info pública de cualquier criadero del catálogo. Útil para mostrar el origen de un perro importado o el criadero de un perro de otra línea.')}
              example={`{
  "id": "uuid",
  "name": "Irema Curtó",
  "slug": "irema-curto",
  "description": "...",
  "city": "Santa Cruz de Tenerife",
  "country": "ES",
  "website": "https://iremacurto.com",
  "logo_url": "https://...",
  "hero_image_url": "https://...",
  "dogs_public_count": 451,
  "foundation_date": "1975-01-01"
}`}
            />
          </div>
        </Section>

        {/* ── 06 Mutaciones ───────────────────────────────────────────── */}
        <Section num="06" label={t('Mutaciones')} title={t('Escribir desde la API (PATCH)')}>
          <div className="space-y-6">
            <Endpoint
              method="PATCH"
              path="/api/v1/dogs/:slug"
              desc={t('Actualiza estado comercial o reproductivo de un perro. Pensado para que apps externas marquen un perro como vendido al cobrar la seña, o para sincronizar precios desde tu ERP.')}
              body={[
                ['is_for_sale', 'boolean'],
                ['sale_price', 'number | null (en céntimos)'],
                ['sale_currency', 'string | null (ISO 4217)'],
                ['sale_description', 'string | null'],
                ['sale_location', 'string | null'],
                ['sale_zipcode', 'string | null'],
                ['sale_reservation_price', 'number | null'],
                ['is_reproductive', 'boolean'],
                ['breeding_rights', 'boolean'],
              ]}
            />

            <Endpoint
              method="PATCH"
              path="/api/v1/litters/:id"
              desc={t('Avanza el estado de una camada (planificada → cubrición → nacimiento → confirmada) o ajusta fechas y nº de cachorros.')}
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

        {/* ── 07 Errores + rate limits ───────────────────────────────── */}
        <Section num="07" label={t('Errores')} title={t('Códigos HTTP y rate limits')}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-hairline text-left">
                <th className="pb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">{t('Código')}</th>
                <th className="pb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">{t('Significado')}</th>
              </tr>
            </thead>
            <tbody className="text-body">
              <tr className="border-b border-hairline">
                <td className="py-3 font-mono text-[13px] text-ink">400</td>
                <td className="py-3">{t('Parámetros inválidos (ej.')} <code className="font-mono text-[12px]">q</code> {t('con menos de 2 caracteres)')}</td>
              </tr>
              <tr className="border-b border-hairline">
                <td className="py-3 font-mono text-[13px] text-ink">401</td>
                <td className="py-3">{t('API key faltante, inválida o revocada')}</td>
              </tr>
              <tr className="border-b border-hairline">
                <td className="py-3 font-mono text-[13px] text-ink">403</td>
                <td className="py-3">{t('El plan no es Kennel Enterprise, o el recurso no pertenece a tu kennel')}</td>
              </tr>
              <tr className="border-b border-hairline">
                <td className="py-3 font-mono text-[13px] text-ink">404</td>
                <td className="py-3">{t('Recurso no encontrado')}</td>
              </tr>
              <tr>
                <td className="py-3 font-mono text-[13px] text-ink">500</td>
                <td className="py-3">{t('Error del servidor (avísanos en hola@genealogic.io)')}</td>
              </tr>
            </tbody>
          </table>

          <h3 className="mt-10 mb-3 text-[15px] font-semibold text-ink">{t('Ejemplo de error 403 (plan no Enterprise)')}</h3>
          <pre className="overflow-x-auto rounded-lg border border-hairline bg-canvas p-4 font-mono text-[12.5px] leading-[1.55] text-ink">
{`{
  "error": "API access requires Kennel Enterprise plan",
  "plan_required": "kennel_enterprise",
  "upgrade_url": "https://www.genealogic.io/pricing"
}`}
          </pre>

          <h3 className="mt-10 mb-3 text-[15px] font-semibold text-ink">{t('Rate limits')}</h3>
          <p className="text-[14px] leading-[1.6] text-body">
            {t('Sin límites duros mientras el uso sea razonable. Si detectamos abuso, capamos por IP+API key. Recomendado: cachear respuestas con TTL 60s para endpoints de lectura. Si necesitas más throughput o webhooks en tiempo real, escríbenos a')}
            {' '}<a href="mailto:hola@genealogic.io" className="text-ink underline decoration-hairline underline-offset-4 hover:decoration-ink">hola@genealogic.io</a>.
          </p>
        </Section>

        <p className="mt-16 border-t border-hairline pt-6 font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
          {t('Genealogic API v1 · 2026 · Solo Kennel Enterprise')}
        </p>
      </div>
    </main>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════════════════════════════════ */

function Section({
  num, label, title, children,
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

async function Endpoint({
  method, path, desc, params, body, example,
}: {
  method: string
  path: string
  desc: string
  params?: [string, string][]
  body?: [string, string][]
  example?: string
}) {
  const t = getTranslator(await getLocale())
  const methodColor =
    method === 'GET'
      ? 'bg-emerald-500/15 text-emerald-700'
      : method === 'PATCH'
        ? 'bg-amber-500/15 text-amber-700'
        : method === 'POST'
          ? 'bg-blue-500/15 text-blue-700'
          : method === 'DELETE'
            ? 'bg-red-500/15 text-red-700'
            : 'bg-emerald-500/15 text-emerald-700'

  return (
    <div className="rounded-card border border-hairline bg-surface-card p-5 sm:p-6">
      <div className="flex items-center gap-3 flex-wrap">
        <span className={`rounded px-2 py-0.5 font-mono text-[11px] font-bold uppercase tracking-[0.06em] ${methodColor}`}>
          {method}
        </span>
        <code className="font-mono text-sm text-ink break-all">{path}</code>
      </div>
      <p className="mt-3 text-sm leading-[1.55] text-body">{desc}</p>

      {params && params.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
            {t('Query params')}
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
            {t('Body (JSON, todos opcionales)')}
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
            {t('Ver respuesta de ejemplo')}
          </summary>
          <pre className="mt-3 overflow-x-auto rounded-lg border border-hairline bg-canvas p-4 font-mono text-[12.5px] leading-[1.55] text-ink">
            {example}
          </pre>
        </details>
      )}
    </div>
  )
}
