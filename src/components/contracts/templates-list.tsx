/**
 * ContractTemplatesList — listado interactivo de plantillas en /contratos.
 *
 * Renderiza:
 *  - Toolbar con CTA "Nueva plantilla" (crea una desde el template Breeding
 *    hardcoded de templates.ts).
 *  - Cards de cada plantilla con nombre, preview de 2 líneas, badge "Por
 *    defecto" si aplica, y acciones rápidas (Marcar por defecto / Editar
 *    / Borrar).
 *  - Empty state cuando no hay nada.
 *
 * Todas las mutaciones llaman a server actions; tras éxito refresca la
 * lista vía router.refresh().
 */
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FileText, Star, Pencil, Trash2, Plus, Check, Loader2 } from 'lucide-react'
import {
  createContractTemplate,
  deleteContractTemplate,
  setDefaultContractTemplate,
  type ContractTemplate,
} from '@/lib/contracts/templates-actions'

interface Props {
  initialTemplates: ContractTemplate[]
  kennelId: string
  kennelName: string
}

export default function ContractTemplatesList({ initialTemplates, kennelId, kennelName }: Props) {
  const router = useRouter()
  const [templates] = useState(initialTemplates)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleCreateBlank() {
    startTransition(async () => {
      try {
        // Plantilla de partida: el template Breeding hardcoded ya existente,
        // sin variables resueltas (las pondrá la reserva concreta más tarde).
        const seed = SEED_BREEDING_TEMPLATE.replace(/__KENNEL__/g, kennelName)
        const { id } = await createContractTemplate({
          kennelId,
          name: 'Nueva plantilla',
          bodyMd: seed,
          isDefault: templates.length === 0, // primera plantilla = default automático
        })
        router.push(`/contratos/${id}`)
      } catch (e) {
        alert((e as Error).message || 'Error creando la plantilla')
      }
    })
  }

  async function handleSetDefault(id: string) {
    setPendingId(id)
    startTransition(async () => {
      try {
        await setDefaultContractTemplate(id)
        router.refresh()
      } catch (e) {
        alert((e as Error).message || 'Error marcando por defecto')
      } finally {
        setPendingId(null)
      }
    })
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Borrar esta plantilla? No se podrá recuperar.')) return
    setPendingId(id)
    startTransition(async () => {
      try {
        await deleteContractTemplate(id)
        router.refresh()
      } catch (e) {
        alert((e as Error).message || 'Error borrando la plantilla')
      } finally {
        setPendingId(null)
      }
    })
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-[13px] text-muted">
          {templates.length === 0
            ? 'Aún no tienes ninguna plantilla.'
            : `${templates.length} plantilla${templates.length === 1 ? '' : 's'} guardada${templates.length === 1 ? '' : 's'}.`}
        </p>
        <button
          type="button"
          onClick={handleCreateBlank}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-xl bg-ink text-on-primary px-4 py-2.5 text-[13.5px] font-bold hover:opacity-90 disabled:opacity-50 transition"
        >
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          Nueva plantilla
        </button>
      </div>

      {/* Listado o empty */}
      {templates.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-hairline bg-surface-soft p-10 sm:p-14 text-center">
          <FileText className="mx-auto h-8 w-8 text-muted" />
          <p className="mt-4 text-[15px] font-semibold text-ink">Tu primera plantilla</p>
          <p className="mt-1.5 text-[13.5px] text-body max-w-md mx-auto leading-snug">
            Empieza desde un contrato de compraventa básico que podrás adaptar
            a tu criadero. Después podrás usarla en cada reserva sin re-escribir.
          </p>
          <button
            type="button"
            onClick={handleCreateBlank}
            disabled={isPending}
            className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-ink text-on-primary px-5 py-3 text-[13.5px] font-bold hover:opacity-90 disabled:opacity-50 transition"
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Crear desde modelo base
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {templates.map(t => {
            const preview = extractPreview(t.body_md)
            const busy = pendingId === t.id && isPending
            return (
              <article
                key={t.id}
                className={`relative rounded-2xl border bg-canvas p-5 flex flex-col gap-3 transition ${
                  t.is_default ? 'border-[#FE6620]/50 ring-1 ring-[#FE6620]/20' : 'border-hairline hover:border-ink/20'
                }`}
              >
                {t.is_default && (
                  <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-[#FE6620] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                    <Star className="h-2.5 w-2.5 fill-current" /> Por defecto
                  </span>
                )}
                <div className="flex items-start gap-3 min-w-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-card flex-shrink-0">
                    <FileText className="h-4 w-4 text-ink" />
                  </div>
                  <div className="min-w-0 flex-1 pr-20">
                    <h3 className="text-[15px] font-semibold text-ink truncate leading-snug">
                      {t.name}
                    </h3>
                    <p className="mt-0.5 text-[11.5px] text-muted">
                      Editada {formatRelativeDate(t.updated_at)}
                    </p>
                  </div>
                </div>
                {preview && (
                  <p className="text-[13px] text-body line-clamp-2 leading-snug">
                    {preview}
                  </p>
                )}
                <div className="mt-auto pt-3 border-t border-hairline flex items-center gap-1">
                  <Link
                    href={`/contratos/${t.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-semibold text-body hover:text-ink hover:bg-surface-soft transition"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Editar
                  </Link>
                  {!t.is_default && (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(t.id)}
                      disabled={busy}
                      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-semibold text-body hover:text-ink hover:bg-surface-soft disabled:opacity-50 transition"
                    >
                      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                      Marcar por defecto
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(t.id)}
                    disabled={busy}
                    className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-semibold text-muted hover:text-rose-600 hover:bg-rose-50 disabled:opacity-50 transition"
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

/** Extrae 2 líneas de preview saltando títulos Markdown y separadores. */
function extractPreview(md: string): string {
  const lines = md
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#') && !l.startsWith('---') && !l.startsWith('**Entre'))
  const joined = lines.slice(0, 2).join(' ')
  return joined.length > 200 ? joined.slice(0, 200) + '…' : joined
}

function formatRelativeDate(iso: string): string {
  const d = new Date(iso)
  const now = Date.now()
  const diffMs = now - d.getTime()
  const min = Math.floor(diffMs / 60000)
  if (min < 1) return 'ahora mismo'
  if (min < 60) return `hace ${min} min`
  const hours = Math.floor(min / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `hace ${days} día${days === 1 ? '' : 's'}`
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Modelo de partida para la primera plantilla. Variables con sintaxis
 *  simple `{{var}}` — se sustituyen al instanciar el contrato sobre una
 *  reserva. Sin condicionales: si la variable no existe se queda en
 *  blanco. El criador puede editar libremente el texto. */
const SEED_BREEDING_TEMPLATE = `# Contrato de compraventa de cachorro

**Entre:**

- **VENDEDOR**: __KENNEL__, con domicilio en {{kennelAddress}}
- **COMPRADOR**: {{clientName}}, con DNI/NIE {{clientId}}, con domicilio en {{clientAddress}}, email {{clientEmail}}.

Reunidos en la fecha **{{todayDate}}**, las partes acuerdan los siguientes términos.

---

## 1. Objeto

El VENDEDOR transfiere al COMPRADOR la propiedad del cachorro con los siguientes datos:

- **Nombre**: {{dogName}}
- **Raza**: {{breed}}
- **Fecha de nacimiento**: {{birthDate}}
- **Microchip**: {{microchip}}
- **Inscripción / LOE**: {{registration}}

## 2. Precio y forma de pago

El precio total de venta es **{{totalPrice}}**. El COMPRADOR ya ha abonado una señal de **{{depositAmount}}**, que se descuenta del precio total.

El pago se realizará según el calendario acordado en el panel de pagos de la plataforma Genealogic.

## 3. Garantías sanitarias

El VENDEDOR garantiza que el cachorro ha pasado revisión veterinaria previa a la entrega, está identificado con microchip, cuenta con cartilla sanitaria al día y vacunaciones correspondientes a su edad, y ha sido desparasitado interna y externamente.

El VENDEDOR garantiza la ausencia de enfermedades infecto-contagiosas y hereditarias detectables en el momento de la entrega, durante un periodo de **15 días** desde la misma.

## 4. Obligaciones del comprador

El COMPRADOR se compromete a proporcionar al cachorro un entorno adecuado, alimentación equilibrada y atención veterinaria regular, seguir el calendario de vacunaciones y desparasitaciones, y no abandonar al animal bajo ningún concepto.

## 5. Pedigree y documentación

El VENDEDOR entregará al COMPRADOR el pedigree oficial (cuando esté disponible), cartilla sanitaria y de vacunaciones, y una copia firmada de este contrato.

## 6. Jurisdicción

Para cualquier controversia derivada del presente contrato, las partes se someten a los Juzgados y Tribunales de la localidad del VENDEDOR.

---

**Firmado en {{todayDate}}.**
`
