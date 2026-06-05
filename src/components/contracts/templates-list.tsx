/**
 * ContractTemplatesList — listado interactivo de plantillas en /contratos.
 *
 * Diseño:
 *  - Cards con icono lateral, kind chip prominente arriba a la derecha,
 *    preview de 2 líneas, footer compacto con acciones.
 *  - Las plantillas marcadas como default_for_kind salen con borde naranja
 *    + chip "Default · Reserva" / "Default · Entrega" prominente.
 *  - Toggle de default integrado en el footer (chip toggleable, no botón
 *    separado).
 *  - Empty state con CTA tanto para crear como para restaurar las 2
 *    plantillas default si el criador las borró.
 */
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  FileText, Star, Pencil, Trash2, Plus, Loader2, RotateCcw,
  Sparkles, Layers,
} from 'lucide-react'
import {
  createContractTemplate,
  deleteContractTemplate,
  setDefaultContractTemplate,
  seedDefaultContractTemplatesAction,
  type ContractTemplate,
} from '@/lib/contracts/templates-actions'
import { useT } from '@/components/i18n/locale-provider'

interface Props {
  initialTemplates: ContractTemplate[]
  kennelId: string
  kennelName: string
}

export default function ContractTemplatesList({ initialTemplates, kennelId, kennelName }: Props) {
  const t = useT()
  const router = useRouter()
  const [templates] = useState(initialTemplates)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleCreateBlank() {
    startTransition(async () => {
      try {
        const seed = SEED_BLANK_TEMPLATE.replace(/__KENNEL__/g, kennelName)
        const { id } = await createContractTemplate({
          kennelId,
          name: 'Nueva plantilla',
          bodyMd: seed,
        })
        router.push(`/contratos/${id}`)
      } catch (e) {
        alert((e as Error).message || t('Error creando la plantilla'))
      }
    })
  }

  async function handleSetDefault(id: string, kind: 'reservation' | 'delivery' | null) {
    setPendingId(id)
    startTransition(async () => {
      try {
        await setDefaultContractTemplate(id, kind)
        router.refresh()
      } catch (e) {
        alert((e as Error).message || t('Error marcando por defecto'))
      } finally {
        setPendingId(null)
      }
    })
  }

  async function handleDelete(id: string) {
    if (!confirm(t('¿Borrar esta plantilla? No se podrá recuperar.'))) return
    setPendingId(id)
    startTransition(async () => {
      try {
        await deleteContractTemplate(id)
        router.refresh()
      } catch (e) {
        alert((e as Error).message || t('Error borrando la plantilla'))
      } finally {
        setPendingId(null)
      }
    })
  }

  async function handleRestoreDefaults() {
    startTransition(async () => {
      const res = await seedDefaultContractTemplatesAction(kennelId)
      if (res.ok) router.refresh()
      else alert(res.error)
    })
  }

  // Orden: defaults primero (reservation → delivery), luego custom por updated_at
  const sorted = [...templates].sort((a, b) => {
    const aDef = a.default_for_kind === 'reservation' ? 0 : a.default_for_kind === 'delivery' ? 1 : 2
    const bDef = b.default_for_kind === 'reservation' ? 0 : b.default_for_kind === 'delivery' ? 1 : 2
    if (aDef !== bDef) return aDef - bDef
    return (b.updated_at || '').localeCompare(a.updated_at || '')
  })

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-[13px] text-body">
          <Layers className="h-4 w-4 text-muted" />
          {templates.length === 0
            ? t('Aún no tienes ninguna plantilla.')
            : <><span className="font-semibold text-ink">{templates.length}</span> {templates.length === 1 ? t('plantilla') : t('plantillas')}</>}
        </div>
        <button
          type="button"
          onClick={handleCreateBlank}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-xl bg-ink text-on-primary px-4 py-2.5 text-[13.5px] font-bold hover:opacity-90 disabled:opacity-50 transition shadow-sm"
        >
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          {t('Nueva plantilla')}
        </button>
      </div>

      {/* Listado o empty */}
      {templates.length === 0 ? (
        <EmptyState
          onCreate={handleCreateBlank}
          onRestore={handleRestoreDefaults}
          isPending={isPending}
          t={t}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {sorted.map(tpl => {
            const preview = extractPreview(tpl.body_md)
            const busy = pendingId === tpl.id && isPending
            const isDefault = tpl.default_for_kind != null
            return (
              <article
                key={tpl.id}
                className={`group relative rounded-2xl border bg-canvas p-5 flex flex-col gap-3 transition-all hover:shadow-md ${
                  isDefault
                    ? 'border-[#FE6620]/60 ring-1 ring-[#FE6620]/15 shadow-sm'
                    : 'border-hairline hover:border-ink/30'
                }`}
              >
                {isDefault && (
                  <span className="absolute top-3.5 right-3.5 inline-flex items-center gap-1 rounded-full bg-[#FE6620] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                    <Star className="h-2.5 w-2.5 fill-current" />
                    {tpl.default_for_kind === 'delivery' ? t('Entrega') : t('Reserva')}
                  </span>
                )}

                <div className="flex items-start gap-3 min-w-0">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl flex-shrink-0 ${
                    isDefault
                      ? 'bg-[#FE6620]/10 text-[#FE6620]'
                      : 'bg-surface-card text-ink'
                  }`}>
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1 pr-20">
                    <h3 className="text-[16px] font-semibold text-ink leading-tight truncate">
                      {tpl.name}
                    </h3>
                    <p className="mt-0.5 text-[11.5px] text-muted">
                      {t('Editada')} {formatRelativeDate(tpl.updated_at, t)}
                    </p>
                  </div>
                </div>

                {preview && (
                  <p className="text-[13px] text-body line-clamp-2 leading-snug">
                    {preview}
                  </p>
                )}

                {/* Footer: edit + default toggle + delete */}
                <div className="mt-auto pt-3 border-t border-hairline flex items-center gap-2 flex-wrap">
                  <Link
                    href={`/contratos/${tpl.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-surface-soft hover:bg-ink hover:text-on-primary px-3 py-1.5 text-[12.5px] font-semibold text-body transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" /> {t('Editar')}
                  </Link>

                  <DefaultKindToggle
                    current={tpl.default_for_kind}
                    busy={busy}
                    onChoose={(k) => handleSetDefault(tpl.id, k)}
                    t={t}
                  />

                  <button
                    type="button"
                    onClick={() => handleDelete(tpl.id)}
                    disabled={busy}
                    aria-label={t('Eliminar plantilla')}
                    title={t('Eliminar plantilla')}
                    className="ml-auto inline-flex items-center justify-center h-8 w-8 rounded-lg text-muted hover:text-rose-600 hover:bg-rose-50 disabled:opacity-50 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </>
  )
}

// ─── Empty state ───────────────────────────────────────────────────────────

function EmptyState({
  onCreate, onRestore, isPending, t,
}: { onCreate: () => void; onRestore: () => void; isPending: boolean; t: (k: string) => string }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-hairline bg-surface-soft/30 p-10 sm:p-14 text-center">
      <div className="mx-auto h-14 w-14 rounded-2xl bg-canvas border border-hairline flex items-center justify-center text-ink shadow-sm">
        <FileText className="h-6 w-6" />
      </div>
      <p className="mt-5 text-[17px] font-bold text-ink">{t('Sin plantillas todavía')}</p>
      <p className="mt-2 text-[13.5px] text-body max-w-md mx-auto leading-snug">
        {t('Las plantillas por defecto de Genealogic (reserva + entrega) se crean automáticamente al entrar aquí. Si las borraste, puedes restaurarlas:')}
      </p>
      <div className="mt-6 flex items-center justify-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={onRestore}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-xl bg-ink text-on-primary px-5 py-2.5 text-[13.5px] font-bold hover:opacity-90 disabled:opacity-50 transition"
        >
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {t('Restaurar plantillas por defecto')}
        </button>
        <button
          type="button"
          onClick={onCreate}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-xl border border-hairline bg-canvas hover:bg-surface-soft px-4 py-2.5 text-[13px] font-semibold text-body transition disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" />
          {t('Crear en blanco')}
        </button>
      </div>
    </div>
  )
}

/**
 * Toggle de "Marcar como default para X kind". Es un grupo de dos chips
 * activos/inactivos para cada kind (reserva / entrega) que permite al
 * criador marcar una plantilla como la default de uno, ambos, o ninguno.
 * Cliquear sobre la chip activa la desmarca (toggle).
 */
function DefaultKindToggle({
  current, busy, onChoose, t,
}: {
  current: 'reservation' | 'delivery' | null
  busy: boolean
  onChoose: (kind: 'reservation' | 'delivery' | null) => void
  t: (k: string) => string
}) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg bg-surface-soft p-0.5 border border-hairline">
      <KindChip
        active={current === 'reservation'}
        busy={busy}
        onClick={() => onChoose(current === 'reservation' ? null : 'reservation')}
        label={t('Reserva')}
      />
      <KindChip
        active={current === 'delivery'}
        busy={busy}
        onClick={() => onChoose(current === 'delivery' ? null : 'delivery')}
        label={t('Entrega')}
      />
    </div>
  )
}

function KindChip({
  active, busy, onClick, label,
}: { active: boolean; busy: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      title={active ? 'Default actual — clic para desmarcar' : 'Marcar como default para este kind'}
      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11.5px] font-semibold transition-colors disabled:opacity-50 ${
        active
          ? 'bg-[#FE6620] text-white shadow-sm'
          : 'text-muted hover:text-ink hover:bg-canvas'
      }`}
    >
      {busy && active ? <Loader2 className="h-3 w-3 animate-spin" /> : <Star className={`h-3 w-3 ${active ? 'fill-current' : ''}`} />}
      {label}
    </button>
  )
}

/** Extrae 2 líneas de preview saltando títulos Markdown y separadores. */
function extractPreview(md: string): string {
  const lines = md
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#') && !l.startsWith('---') && !l.startsWith('**Entre') && !l.startsWith('<!--'))
  const joined = lines.slice(0, 2).join(' ')
  return joined.length > 200 ? joined.slice(0, 200) + '…' : joined
}

function formatRelativeDate(iso: string, t: (k: string) => string): string {
  const d = new Date(iso)
  const now = Date.now()
  const diffMs = now - d.getTime()
  const min = Math.floor(diffMs / 60000)
  if (min < 1) return t('ahora mismo')
  if (min < 60) return `${t('hace')} ${min} min`
  const hours = Math.floor(min / 60)
  if (hours < 24) return `${t('hace')} ${hours} h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${t('hace')} ${days} ${days === 1 ? t('día') : t('días')}`
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Modelo en blanco mínimo para "Crear nueva plantilla" — solo con la
 *  estructura básica (REUNIDOS + ACUERDAN + firma). El criador rellena
 *  el resto. */
const SEED_BLANK_TEMPLATE = `# Título de tu plantilla

En {{signCity}}, a {{todayDate}}

**REUNIDOS**

De una parte, **{{legalName}}**, con CIF/NIF {{legalId}} y domicilio en {{legalAddress}}, representada por D./Dª {{representative}} con DNI {{representativeId}} (en adelante, el **Criador**).

Y de otra parte, D./Dª **{{clientName}}**, con DNI/NIE {{clientId}} y domicilio en {{clientAddress}} (en adelante, el **Cliente**).

Reunidos a fecha **{{todayDate}}**, las partes acuerdan los siguientes términos.

---

## 1. Objeto

Describe aquí el objeto del contrato.

## 2. Precio

- **Precio total:** {{totalPrice}}
- **Señal:** {{depositAmount}}

## 3. Otras condiciones

Añade aquí las cláusulas que necesites. Usa los tokens {{...}} de arriba para datos dinámicos.

---

**Firmado en {{signCity}}, a {{todayDate}}.**
`
