'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LEAD_STAGES, sourceLabel, type MarketingLead } from '@/lib/marketing/types'
import { seedTroyanLeads, moveLeadStage } from '@/lib/marketing/actions'
import { Rocket, Globe, Mail, MailX, Dog, UserCheck, Loader2 } from 'lucide-react'

export default function LeadBoard({ leads }: { leads: MarketingLead[] }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [minDogs, setMinDogs] = useState(3)
  const [onlyWebsite, setOnlyWebsite] = useState(true)
  const [seedMsg, setSeedMsg] = useState<string | null>(null)

  const byStage = (k: string) => leads.filter((l) => l.stage === k)

  function doSeed() {
    setSeedMsg(null)
    start(async () => {
      try {
        const r = await seedTroyanLeads({ minDogs, onlyWebsite })
        setSeedMsg(`${r.inserted} leads nuevos · ${r.skipped} ya existían · ${r.candidates} candidatos`)
        router.refresh()
      } catch {
        setSeedMsg('Error al poblar. ¿Aplicaste la migración?')
      }
    })
  }

  function move(id: string, stage: string) {
    start(async () => {
      await moveLeadStage(id, stage)
      router.refresh()
    })
  }

  return (
    <div>
      {/* Poblar Tier A (caballo de Troya) */}
      <div className="mb-6 rounded-xl border border-hairline bg-surface-soft p-4">
        <div className="flex items-center gap-2 mb-2">
          <Rocket className="w-4 h-4 text-ink" />
          <h2 className="text-sm font-bold text-ink">Poblar Tier A — criaderos ya en la DB sin reclamar</h2>
        </div>
        <p className="text-xs text-muted mb-3">
          Trae como leads los criaderos importados que aún no tienen cuenta. El gancho: sus perros ya están dentro.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs text-body flex items-center gap-1.5">
            Mín. perros
            <input
              type="number"
              min={1}
              value={minDogs}
              onChange={(e) => setMinDogs(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-16 rounded-md border border-hairline bg-canvas px-2 py-1 text-ink"
            />
          </label>
          <label className="text-xs text-body flex items-center gap-1.5">
            <input type="checkbox" checked={onlyWebsite} onChange={(e) => setOnlyWebsite(e.target.checked)} />
            Solo con web
          </label>
          <button
            onClick={doSeed}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-canvas hover:opacity-90 disabled:opacity-50"
          >
            {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Rocket className="w-3.5 h-3.5" />}
            Poblar
          </button>
          {seedMsg && <span className="text-xs text-body">{seedMsg}</span>}
        </div>
      </div>

      {/* Contadores por stage */}
      <div className="mb-4 flex flex-wrap gap-2">
        <Chip label="Total" value={leads.length} color="#0f172a" />
        {LEAD_STAGES.map((s) => (
          <Chip key={s.key} label={s.label} value={byStage(s.key).length} color={s.color} />
        ))}
      </div>

      {/* Tablero */}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {LEAD_STAGES.map((s) => {
          const items = byStage(s.key)
          return (
            <div key={s.key} className="min-w-[250px] w-[250px] flex-shrink-0">
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                <span className="text-xs font-bold text-ink">{s.label}</span>
                <span className="text-xs text-muted">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.length === 0 && (
                  <div className="rounded-lg border border-dashed border-hairline px-3 py-6 text-center text-[11px] text-muted">
                    Vacío
                  </div>
                )}
                {items.map((l) => (
                  <div key={l.id} className="rounded-lg border border-hairline bg-canvas p-3">
                    <Link href={`/admin/marketing/${l.id}`} className="block group">
                      <p className="text-[13px] font-semibold text-ink truncate group-hover:underline">
                        {l.kennel_name || 'Sin nombre'}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-muted">
                        <span className="inline-flex items-center gap-1">
                          <Dog className="w-3 h-3" /> {l.priority}
                        </span>
                        {l.email ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600">
                            <Mail className="w-3 h-3" /> email
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-600">
                            <MailX className="w-3 h-3" /> sin email
                          </span>
                        )}
                        {l.website && <Globe className="w-3 h-3" />}
                        {l.matched_user_id && (
                          <span className="inline-flex items-center gap-1 text-blue-600">
                            <UserCheck className="w-3 h-3" /> registrado
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-[10px] text-muted">{sourceLabel(l.source)}</p>
                    </Link>
                    <select
                      value={l.stage}
                      disabled={pending}
                      onChange={(e) => move(l.id, e.target.value)}
                      className="mt-2 w-full rounded-md border border-hairline bg-surface-soft px-2 py-1 text-[11px] text-body"
                    >
                      {LEAD_STAGES.map((s2) => (
                        <option key={s2.key} value={s2.key}>
                          {s2.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Chip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-canvas px-3 py-1">
      <span className="w-2 h-2 rounded-full" style={{ background: color }} />
      <span className="text-xs text-body">{label}</span>
      <span className="text-xs font-bold text-ink">{value}</span>
    </div>
  )
}
