/**
 * Vista de impresión de un contrato firmado (server component, presentacional).
 * Render limpio A4 del markdown + bloque de firmas. El usuario hace
 * "Guardar como PDF" desde el diálogo de impresión del navegador (cero deps).
 */
import { renderContractMarkdown } from '@/lib/contracts/markdown'
import { getTranslator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'

type Sig = { name: string | null; date: string | null; ip: string | null }

const PRINT_CSS = `
.cp-doc { max-width: 720px; margin: 0 auto; padding: 48px 40px 80px; color: #1a1a1a;
  overflow-wrap: anywhere; word-break: break-word;
  font: 15px/1.65 ui-serif, Georgia, 'Times New Roman', serif; }
.cp-doc h1 { font-size: 22px; text-align: center; margin: 0 0 4px; letter-spacing: .2px; }
.cp-doc h2 { font-size: 16px; margin: 26px 0 6px; border-bottom: 1px solid #ddd; padding-bottom: 3px; }
.cp-doc h3 { font-size: 14px; margin: 18px 0 4px; }
.cp-doc p { margin: 8px 0; text-align: justify; }
.cp-doc ul, .cp-doc ol { margin: 8px 0; padding-left: 22px; }
.cp-doc li { margin: 3px 0; }
.cp-doc hr { border: none; border-top: 1px solid #ccc; margin: 18px 0; }
.cp-doc strong { font-weight: 700; }
.cp-sign { display: flex; gap: 40px; margin-top: 48px; }
.cp-sign > div { flex: 1; border-top: 1px solid #333; padding-top: 8px; }
.cp-sign-label { font-size: 11px; text-transform: uppercase; letter-spacing: .6px; color: #777; }
.cp-sign-name { font-size: 15px; font-weight: 700; margin-top: 4px; }
.cp-sign-meta { font-size: 11px; color: #888; margin-top: 2px; }
.cp-stamp { margin-top: 28px; font-size: 11px; color: #2a8a4a; text-align: center;
  border: 1px solid #cfe9d6; background: #f3fbf5; border-radius: 6px; padding: 8px; }
/* Móvil (WebView iOS): menos padding y firmas apiladas para que no desborde. */
@media (max-width: 640px) {
  .cp-doc { padding: 24px 18px 48px; font-size: 14px; }
  .cp-doc h1 { font-size: 19px; }
  .cp-doc h2 { font-size: 15px; }
  .cp-doc p { text-align: left; }
  .cp-sign { gap: 20px; margin-top: 36px; }
}
@media (max-width: 480px) {
  .cp-sign { flex-direction: column; gap: 24px; }
}
@page { size: A4; margin: 18mm; }
@media print { .cp-doc { padding: 0; } }
`

export async function ContractPrintView({
  bodyMarkdown,
  breeder,
  client,
  status,
}: {
  bodyMarkdown: string
  breeder: Sig
  client: Sig
  status: string
}) {
  const t = getTranslator(await getLocale())
  const html = renderContractMarkdown(bodyMarkdown)
  const fmt = (d: string | null) => (d ? new Date(d).toLocaleString('es-ES') : '—')
  return (
    <div className="cp-doc">
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />
      <article dangerouslySetInnerHTML={{ __html: html }} />
      <section className="cp-sign">
        <div>
          <div className="cp-sign-label">{t('Por el criadero')}</div>
          <div className="cp-sign-name">{breeder.name || '—'}</div>
          <div className="cp-sign-meta">
            {fmt(breeder.date)}
            {breeder.ip ? ` · IP ${breeder.ip}` : ''}
          </div>
        </div>
        <div>
          <div className="cp-sign-label">{t('El cliente')}</div>
          <div className="cp-sign-name">{client.name || '—'}</div>
          <div className="cp-sign-meta">
            {fmt(client.date)}
            {client.ip ? ` · IP ${client.ip}` : ''}
          </div>
        </div>
      </section>
      {status === 'signed_full' && (
        <p className="cp-stamp">
          {t('Documento firmado electrónicamente por ambas partes. Copia con validez probatoria.')}
        </p>
      )}
    </div>
  )
}
