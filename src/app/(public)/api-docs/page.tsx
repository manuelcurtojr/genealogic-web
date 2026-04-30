import Link from 'next/link'
import { ArrowLeft, Book, Key, Zap } from 'lucide-react'

export const metadata = {
  title: 'API Docs · Genealogic',
  description: 'Documentación de la API pública de Genealogic — perros, camadas y criaderos en tiempo real',
}

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <Link href="/" className="text-sm text-white/40 hover:text-white/70 inline-flex items-center gap-2 mb-6">
          <ArrowLeft className="w-4 h-4" /> Volver al inicio
        </Link>

        <h1 className="text-3xl sm:text-4xl font-bold mb-2">API de Genealogic</h1>
        <p className="text-white/50 mb-10">
          Versión 1 — accede a tus perros, camadas y datos del criadero en tiempo real desde aplicaciones externas como
          Pawdoq Breeders u otros chatbots/CRMs.
        </p>

        {/* Quick start */}
        <section className="mb-10">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-[#D74709]" /> Quick start
          </h2>
          <ol className="space-y-3 text-sm text-white/70">
            <li><span className="text-[#D74709] font-semibold">1.</span> Genera una API key en <Link href="/kennel/api" className="text-[#D74709] hover:underline">Mi Criadero → API</Link></li>
            <li><span className="text-[#D74709] font-semibold">2.</span> Cópiala y guárdala (solo se muestra una vez)</li>
            <li><span className="text-[#D74709] font-semibold">3.</span> Llama a la API con header <code className="bg-white/5 px-1.5 py-0.5 rounded text-xs">Authorization: Bearer gnl_...</code></li>
          </ol>
        </section>

        {/* Auth */}
        <section className="mb-10">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
            <Key className="w-5 h-5 text-[#D74709]" /> Autenticación
          </h2>
          <p className="text-sm text-white/70 mb-3">Todos los endpoints requieren una API key válida en el header HTTP:</p>
          <pre className="bg-gray-900 border border-white/10 rounded-lg p-4 text-xs text-emerald-300 font-mono overflow-x-auto">
{`curl https://www.genealogic.io/api/v1/kennel \\
  -H "Authorization: Bearer gnl_tu_api_key"`}
          </pre>
          <p className="text-xs text-white/50 mt-3">
            La API key está vinculada a un único criadero. Las respuestas se filtran automáticamente al
            criadero propietario de la key.
          </p>
        </section>

        {/* Endpoints */}
        <section className="mb-10">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
            <Book className="w-5 h-5 text-[#D74709]" /> Endpoints
          </h2>

          <div className="space-y-8">
            <Endpoint
              method="GET"
              path="/api/v1/kennel"
              desc="Información completa del criadero (nombre, web, RRSS, WhatsApp, fecha de fundación, etc.)."
              example={`{
  "id": "uuid",
  "name": "Irema Curtó",
  "slug": "irema-curto",
  "description": "...",
  "website": "https://iremacurto.com",
  "social_instagram": "...",
  "whatsapp_phone": "+34685343971",
  "foundation_date": "1975-01-01"
}`}
            />

            <Endpoint
              method="GET"
              path="/api/v1/dogs"
              desc="Lista de todos los perros del criadero (públicos)."
              params={[
                ['sex', `'male' | 'female'`],
                ['for_sale', `'true' | 'false'`],
                ['reproductive', `'true' | 'false'`],
                ['limit', `1-100 (default 50)`],
                ['offset', `0+ (default 0)`],
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
      "breed": { "id": "...", "name": "Galgo Italiano", "slug": "galgo-italiano" },
      "color": { "id": "...", "name": "Leonado" }
    }
  ],
  "pagination": { "total": 42, "limit": 50, "offset": 0 }
}`}
            />

            <Endpoint
              method="GET"
              path="/api/v1/dogs/:slug"
              desc="Un perro concreto (por slug o UUID) con su pedigree completo (5 generaciones) y galería de fotos."
              example={`{
  "id": "uuid",
  "name": "Sirio de L'Argentería",
  "slug": "sirio-de-largenteria",
  "sex": "male",
  "birth_date": "2017-04-15",
  "registration": "LOE-12345",
  "microchip": "...",
  "is_for_sale": false,
  "sale_price": null,
  "breed": {…},
  "color": {…},
  "pedigree": [ … 5 generations of ancestors … ],
  "photos": ["https://…", "https://…"]
}`}
            />

            <Endpoint
              method="GET"
              path="/api/v1/litters"
              desc="Camadas del criadero (públicas)."
              params={[
                ['status', `'planned' | 'mated' | 'born'`],
                ['limit', `1-100 (default 50)`],
                ['offset', `0+ (default 0)`],
              ]}
              example={`{
  "data": [
    {
      "id": "uuid",
      "status": "mated",
      "mating_date": "2026-04-01",
      "birth_date": null,
      "puppy_count": null,
      "breed": {…},
      "father": { "name": "Sirio…", "slug": "sirio…", "sex": "male" },
      "mother": { "name": "Luna…", "slug": "luna…", "sex": "female" }
    }
  ]
}`}
            />

            <Endpoint
              method="GET"
              path="/api/v1/litters/upcoming"
              desc='Camadas planificadas o en gestación. Optimizado para chatbots respondiendo "¿hay camadas próximamente?"'
            />

            <Endpoint
              method="GET"
              path="/api/v1/litters/available-puppies"
              desc='Cachorros y perros listos para vender (is_for_sale = true). Para chatbots respondiendo "¿hay cachorros disponibles?"'
            />

            <Endpoint
              method="GET"
              path="/api/v1/breeds"
              desc="Razas que cría este kennel (basado en los perros que tiene registrados)."
              example={`{
  "data": [
    { "id": "...", "name": "Galgo Italiano", "slug": "galgo-italiano" },
    { "id": "...", "name": "Cocker Spaniel", "slug": "cocker-spaniel" }
  ]
}`}
            />
          </div>
        </section>

        {/* Errors */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4">Errores</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-white/50 border-b border-white/10">
                <th className="pb-2">Código</th>
                <th className="pb-2">Significado</th>
              </tr>
            </thead>
            <tbody className="text-white/70">
              <tr className="border-b border-white/5"><td className="py-2 font-mono text-xs">401</td><td className="py-2">API key faltante, inválida o revocada</td></tr>
              <tr className="border-b border-white/5"><td className="py-2 font-mono text-xs">403</td><td className="py-2">El recurso no es público o no pertenece al kennel</td></tr>
              <tr className="border-b border-white/5"><td className="py-2 font-mono text-xs">404</td><td className="py-2">Recurso no encontrado</td></tr>
              <tr><td className="py-2 font-mono text-xs">500</td><td className="py-2">Error del servidor</td></tr>
            </tbody>
          </table>
        </section>

        {/* Rate limits */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4">Rate limits</h2>
          <p className="text-sm text-white/70">
            Por ahora sin límites estrictos. Si abusas, te capamos. Recomendado: cachear respuestas en Pawdoq (TTL 60s)
            y usar webhooks para tiempo real.
          </p>
        </section>

        <p className="text-xs text-white/30 mt-12 pt-6 border-t border-white/10">
          ¿Dudas? Contacta con soporte. Genealogic API v1 · 2026.
        </p>
      </div>
    </div>
  )
}

function Endpoint({ method, path, desc, params, example }: {
  method: string; path: string; desc: string;
  params?: [string, string][]; example?: string
}) {
  return (
    <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400">{method}</span>
        <code className="text-sm font-mono text-white">{path}</code>
      </div>
      <p className="text-sm text-white/60 mb-3">{desc}</p>
      {params && params.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-1">Query params</p>
          <ul className="text-xs space-y-1">
            {params.map(([k, v]) => (
              <li key={k}><code className="text-[#D74709] font-mono">{k}</code> <span className="text-white/40">— {v}</span></li>
            ))}
          </ul>
        </div>
      )}
      {example && (
        <details className="text-xs">
          <summary className="cursor-pointer text-white/40 hover:text-white/70">Ver respuesta de ejemplo</summary>
          <pre className="bg-gray-900 border border-white/10 rounded-lg p-3 mt-2 text-emerald-300 font-mono overflow-x-auto">{example}</pre>
        </details>
      )}
    </div>
  )
}
