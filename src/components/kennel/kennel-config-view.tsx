'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Edit, Globe, ExternalLink, Settings, Camera, Loader2, Dog, Heart, Baby,
  Eye, Key, Link2, ArrowRight,
} from 'lucide-react'
import KennelEditPanel from './kennel-edit-panel'
import PublicViewToggle from './public-view-toggle'

interface Props {
  kennel: any
  stats: {
    dogs: number
    visible: number
    reproductive: number
    litters: number
  }
  hasCustomWeb?: boolean
  isPro?: boolean
  userId: string
}

/**
 * Vista de "Mi criadero" reducida a CONFIGURACIÓN y ATAJOS.
 * Sustituye al KennelDashboard antiguo que duplicaba la lista de perros
 * de /dogs. Aquí solo se muestran KPIs + cards de acción.
 */
export default function KennelConfigView({ kennel, stats, hasCustomWeb = false, isPro = false, userId }: Props) {
  const router = useRouter()
  const [showEdit, setShowEdit] = useState(false)
  const [uploading, setUploading] = useState(false)
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

  const kpiCards = [
    { label: 'Perros', value: stats.dogs, icon: Dog, href: '/dogs', color: '#fb923c' },
    { label: 'Visibles en el criadero', value: stats.visible, icon: Eye, href: '/dogs', color: '#34d399' },
    { label: 'Reproductores', value: stats.reproductive, icon: Heart, href: '/dogs?tab=reproductive', color: '#ec4899' },
    { label: 'Camadas', value: stats.litters, icon: Baby, href: '/litters', color: '#8b5cf6' },
  ]

  const actionCards = [
    {
      label: 'Editar datos del criadero',
      desc: 'Nombre, afijo, descripción, ubicación, redes sociales.',
      icon: Edit,
      onClick: () => setShowEdit(true),
    },
    {
      label: 'Web pública',
      desc: 'Diseña la web pública del criadero.',
      icon: Globe,
      href: '/web',
    },
    {
      label: 'Dominio personalizado',
      desc: 'Conecta tu dominio propio (criadero.com).',
      icon: Link2,
      href: '/cuenta/dominio',
      requiresPro: true,
    },
    {
      label: 'API keys',
      desc: 'Tokens para integrar datos con servicios externos.',
      icon: Key,
      href: '/kennel/api',
    },
    {
      label: 'Ver perfil público',
      desc: 'Ver el criadero como lo verá cualquier visitante.',
      icon: ExternalLink,
      href: publicUrl,
      external: true,
    },
  ]

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* PageHeader */}
      <div>
        <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted">Mi cuenta</p>
        <h1 className="mt-1.5 text-[32px] sm:text-[40px] font-semibold leading-[1.1] tracking-[-0.04em] text-ink">
          Mi criadero
        </h1>
        <p className="mt-2 text-[14px] text-body">
          Configura los datos públicos de tu criadero y accede a las herramientas avanzadas.
        </p>
      </div>

      {/* Kennel header card */}
      <section className="flex flex-col gap-4 rounded-2xl border border-hairline bg-canvas p-5 sm:flex-row sm:items-center">
        <div className="relative h-16 w-16 flex-shrink-0">
          {kennel.logo_url ? (
            <img
              src={kennel.logo_url}
              alt={kennel.name}
              className="h-full w-full rounded-2xl object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-2xl bg-surface-card">
              <Settings className="h-6 w-6 text-muted" />
            </div>
          )}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-on-primary shadow-sm transition-colors hover:opacity-90 disabled:opacity-50"
            title="Cambiar logo"
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
              Afijo: {kennel.affix}
            </p>
          )}
          {kennel.description && (
            <p className="mt-1 text-[13px] text-body line-clamp-2">{kennel.description}</p>
          )}
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          {publicUrl && (
            <Link
              href={publicUrl}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-canvas px-3 py-2 text-[12.5px] font-medium text-body transition-colors hover:bg-surface-soft"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Ver
            </Link>
          )}
          <button
            onClick={() => setShowEdit(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-2 text-[12.5px] font-medium text-on-primary transition-colors hover:opacity-90"
          >
            <Edit className="h-3.5 w-3.5" /> Editar
          </button>
        </div>
      </section>

      {/* Toggle vista pública por defecto — incentivo Pro */}
      <PublicViewToggle
        kennelId={kennel.id}
        kennelSlug={kennel.slug || null}
        current={kennel.default_public_view || 'standard'}
        hasCustomWeb={hasCustomWeb}
        isPro={isPro}
      />

      {/* KPIs (clickables → llevan a /dogs y /litters, NO duplican listas aquí) */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Link
              key={kpi.label}
              href={kpi.href}
              className="group rounded-xl border border-hairline bg-canvas p-4 transition-colors hover:bg-surface-soft"
            >
              <div className="flex items-center justify-between">
                <Icon className="h-4 w-4" style={{ color: kpi.color }} />
                <ArrowRight className="h-3.5 w-3.5 text-muted opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <p className="mt-3 text-[28px] font-semibold leading-none tabular-nums tracking-[-0.04em] text-ink">
                {kpi.value}
              </p>
              <p className="mt-2 text-[12.5px] text-muted">{kpi.label}</p>
            </Link>
          )
        })}
      </section>

      {/* Acciones avanzadas */}
      <section>
        <h2 className="mb-4 text-[18px] font-semibold tracking-[-0.02em] text-ink">Herramientas del criadero</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {actionCards.map((a) => {
            const Icon = a.icon
            const inner = (
              <>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-card">
                  <Icon className="h-4 w-4 text-ink" />
                </div>
                <div className="mt-3">
                  <p className="text-[14px] font-medium text-ink">{a.label}</p>
                  <p className="mt-0.5 text-[12.5px] text-body">{a.desc}</p>
                </div>
              </>
            )
            const cls = 'block rounded-xl border border-hairline bg-canvas p-4 transition-colors hover:bg-surface-soft'
            if (a.onClick) {
              return (
                <button key={a.label} onClick={a.onClick} className={`${cls} text-left w-full`}>
                  {inner}
                </button>
              )
            }
            if (!a.href) return null
            return (
              <Link
                key={a.label}
                href={a.href}
                target={a.external ? '_blank' : undefined}
                rel={a.external ? 'noopener' : undefined}
                className={cls}
              >
                {inner}
              </Link>
            )
          })}
        </div>
      </section>

      {/* Edit panel */}
      <KennelEditPanel
        kennel={kennel}
        open={showEdit}
        onClose={() => {
          setShowEdit(false)
          router.refresh()
        }}
      />
      {/* userId silenciado para evitar warning de no-uso */}
      {false && <span data-user-id={userId} />}
    </div>
  )
}
