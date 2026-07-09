'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Edit, Globe, ExternalLink, Camera, Loader2, Dog, Baby,
  Eye, Heart, Key, Link2, ArrowRight, Inbox, CreditCard, TrendingUp,
  ChevronDown, Pencil, Sparkles, ShieldCheck,
} from 'lucide-react'
import KennelEditPanel from './kennel-edit-panel'
import ContactFormBuilder from './contact-form-builder'
import { Img } from '@/components/ui/img'
import { useT } from '@/components/i18n/locale-provider'
import { isInsider } from '@/lib/features/launch'

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  kennel: any
  stats: {
    dogs: number
    visible: number
    reproductive: number
    litters: number
  }
  isPro?: boolean
  userId: string
}

/**
 * Vista de "Mi criadero" — versión limpia.
 *
 * Estructura:
 *   1) Header card con logo + nombre + Editar (sin botón "Ver" duplicado)
 *   2) Sección "Tu web pública" prominente con CTA a /kennel/contenido
 *   3) KPIs compactos (strip horizontal, no 4 cards gigantes)
 *   4) Herramientas avanzadas (disclosure colapsable, no peso visual por
 *      defecto): Formulario de contacto · Visitas · Dominio · Pagos · API keys
 *
 * Eliminadas redundancias:
 *   - Card "Web pública → /web" (builder antiguo) → reemplazada por sección
 *     prominente que apunta a /kennel/contenido (editor nuevo)
 *   - Card "Ver perfil público" → ya hay link en la sección "Tu web"
 *   - Botón "Ver" del header card → ya hay CTA en "Tu web"
 *   - userId silencer hack
 */
