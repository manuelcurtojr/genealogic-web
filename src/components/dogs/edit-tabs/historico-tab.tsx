'use client'

/**
 * HistoricoTab — timeline de todos los cambios sufridos por un perro.
 *
 * Datos: `dog_audit_log` con triggers PostgreSQL que registran INSERT/UPDATE
 * en dogs, dog_photos, vet_records, awards. Para eventos custom hay un RPC
 * log_dog_action() que también se puede invocar desde server actions.
 *
 * UX: lista vertical con fecha+hora, nombre del actor, descripción legible
 * del cambio (no el JSON crudo). Agrupada por día para reducir ruido visual
 * cuando hay muchos eventos seguidos (ej. subir 20 fotos en 30s).
 *
 * Visible para: owner_id, breeder_id (vía RLS). Confianza entre criador y
 * propietario — ambos ven el mismo histórico.
 */
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Loader2, Dog as DogIcon, Camera, Trash2, ArrowRightLeft, Stethoscope,
  Trophy, Edit3, Eye, EyeOff, Tag, AlertCircle,
} from 'lucide-react'

interface AuditEntry {
  id: string
  actor_user_id: string | null
  actor_name: string | null
  action: string
  payload: Record<string, unknown>
  created_at: string
}

export default function HistoricoTab({ dogId }: { dogId: string }) {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true); setError(null)
      const supabase = createClient()
      const { data, error: err } = await supabase
        .from('dog_audit_log')
        .select('id, actor_user_id, actor_name, action, payload, created_at')
        .eq('dog_id', dogId)
        .order('created_at', { ascending: false })
        .limit(200)
      if (cancelled) return
      if (err) setError(err.message)
      else setEntries((data || []) as AuditEntry[])
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [dogId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-muted" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-500 flex items-center gap-2">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        <span>{error}</span>
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <Edit3 className="w-8 h-8 text-muted mx-auto mb-2 opacity-50" />
        <p className="text-sm text-muted">Sin actividad registrada todavía.</p>
        <p className="text-[11px] text-muted mt-1">
          Aquí aparecerán todos los cambios: fotos, peso, salud, transferencias, etc.
        </p>
      </div>
    )
  }

  // Agrupar por día (yyyy-mm-dd local)
  const grouped: Record<string, AuditEntry[]> = {}
  for (const e of entries) {
    const day = new Date(e.created_at).toLocaleDateString('es-ES', {
      day: '2-digit', month: 'long', year: 'numeric',
    })
    if (!grouped[day]) grouped[day] = []
    grouped[day].push(e)
  }

  return (
    <div className="space-y-5">
      <div className="text-[11px] text-muted">
        {entries.length} {entries.length === 1 ? 'evento' : 'eventos'} registrados
      </div>
      {Object.entries(grouped).map(([day, items]) => (
        <div key={day}>
          <p className="text-[10.5px] font-bold uppercase tracking-wider text-muted mb-2 px-1">
            {day}
          </p>
          <div className="relative pl-5 border-l-2 border-hairline space-y-3">
            {items.map((e) => (
              <EntryRow key={e.id} entry={e} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function EntryRow({ entry }: { entry: AuditEntry }) {
  const { Icon, color, summary } = describeAction(entry)
  const time = new Date(entry.created_at).toLocaleTimeString('es-ES', {
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className="relative">
      <div
        className="absolute -left-[26px] top-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2 border-canvas"
        style={{ backgroundColor: color }}
      >
        <Icon className="w-2.5 h-2.5 text-white" />
      </div>
      <div className="bg-surface-card border border-hairline rounded-lg px-3 py-2">
        <p className="text-[13px] text-ink leading-snug">{summary}</p>
        <p className="text-[11px] text-muted mt-1 flex items-center gap-1.5">
          <span className="font-medium">{entry.actor_name || 'Usuario desconocido'}</span>
          <span>·</span>
          <span>{time}</span>
        </p>
      </div>
    </div>
  )
}

/**
 * Traduce action+payload a un mensaje legible en español + icono.
 * Se mantiene en un único sitio para que añadir un evento nuevo sea trivial.
 */
function describeAction(e: AuditEntry): { Icon: typeof DogIcon; color: string; summary: string } {
  const p = e.payload || {}
  switch (e.action) {
    case 'created':
      return { Icon: DogIcon, color: '#10b981', summary: `Creó el perro "${str(p.name)}"` }
    case 'photo_added':
      return { Icon: Camera, color: '#3b82f6', summary: 'Subió una nueva foto' }
    case 'photo_removed':
      return { Icon: Trash2, color: '#ef4444', summary: 'Eliminó una foto' }
    case 'transferred':
      return { Icon: ArrowRightLeft, color: '#f59e0b', summary: 'Transfirió la propiedad del perro' }
    case 'vet_record_added': {
      const type = vetRecordLabel(str(p.record_type))
      return { Icon: Stethoscope, color: '#06b6d4', summary: `Añadió ${type}: ${str(p.name)}` }
    }
    case 'award_added':
      return { Icon: Trophy, color: '#eab308', summary: `Añadió premio: ${str(p.event_name)} (${str(p.award_type)})` }
    case 'updated':
      return { Icon: Edit3, color: '#6366f1', summary: describeUpdate(p as Record<string, { from: unknown; to: unknown }>) }
    case 'pedigree_imported':
      return { Icon: DogIcon, color: '#10b981', summary: `Importó genealogía${p.source ? ` desde ${str(p.source)}` : ''}` }
    case 'pdf_generated':
      return { Icon: Tag, color: '#8b5cf6', summary: 'Generó el PDF de la genealogía' }
    default:
      return { Icon: Edit3, color: '#94a3b8', summary: e.action.replace(/_/g, ' ') }
  }
}

function describeUpdate(changes: Record<string, { from: unknown; to: unknown }>): string {
  const parts: string[] = []
  for (const [field, change] of Object.entries(changes)) {
    if (!change || typeof change !== 'object') continue
    const { from, to } = change
    switch (field) {
      case 'name':
        parts.push(`renombró de "${str(from)}" a "${str(to)}"`); break
      case 'weight':
        parts.push(`actualizó peso de ${str(from) || '—'} a ${str(to) || '—'} kg`); break
      case 'height':
        parts.push(`actualizó altura de ${str(from) || '—'} a ${str(to) || '—'} cm`); break
      case 'is_public':
        parts.push(to ? 'hizo el perro público' : 'hizo el perro privado'); break
      case 'is_for_sale':
        parts.push(to ? 'puso el perro en venta' : 'quitó el perro de venta'); break
      case 'sale_price':
        parts.push(`cambió precio de venta a ${str(to) || '—'}`); break
      case 'registration':
        parts.push(`actualizó registro: ${str(to) || '—'}`); break
      case 'microchip':
        parts.push(`actualizó microchip: ${str(to) || '—'}`); break
      case 'color_id':
        parts.push('cambió el color'); break
      case 'birth_date':
        parts.push(`cambió nacimiento a ${str(to) || '—'}`); break
      case 'thumbnail_url':
        parts.push('cambió la foto principal'); break
      case 'father_id':
        parts.push('cambió el padre'); break
      case 'mother_id':
        parts.push('cambió la madre'); break
      default:
        parts.push(`actualizó ${field}`)
    }
  }
  if (parts.length === 0) return 'Editó la ficha'
  // Capitalizar primera letra
  const joined = parts.join(', ')
  return joined.charAt(0).toUpperCase() + joined.slice(1)
}

function vetRecordLabel(type: string): string {
  switch (type) {
    case 'vaccine': return 'vacuna'
    case 'deworming': return 'desparasitación'
    case 'treatment': return 'tratamiento'
    case 'test': return 'prueba'
    case 'surgery': return 'cirugía'
    default: return 'registro veterinario'
  }
}

function str(v: unknown): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'string') return v
  return String(v)
}
