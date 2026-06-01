'use client'

import { useState } from 'react'
import { Globe, Check, AlertCircle, Trash2, RefreshCw, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useT } from '@/components/i18n/locale-provider'

interface Props {
  kennelId: string
  kennelSlug: string
  kennelName: string
  initialDomain: string | null
  initialVerified: boolean
  addedAt: string | null
}

export default function DomainClient({ kennelId, kennelSlug, kennelName, initialDomain, initialVerified, addedAt }: Props) {
  const t = useT()
  const [domain, setDomain] = useState<string | null>(initialDomain)
  const [verified, setVerified] = useState(initialVerified)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dnsInfo, setDnsInfo] = useState<any>(null)

  async function connect() {
    setError(null)
    const clean = input.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '')
    if (!/^[a-z0-9][a-z0-9.-]+\.[a-z]{2,}$/.test(clean)) {
      setError(t('Dominio inválido. Ejemplo: iremacurto.com'))
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/domain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kennel_id: kennelId, domain: clean }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || t('Error conectando dominio'))
      setDomain(clean)
      setVerified(Boolean(data.verified))
      setDnsInfo(data.dns || null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function recheck() {
    if (!domain) return
    setLoading(true); setError(null)
    try {
      const res = await fetch(`/api/domain?check=${encodeURIComponent(domain)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || t('Error verificando'))
      setVerified(Boolean(data.verified))
      setDnsInfo(data.dns || null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function disconnect() {
    if (!domain) return
    if (!confirm(`${t('¿Desconectar')} ${domain}? ${t('La web volverá a estar en')} /c/${kennelSlug}.`)) return
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/domain', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kennel_id: kennelId, domain }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || t('Error desconectando'))
      setDomain(null); setVerified(false); setDnsInfo(null); setInput('')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function copyValue(v: string) {
    navigator.clipboard.writeText(v)
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ink tracking-tight flex items-center gap-2">
          <Globe className="w-6 h-6 text-muted" />
          {t('Dominio personalizado')}
        </h1>
        <p className="text-sm text-muted mt-0.5">
          {t('Conecta tu propio dominio (p.ej.')} <code className="text-[12px]">iremacurto.com</code>) {t('a la web pública de tu criadero.')}
        </p>
      </div>

      {/* Current domain */}
      {domain ? (
        <div className={`rounded-2xl border p-6 mb-6 ${verified ? 'border-ink' : 'border-yellow-300/60 bg-yellow-50/30'}`}>
          <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted mb-1">{t('Dominio conectado')}</p>
              <div className="flex items-center gap-3 flex-wrap">
                <p className="text-2xl font-bold text-ink">{domain}</p>
                {verified ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.06em] bg-ink text-on-primary rounded-full px-2 py-0.5">
                    <Check className="w-3 h-3" /> {t('Verificado')}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.06em] bg-yellow-200/60 text-yellow-900 rounded-full px-2 py-0.5">
                    <AlertCircle className="w-3 h-3" /> {t('Pendiente DNS')}
                  </span>
                )}
              </div>
              {addedAt && (
                <p className="text-xs text-muted mt-2">
                  {t('Añadido el')} {new Date(addedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={recheck} disabled={loading}>
                <RefreshCw className="w-3.5 h-3.5" />
                {t('Verificar')}
              </Button>
              <Button variant="ghost" size="sm" onClick={disconnect} disabled={loading}>
                <Trash2 className="w-3.5 h-3.5" />
                {t('Desconectar')}
              </Button>
            </div>
          </div>

          {verified ? (
            <p className="text-sm text-body">
              {t('Tu sitio está sirviéndose en')}{' '}
              <a href={`https://${domain}`} target="_blank" rel="noopener noreferrer" className="text-ink underline">
                https://{domain}
              </a>{' '}
              {t('con SSL automático.')}
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-body">
                {t('Añade estos registros DNS en tu proveedor (Namecheap, GoDaddy, Cloudflare, etc.):')}
              </p>
              <div className="bg-canvas border border-hairline rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="border-b border-hairline">
                    <tr className="text-left">
                      <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">{t('Tipo')}</th>
                      <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">{t('Nombre')}</th>
                      <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">{t('Valor')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dnsRows(domain).map((r, i) => (
                      <tr key={i} className={i > 0 ? 'border-t border-hairline' : ''}>
                        <td className="px-3 py-2 font-mono text-[12px] text-ink">{r.type}</td>
                        <td className="px-3 py-2 font-mono text-[12px] text-ink">{r.name}</td>
                        <td className="px-3 py-2 font-mono text-[12px] text-body">
                          <span className="inline-flex items-center gap-1.5">
                            {r.value}
                            <button onClick={() => copyValue(r.value)} className="text-muted hover:text-ink transition">
                              <Copy className="w-3 h-3" />
                            </button>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted">
                {t('Después de añadir los registros, pulsa "Verificar". Puede tardar de 5 minutos a 24h en propagar.')}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-hairline bg-canvas p-6 mb-6">
          <p className="text-sm font-semibold text-ink mb-1">{t('Conecta tu dominio')}</p>
          <p className="text-sm text-muted mb-4">
            {t('Introduce el dominio raíz o subdominio que quieras usar para tu sitio público.')}
          </p>
          <form onSubmit={e => { e.preventDefault(); connect() }} className="flex gap-2 flex-wrap">
            <input
              type="text" value={input} onChange={e => setInput(e.target.value)}
              placeholder="iremacurto.com"
              className="flex-1 min-w-[260px] px-3 py-2 text-sm border border-hairline rounded-lg bg-canvas text-ink placeholder:text-muted focus:outline-none focus:border-ink"
              disabled={loading}
            />
            <Button variant="primary" size="md" type="submit" disabled={loading || !input.trim()}>
              {loading ? t('Conectando…') : t('Conectar')}
            </Button>
          </form>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-6">
          {error}
        </div>
      )}

      {/* Setup notes */}
      <div className="rounded-xl border border-hairline bg-surface-card p-5">
        <p className="text-sm font-semibold text-ink mb-2">{t('Cómo funciona')}</p>
        <ol className="text-sm text-body space-y-1.5 list-decimal pl-5">
          <li>{t('Introduce tu dominio (ej.')} <code className="text-[12px] bg-canvas border border-hairline rounded px-1">{kennelName.toLowerCase().replace(/\s+/g, '')}.com</code>).</li>
          <li>{t('Añade los registros DNS que aparecerán en tu panel de dominio.')}</li>
          <li>{t('Verifica — el certificado SSL se emite automáticamente en cuanto el DNS propague.')}</li>
          <li>{t('Las visitas a')} <code className="text-[12px] bg-canvas border border-hairline rounded px-1">tudominio.com</code> {t('sirven tu sitio público de Genealogic, con tu marca.')}</li>
        </ol>
        <p className="text-xs text-muted mt-3">
          {t('Requiere env vars')} <code className="text-[11px] bg-canvas border border-hairline rounded px-1">VERCEL_PROJECT_ID</code> {t('y')} <code className="text-[11px] bg-canvas border border-hairline rounded px-1">VERCEL_API_TOKEN</code> {t('configuradas en Vercel.')}
        </p>
      </div>
    </div>
  )
}

function dnsRows(domain: string): { type: string; name: string; value: string }[] {
  const isApex = domain.split('.').length === 2  // grosso modo: example.com vs sub.example.com
  if (isApex) {
    return [
      { type: 'A', name: '@', value: '76.76.21.21' },
      { type: 'CNAME', name: 'www', value: 'cname.vercel-dns.com' },
    ]
  }
  // Subdomain
  const sub = domain.split('.')[0]
  return [
    { type: 'CNAME', name: sub, value: 'cname.vercel-dns.com' },
  ]
}
