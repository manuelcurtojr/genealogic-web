/**
 * /contrato-preview/[token] — Vista pública SÓLO LECTURA de un contrato.
 *
 * Acceso: cualquiera con el token (UUID v4) puede ver el contrato. No requiere
 * login. Pensado para que el criador comparta el link con el cliente vía
 * WhatsApp/email para que LEA el contrato antes de decidir registrarse y
 * firmar.
 *
 * Diferencias vs /contrato-print/[contractId]:
 *   - Sin auth (lookup por token, no por id)
 *   - Marca de agua diagonal "VISTA PREVIA — NO ES UN DOCUMENTO FIRMADO"
 *   - NO muestra firmas (aunque exista signed_at_breeder/client, en esta
 *     vista no se enseñan — es una "vista del documento sin contexto de firma")
 *   - Footer con CTA "Para firmar este contrato, pídele al criador que te lo
 *     envíe oficialmente desde Genealogic"
 *
 * SEO: noindex (no queremos que google indexe contratos de clientes).
 */
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createKennelAdminClient } from '@/lib/supabase/server'
import { renderContractMarkdown } from '@/lib/contracts/markdown'
import { Lock, FileText } from 'lucide-react'
import PrintButton from './print-button'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Vista previa del contrato · Genealogic',
  robots: { index: false, follow: false },
}

export default async function ContractPreviewPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  // Validación rudimentaria del formato UUID — evita queries con basura
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)) {
    notFound()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const { data: contract } = await admin
    .from('reservation_contracts')
    .select(`
      id, title, body_html, kind,
      reservation:puppy_reservations(
        kennel:kennels(name, slug, logo_url)
      )
    `)
    .eq('preview_token', token)
    .maybeSingle()

  if (!contract) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const kennel = (contract.reservation as any)?.kennel
  const kennelName = kennel?.name || 'el criadero'
  const kindLabel = contract.kind === 'delivery'
    ? 'Contrato de compraventa y entrega'
    : 'Contrato de reserva'

  return (
    <main className="min-h-screen bg-surface-soft">
      {/* Barra superior (oculta al imprimir) */}
      <header className="sticky top-0 z-20 border-b border-hairline bg-canvas print:hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-ink text-on-primary flex items-center justify-center flex-shrink-0">
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted leading-none">
                Vista previa · sólo lectura
              </p>
              <p className="text-[13px] font-semibold text-ink truncate leading-tight mt-0.5">
                {kindLabel} · {kennelName}
              </p>
            </div>
          </div>
          <PrintButton />

        </div>
      </header>

      {/* Aviso flotante */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-5 print:hidden">
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 flex items-start gap-3">
          <Lock className="h-4 w-4 flex-shrink-0 mt-0.5 text-amber-700" />
          <div className="flex-1 min-w-0 text-[13px] text-amber-900 leading-snug">
            <p className="font-semibold">Estás viendo una vista previa del contrato.</p>
            <p className="mt-0.5 text-amber-800">
              No es un documento firmado. Para firmarlo legalmente, pídele a{' '}
              <span className="font-semibold">{kennelName}</span> que te envíe la
              versión oficial desde Genealogic — recibirás un email para crear cuenta
              y firmar.
            </p>
          </div>
        </div>
      </div>

      {/* Documento — con marca de agua diagonal "VISTA PREVIA" */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <article className="relative bg-canvas rounded-xl border border-hairline shadow-sm overflow-hidden print:shadow-none print:border-0 print:rounded-none">
          {/* Watermark diagonal — visible también al imprimir */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 flex items-center justify-center select-none"
            style={{
              zIndex: 1,
              opacity: 0.08,
              transform: 'rotate(-25deg)',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontSize: 'clamp(72px, 12vw, 160px)',
              fontWeight: 900,
              color: '#FE6620',
              letterSpacing: '-0.04em',
              whiteSpace: 'nowrap',
            }}
          >
            VISTA PREVIA
          </div>

          <div className="relative px-6 sm:px-12 py-8 sm:py-12" style={{ zIndex: 2 }}>
            <header className="mb-8 pb-6 border-b border-hairline">
              {kennel?.logo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={kennel.logo_url}
                  alt=""
                  className="h-12 w-12 rounded-lg object-cover mb-4"
                />
              )}
              <h1 className="text-[24px] sm:text-[30px] font-bold tracking-tight text-ink leading-tight">
                {contract.title || kindLabel}
              </h1>
              <p className="mt-1 text-[13px] text-muted">
                Emitido por <span className="font-semibold text-ink">{kennelName}</span>
              </p>
            </header>

            <div
              className="contract-preview prose prose-sm max-w-none min-w-0 overflow-x-hidden break-words text-[13.5px] leading-[1.7] text-ink"
              dangerouslySetInnerHTML={{ __html: renderContractMarkdown(contract.body_html || '') }}
            />
          </div>
        </article>

        {/* Footer (oculto al imprimir) */}
        <footer className="mt-8 text-center print:hidden">
          <p className="text-[12px] text-muted">
            Generado con{' '}
            <Link href="/" className="text-ink font-semibold hover:text-[#FE6620] transition-colors">
              Genealogic
            </Link>{' '}
            · La plataforma de contratos y genealogía canina
          </p>
        </footer>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { margin: 1.5cm; size: A4; }
          body { background: white !important; }
          .min-h-screen { min-height: auto; background: white !important; }
        }
      ` }} />
    </main>
  )
}
