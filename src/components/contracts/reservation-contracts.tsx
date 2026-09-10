'use client'

/**
 * Sección "Contratos" de la ficha de una reserva. Unifica TODOS los contratos
 * como PDF en un solo sitio:
 *  · Contratos de Genealogic → al estar FIRMADOS se autogenera el PDF
 *    (client-side con jspdf + html2canvas desde el markdown) y se guarda en el
 *    bucket privado `contracts`.
 *  · Contratos de papel → el criador sube el escaneo (PDF).
 * Ver/descargar via signed URL (bucket privado). Subida y borrado del fichero
 * son client-side (sesión del criador + RLS de storage); la fila la toca el
 * server action con service-role tras verificar propiedad.
 */
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { renderContractMarkdown } from '@/lib/contracts/markdown'
import { useT } from '@/components/i18n/locale-provider'
import {
  addUploadedContractAction,
  setContractPdfAction,
  deleteUploadedContractAction,
} from '@/app/(dashboard)/reservas/[id]/contract-file-actions'
import {
  FileText, Upload, Download, Loader2, Trash2, FileSignature, Printer, ScrollText, AlertCircle,
} from 'lucide-react'

export type ContractItem = {
  id: string
  kind: string
  title: string | null
  status: string
  is_uploaded: boolean
  original_filename: string | null
  pdf_url: string | null
  pdf_generated_at: string | null
  body_html: string | null
  signature_breeder_name: string | null
  signature_client_name: string | null
  signed_at_breeder: string | null
  signed_at_client: string | null
  signature_breeder_ip: string | null
  signature_client_ip: string | null
}

const CPX_CSS = `
.cpx-doc{max-width:720px;margin:0 auto;padding:40px 36px;color:#1a1a1a;background:#fff;font:15px/1.65 ui-serif,Georgia,'Times New Roman',serif;overflow-wrap:anywhere;}
.cpx-doc h1{font-size:22px;text-align:center;margin:0 0 4px;}
.cpx-doc h2{font-size:16px;margin:24px 0 6px;border-bottom:1px solid #ddd;padding-bottom:3px;}
.cpx-doc h3{font-size:14px;margin:16px 0 4px;}
.cpx-doc p{margin:8px 0;text-align:justify;}
.cpx-doc ul,.cpx-doc ol{margin:8px 0;padding-left:22px;}
.cpx-doc li{margin:3px 0;}
.cpx-doc hr{border:none;border-top:1px solid #ccc;margin:16px 0;}
.cpx-doc strong{font-weight:700;}
.cpx-sign{display:flex;gap:40px;margin-top:44px;}
.cpx-sign>div{flex:1;border-top:1px solid #333;padding-top:8px;}
.cpx-l{font-size:11px;text-transform:uppercase;letter-spacing:.6px;color:#777;}
.cpx-n{font-size:15px;font-weight:700;margin-top:4px;}
.cpx-m{font-size:11px;color:#888;margin-top:2px;}
.cpx-stamp{margin-top:24px;font-size:11px;color:#2a8a4a;text-align:center;border:1px solid #cfe9d6;background:#f3fbf5;border-radius:6px;padding:8px;}
`

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Genera el PDF de un contrato de Genealogic a partir de su markdown. */
async function buildContractPdfBlob(c: ContractItem): Promise<Blob> {
  const [{ jsPDF }, { default: html2canvas }] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ])
  const fmt = (d: string | null) => (d ? new Date(d).toLocaleString('es-ES') : '—')
  const body = c.body_html ? renderContractMarkdown(c.body_html) : ''
  const container = document.createElement('div')
  container.setAttribute('aria-hidden', 'true')
  container.style.cssText = 'position:fixed;left:-10000px;top:0;width:720px;background:#ffffff;z-index:-1;'
  container.innerHTML =
    `<style>${CPX_CSS}</style>` +
    `<div class="cpx-doc"><article>${body}</article>` +
    `<section class="cpx-sign">` +
    `<div><div class="cpx-l">Por el criadero</div><div class="cpx-n">${esc(c.signature_breeder_name || '—')}</div><div class="cpx-m">${fmt(c.signed_at_breeder)}${c.signature_breeder_ip ? ` · IP ${esc(c.signature_breeder_ip)}` : ''}</div></div>` +
    `<div><div class="cpx-l">El cliente</div><div class="cpx-n">${esc(c.signature_client_name || '—')}</div><div class="cpx-m">${fmt(c.signed_at_client)}${c.signature_client_ip ? ` · IP ${esc(c.signature_client_ip)}` : ''}</div></div>` +
    `</section>` +
    (c.status === 'signed_full' ? `<p class="cpx-stamp">Documento firmado electrónicamente por ambas partes. Copia con validez probatoria.</p>` : '') +
    `</div>`
  document.body.appendChild(container)
  try {
    const target = container.querySelector('.cpx-doc') as HTMLElement
    const canvas = await html2canvas(target, { scale: 2, backgroundColor: '#ffffff' })
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageW = 210, pageH = 297
    const imgW = pageW
    const imgH = (canvas.height * imgW) / canvas.width
    const imgData = canvas.toDataURL('image/jpeg', 0.92)
    let heightLeft = imgH
    let position = 0
    pdf.addImage(imgData, 'JPEG', 0, position, imgW, imgH)
    heightLeft -= pageH
    while (heightLeft > 0) {
      position -= pageH
      pdf.addPage()
      pdf.addImage(imgData, 'JPEG', 0, position, imgW, imgH)
      heightLeft -= pageH
    }
    return pdf.output('blob')
  } finally {
    document.body.removeChild(container)
  }
}