export default function KennelConfigView({ kennel, stats, isPro = false, userId }: Props) {
  const t = useT()
  const router = useRouter()
  const [showEdit, setShowEdit] = useState(false)
  const [showFormBuilder, setShowFormBuilder] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)

    const supabase = createClient()
    const path = `${kennel.id}/logo.webp`

    const img = new Image()
    img.onload = async () => {
      const canvas = document.createElement('canvas')
      canvas.width = 400
      canvas.height = 400
      const ctx = canvas.getContext('2d')!
      const size = Math.min(img.width, img.height)
      const sx = (img.width - size) / 2
      const sy = (img.height - size) / 2
      ctx.drawImage(img, sx, sy, size, size, 0, 0, 400, 400)

      canvas.toBlob(async (blob) => {
        if (!blob) { setUploading(false); return }
        await supabase.storage.from('kennels').upload(path, blob, { contentType: 'image/webp', upsert: true })
        const { data: pub } = supabase.storage.from('kennels').getPublicUrl(path)
        const url = pub.publicUrl + '?t=' + Date.now()
        await supabase.from('kennels').update({ logo_url: url }).eq('id', kennel.id)
        setUploading(false)
        router.refresh()
      }, 'image/webp', 0.85)
    }
    img.src = URL.createObjectURL(file)
  }

  const publicUrl = kennel.slug ? `/kennels/${kennel.slug}` : null

  const kpis = [
    { label: t('Perros'), value: stats.dogs, icon: Dog, href: '/dogs', color: '#fb923c' },
    { label: t('Visibles'), value: stats.visible, icon: Eye, href: '/dogs', color: '#34d399' },
    { label: t('Reproductores'), value: stats.reproductive, icon: Heart, href: '/dogs?tab=reproductive', color: '#ec4899' },
    { label: t('Camadas'), value: stats.litters, icon: Baby, href: '/litters', color: '#8b5cf6' },
  ]

  // Herramientas avanzadas — solo las que aportan, agrupadas
  const advancedTools = [
    {
      label: t('Datos legales'),
      desc: t('Razón social, NIF, domicilio y representante. Se rellenan automáticamente en tus contratos.'),
      icon: ShieldCheck,
      href: '/kennel/legal',
    },
    {
      label: t('Formulario de contacto'),
      desc: t('Personaliza las preguntas que ven los visitantes (plantilla + campos custom).'),
      icon: Inbox,
      onClick: () => setShowFormBuilder(true),
    },
    {
      label: t('Visitas a la web'),
      desc: t('Analíticas de tráfico, países, dispositivos y páginas más vistas.'),
      icon: TrendingUp,
      href: '/visitas',
    },
    // API keys: uso interno (founder / insiders) — no publicitado.
    ...(isInsider(userId) ? [{
      label: t('API keys'),
      desc: t('Tokens para integrar datos con servicios externos.'),
      icon: Key,
      href: '/kennel/api',
    }] : []),
  ]

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page header */}
      <div>
        <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted">{t('Mi cuenta')}</p>
        <h1 className="mt-1.5 text-[32px] sm:text-[40px] font-semibold leading-[1.1] tracking-[-0.04em] text-ink">
          {t('Mi criadero')}
        </h1>
        <p className="mt-2 text-[14px] text-body">
          {t('Datos del criadero, contenido público y herramientas.')}
        </p>
      </div>

      {/* ═══ Identidad ═══ */}
      <section className="flex flex-col gap-4 rounded-2xl border border-hairline bg-canvas p-5 sm:flex-row sm:items-center">
        <div className="relative h-16 w-16 flex-shrink-0">
          {kennel.logo_url ? (
            <Img w={200} src={kennel.logo_url} alt={kennel.name} className="h-full w-full rounded-2xl object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-2xl bg-surface-card text-muted text-xl font-semibold">
              {kennel.name?.[0]?.toUpperCase() || '?'}
            </div>
          )}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-on-primary shadow-sm transition-colors hover:opacity-90 disabled:opacity-50"
            title={t('Cambiar logo')}
          >
            {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoUpload}
          />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[18px] font-semibold tracking-[-0.02em] text-ink">{kennel.name}</h2>
          {kennel.affix && (
            <p className="mt-0.5 text-[12px] font-medium uppercase tracking-wider text-muted">
              {t('Afijo:')} {kennel.affix}
            </p>
          )}
          {kennel.description && (
            <p className="mt-1 text-[13px] text-body line-clamp-2">{kennel.description}</p>
          )}
        </div>
        <button
          onClick={() => setShowEdit(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3.5 py-2 text-[12.5px] font-medium text-on-primary transition-colors hover:opacity-90 flex-shrink-0"
        >
          <Edit className="h-3.5 w-3.5" /> {t('Editar datos')}
        </button>
      </section>

      {/* Enlace simple a ver el perfil público */}
      {publicUrl && (
        <Link
          href={publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-canvas px-3.5 py-2 text-[12.5px] font-medium text-body hover:border-ink/30 hover:text-ink transition self-start"
        >
          <ExternalLink className="h-3.5 w-3.5" /> {t('Ver mi perfil público')}
        </Link>
      )}

      {/* ═══ KPIs compactos ═══ — strip de 4 con números pequeños */}
      <section>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {kpis.map(kpi => {
            const Icon = kpi.icon
            return (
              <Link
                key={kpi.label}
                href={kpi.href}
                className="group rounded-xl border border-hairline bg-canvas p-3 sm:p-3.5 transition-colors hover:bg-surface-soft"
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5" style={{ color: kpi.color }} />
                  <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted truncate">
                    {kpi.label}
                  </p>
                </div>
                <p className="mt-1 text-[22px] sm:text-[24px] font-semibold leading-none tabular-nums tracking-[-0.03em] text-ink">
                  {kpi.value.toLocaleString('es-ES')}
                </p>
              </Link>
            )
          })}
        </div>
      </section>

      {/* ═══ Herramientas avanzadas (collapsible) ═══ */}
      <section>
        <button
          onClick={() => setAdvancedOpen(o => !o)}
          className="flex w-full items-center justify-between gap-3 rounded-xl border border-hairline bg-canvas px-4 py-3 hover:bg-surface-soft transition-colors"
        >
          <div className="text-left">
            <p className="text-[14px] font-semibold text-ink">{t('Herramientas avanzadas')}</p>
            <p className="text-[12px] text-muted">
              {t('Formulario de contacto, datos legales y analíticas.')}
            </p>
          </div>
          <ChevronDown
            className={`h-4 w-4 text-muted flex-shrink-0 transition-transform ${advancedOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {advancedOpen && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {advancedTools.map(a => {
              const Icon = a.icon
              const inner = (
                <>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-card">
                    <Icon className="h-4 w-4 text-ink" />
                  </div>
                  <div className="mt-3">
                    <p className="text-[13.5px] font-medium text-ink">{a.label}</p>
                    <p className="mt-0.5 text-[12px] text-body leading-snug">{a.desc}</p>
                  </div>
                </>
              )
              const cls = 'block rounded-xl border border-hairline bg-canvas p-4 transition-colors hover:bg-surface-soft'
              if ('onClick' in a && a.onClick) {
                return (
                  <button key={a.label} onClick={a.onClick} className={`${cls} text-left w-full`}>
                    {inner}
                  </button>
                )
              }
              if (!('href' in a) || !a.href) return null
              return (
                <Link key={a.label} href={a.href} className={cls}>
                  {inner}
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* Modals */}
      <KennelEditPanel
        kennel={kennel}
        open={showEdit}
        onClose={() => {
          setShowEdit(false)
          router.refresh()
        }}
      />
      {showFormBuilder && (
        <ContactFormBuilder
          kennelId={kennel.id}
          initialConfig={kennel.contact_form_config || null}
          onClose={() => setShowFormBuilder(false)}
        />
      )}
    </div>
  )
}
