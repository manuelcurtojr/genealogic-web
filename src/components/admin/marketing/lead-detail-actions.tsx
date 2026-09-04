'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { LEAD_STAGES, type MarketingLead } from '@/lib/marketing/types'
import { moveLeadStage, updateLead, addLeadNote, deleteLead } from '@/lib/marketing/actions'
import { Save, Trash2, Loader2, Check } from 'lucide-react'

export default function LeadDetailActions({ lead }: { lead: MarketingLead }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [form, setForm] = useState({
    kennel_name: lead.kennel_name || '',
    contact_name: lead.contact_name || '',
    email: lead.email || '',
    phone: lead.phone || '',
    website: lead.website || '',
    instagram: lead.instagram || '',
    country: lead.country || '',
    region: lead.region || '',
    breed_focus: lead.breed_focus || '',
    next_action_at: lead.next_action_at || '',
    internal_note: lead.internal_note || '',
  })
  const [note, setNote] = useState('')
  const [saved, setSaved] = useState(false)

  const set = (k: string, v: string) => {
    setForm((f) => ({ ...f, [k]: v }))
    setSaved(false)
  }

  function save() {
    start(async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await updateLead(lead.id, form as any)
      setSaved(true)
      router.refresh()
    })
  }
  function stage(s: string) {
    start(async () => {
      await moveLeadStage(lead.id, s)
      router.refresh()
    })
  }
  function saveNote() {
    const t = note.trim()
    if (!t) return
    start(async () => {
      await addLeadNote(lead.id, t)
      setNote('')
      router.refresh()
    })
  }
  function remove() {
    // eslint-disable-next-line no-alert
    if (!confirm('¿Eliminar este lead? No se puede deshacer.')) return
    start(async () => {
      await deleteLead(lead.id)
      router.push('/admin/marketing')
    })
  }

  const field = 'w-full rounded-md border border-hairline bg-canvas px-2.5 py-1.5 text-sm text-ink'
  const lbl = 'text-[11px] font-medium text-muted mb-0.5 block'

  return (
    <div className="space-y-4 lg:sticky lg:top-6">
      {/* Etapa */}
      <section className="rounded-xl border border-hairline bg-canvas p-4">
        <h3 className="text-sm font-bold text-ink mb-2">Etapa</h3>
        <div className="flex flex-wrap gap-1.5">
          {LEAD_STAGES.map((s) => (
            <button
              key={s.key}
              onClick={() => stage(s.key)}
              disabled={pending}
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition disabled:opacity-50 ${
                lead.stage === s.key ? 'text-white' : 'text-body border border-hairline hover:border-ink/40'
              }`}
              style={lead.stage === s.key ? { background: s.color } : undefined}
            >
              {s.label}
            </button>
          ))}
        </div>
      </section>

      {/* Datos */}
      <section className="rounded-xl border border-hairline bg-canvas p-4">
        <h3 className="text-sm font-bold text-ink mb-3">Datos del lead</h3>
        <div className="space-y-2.5">
          <div>
            <label className={lbl}>Criadero</label>
            <input className={field} value={form.kennel_name} onChange={(e) => set('kennel_name', e.target.value)} />
          </div>
          <div>
            <label className={lbl}>Contacto</label>
            <input className={field} value={form.contact_name} onChange={(e) => set('contact_name', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={lbl}>Email</label>
              <input className={field} value={form.email} onChange={(e) => set('email', e.target.value)} />
            </div>
            <div>
              <label className={lbl}>Teléfono</label>
              <input className={field} value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={lbl}>Web</label>
              <input className={field} value={form.website} onChange={(e) => set('website', e.target.value)} />
            </div>
            <div>
              <label className={lbl}>Instagram</label>
              <input className={field} value={form.instagram} onChange={(e) => set('instagram', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={lbl}>Raza</label>
              <input className={field} value={form.breed_focus} onChange={(e) => set('breed_focus', e.target.value)} />
            </div>
            <div>
              <label className={lbl}>Próxima acción</label>
              <input
                type="date"
                className={field}
                value={form.next_action_at}
                onChange={(e) => set('next_action_at', e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={lbl}>Región</label>
              <input className={field} value={form.region} onChange={(e) => set('region', e.target.value)} />
            </div>
            <div>
              <label className={lbl}>País</label>
              <input className={field} value={form.country} onChange={(e) => set('country', e.target.value)} />
            </div>
          </div>
          <div>
            <label className={lbl}>Nota interna</label>
            <textarea
              className={`${field} min-h-[60px]`}
              value={form.internal_note}
              onChange={(e) => set('internal_note', e.target.value)}
            />
          </div>
          <button
            onClick={save}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-canvas hover:opacity-90 disabled:opacity-50"
          >
            {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            {saved ? 'Guardado' : 'Guardar'}
          </button>
        </div>
      </section>

      {/* Añadir nota al historial */}
      <section className="rounded-xl border border-hairline bg-canvas p-4">
        <h3 className="text-sm font-bold text-ink mb-2">Añadir al historial</h3>
        <textarea
          className={`${field} min-h-[60px]`}
          placeholder="Anota una llamada, una respuesta, algo a recordar…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <button
          onClick={saveNote}
          disabled={pending || !note.trim()}
          className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-hairline px-3 py-1.5 text-xs font-semibold text-body hover:text-ink hover:border-ink/40 disabled:opacity-50"
        >
          Añadir nota
        </button>
      </section>

      <button
        onClick={remove}
        disabled={pending}
        className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-[color:var(--error)] disabled:opacity-50"
      >
        <Trash2 className="w-3.5 h-3.5" /> Eliminar lead
      </button>
    </div>
  )
}