export default function ReservationContracts({
  reservationId, kennelId, contracts,
}: {
  reservationId: string
  kennelId: string
  contracts: ContractItem[]
}) {
  const t = useT()
  const router = useRouter()
  const [busy, setBusy] = useState<Record<string, boolean>>({})
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const autoStarted = useRef(false)

  const supabase = () => createClient()

  async function generate(c: ContractItem) {
    setBusy((b) => ({ ...b, [c.id]: true }))
    setError(null)
    try {
      const blob = await buildContractPdfBlob(c)
      const path = `${kennelId}/${reservationId}/${c.id}.pdf`
      const { error: upErr } = await supabase().storage.from('contracts').upload(path, blob, {
        contentType: 'application/pdf', upsert: true,
      })
      if (upErr) throw new Error(upErr.message)
      const res = await setContractPdfAction(c.id, reservationId, path)
      if (!res.ok) throw new Error(res.error)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : t('No se pudo generar el PDF'))
    } finally {
      setBusy((b) => ({ ...b, [c.id]: false }))
    }
  }

  // Autogenera UNA vez el PDF de los contratos de Genealogic ya FIRMADOS que
  // todavía no tienen PDF guardado. Al hacer router.refresh() vuelven con
  // pdf_url y no se re-generan.
  useEffect(() => {
    if (autoStarted.current) return
    const pending = contracts.filter((c) => !c.is_uploaded && c.status === 'signed_full' && !c.pdf_url && c.body_html)
    if (pending.length === 0) return
    autoStarted.current = true
    ;(async () => { for (const c of pending) await generate(c) })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contracts])

  async function view(c: ContractItem) {
    if (!c.pdf_url) return
    setError(null)
    const { data, error: e } = await supabase().storage.from('contracts').createSignedUrl(c.pdf_url, 3600)
    if (e || !data) { setError(e?.message || t('No se pudo abrir el PDF')); return }
    window.open(data.signedUrl, '_blank', 'noopener')
  }

  async function onFile(file: File) {
    if (file.type !== 'application/pdf') { setError(t('Solo se admiten PDF')); return }
    if (file.size > 15 * 1024 * 1024) { setError(t('El PDF supera los 15 MB')); return }
    setUploading(true); setError(null)
    try {
      const path = `${kennelId}/${reservationId}/${crypto.randomUUID()}.pdf`
      const { error: upErr } = await supabase().storage.from('contracts').upload(path, file, {
        contentType: 'application/pdf', upsert: false,
      })
      if (upErr) throw new Error(upErr.message)
      const res = await addUploadedContractAction({ reservationId, path, filename: file.name })
      if (!res.ok) throw new Error(res.error)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : t('No se pudo subir el contrato'))
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function del(c: ContractItem) {
    if (!window.confirm(t('¿Eliminar este contrato subido?'))) return
    setBusy((b) => ({ ...b, [c.id]: true }))
    try {
      if (c.pdf_url) await supabase().storage.from('contracts').remove([c.pdf_url]).catch(() => {})
      const res = await deleteUploadedContractAction(c.id, reservationId)
      if (!res.ok) throw new Error(res.error)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : t('No se pudo eliminar'))
    } finally {
      setBusy((b) => ({ ...b, [c.id]: false }))
    }
  }

  const typeLabel = (c: ContractItem) =>
    c.is_uploaded ? t('Subido') : c.kind === 'delivery' || c.kind === 'purchase' ? t('Entrega') : t('Reserva')
  const statusLabel = (s: string) =>
    s === 'signed_full' ? t('Firmado') : s === 'draft' ? t('Borrador') : s === 'cancelled' ? t('Cancelado') : t('Enviado')

  return (
    <div className="space-y-3">
      {contracts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-hairline bg-surface-soft/40 px-5 py-6 text-center">
          <FileText className="mx-auto h-7 w-7 text-muted" />
          <p className="mt-2 text-[13.5px] text-body">{t('Aún no hay contratos en esta reserva.')}</p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <a
              href={`/reservas/${reservationId}/contrato`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3.5 py-2 text-[13px] font-semibold text-on-primary hover:opacity-90"
            >
              <ScrollText className="h-3.5 w-3.5" /> {t('Crear contrato en Genealogic')}
            </a>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-canvas px-3.5 py-2 text-[13px] font-medium text-body hover:bg-surface-soft"
            >
              <Upload className="h-3.5 w-3.5" /> {t('Subir contrato firmado (PDF)')}
            </button>
          </div>
        </div>
      ) : (
        <ul className="space-y-2">
          {contracts.map((c) => {
            const isBusy = !!busy[c.id]
            const hasPdf = !!c.pdf_url
            const canGenerate = !c.is_uploaded && !hasPdf && c.status === 'signed_full' && !!c.body_html
            return (
              <li
                key={c.id}
                className="flex items-center gap-3 rounded-xl border border-hairline bg-canvas p-3 sm:p-3.5"
              >
                <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${hasPdf ? 'bg-[color:var(--brand-soft)]' : 'bg-surface-soft'}`}>
                  {c.is_uploaded ? <FileText className="h-4 w-4 text-[color:var(--brand)]" /> : <FileSignature className={`h-4 w-4 ${hasPdf ? 'text-[color:var(--brand)]' : 'text-muted'}`} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold text-ink">{c.title || t('Contrato')}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11.5px] text-muted">
                    <span className="rounded bg-surface-soft px-1.5 py-0.5 font-medium">{typeLabel(c)}</span>
                    <span className={c.status === 'signed_full' ? 'text-emerald-700 font-medium' : ''}>{statusLabel(c.status)}</span>
                    {c.pdf_generated_at && hasPdf && <span className="hidden sm:inline">· PDF {new Date(c.pdf_generated_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' })}</span>}
                  </div>
                </div>
                <div className="flex flex-shrink-0 items-center gap-1.5">
                  {isBusy ? (
                    <span className="inline-flex items-center gap-1.5 px-2 text-[12px] text-muted"><Loader2 className="h-3.5 w-3.5 animate-spin" /> {t('Generando…')}</span>
                  ) : hasPdf ? (
                    <>
                      <button
                        type="button"
                        onClick={() => view(c)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-hairline bg-canvas px-2.5 py-1.5 text-[12px] font-medium text-body hover:bg-surface-soft hover:text-ink"
                      >
                        <Download className="h-3.5 w-3.5" /> <span className="hidden sm:inline">{t('Ver PDF')}</span>
                      </button>
                      {c.is_uploaded && (
                        <button
                          type="button"
                          onClick={() => del(c)}
                          title={t('Eliminar')}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-hairline bg-canvas text-muted hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </>
                  ) : canGenerate ? (
                    <button
                      type="button"
                      onClick={() => generate(c)}
                      className="inline-flex items-center gap-1.5 rounded-md bg-ink px-2.5 py-1.5 text-[12px] font-semibold text-on-primary hover:opacity-90"
                    >
                      <FileText className="h-3.5 w-3.5" /> {t('Generar PDF')}
                    </button>
                  ) : (
                    <a
                      href={`/reservas/${reservationId}/contrato`}
                      className="inline-flex items-center gap-1.5 rounded-md border border-hairline bg-canvas px-2.5 py-1.5 text-[12px] font-medium text-body hover:bg-surface-soft hover:text-ink"
                    >
                      <Printer className="h-3.5 w-3.5" /> <span className="hidden sm:inline">{t('Abrir')}</span>
                    </a>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {contracts.length > 0 && (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-hairline bg-surface-soft/50 px-3.5 py-2 text-[13px] font-medium text-body hover:bg-surface-soft disabled:opacity-60"
        >
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          {uploading ? t('Subiendo…') : t('Subir contrato firmado (PDF)')}
        </button>
      )}

      {error && (
        <p className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-[12.5px] text-rose-700">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" /> {error}
        </p>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="application/pdf"
        hidden
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f) }}
      />
    </div>
  )
}
