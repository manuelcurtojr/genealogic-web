/**
 * Panel completo de estadísticas admin — versión extendida.
 *
 * Organizado en secciones colapsadas mentalmente por scroll:
 *   1) Hero KPIs (4 cards grandes con delta %)
 *   2) Crecimiento mensual (4 charts)
 *   3) Funnel de conversión
 *   4) Distribuciones (pies)
 *   5) Catálogo (counts + %)
 *   6) Operaciones (claims & soporte)
 *   7) Engagement (Genos + page views + activos)
 *   8) Tops
 */
'use client'

import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import {
  Users, Dog, Store, Baby, Eye, Tag, Crown, Euro, TrendingUp, TrendingDown,
  Sparkles, MessageSquare, Stethoscope, Mail, Bell, Globe, Image as ImageIcon,
  GitBranch, ShieldCheck, AlertCircle, CheckCircle2, Clock, Activity, Calendar,
  MapPin, Wifi,
} from 'lucide-react'

type KPI = { value: number; pct?: number; sub?: string }

interface Props {
  hero: {
    usersTotal: number
    usersLast30: number
    usersPrev30: number
    dogsTotal: number
    dogsLast30: number
    kennelsTotal: number
    kennelsClaimed: number
    paidUsersCount: number
    mrrEur: number
  }
  growth: {
    usersByMonth: { month: string; count: number; cumulative: number }[]
    dogsByMonth: { month: string; count: number; cumulative: number }[]
    kennelsByMonth: { month: string; count: number; cumulative: number }[]
    reservationsByMonth: { month: string; count: number; cumulative: number }[]
  }
  funnel: { stage: string; value: number; pct: number }[]
  distributions: {
    role: { name: string; value: number; color: string }[]
    intent: { name: string; value: number; color: string }[]
    plan: { name: string; value: number; color: string }[]
    sex: { name: string; value: number; color: string }[]
    litterStatus: { name: string; value: number; color: string }[]
  }
  catalog: {
    dogsTotal: number
    dogsWithPhoto: number
    dogsWithParents: number
    dogsForSale: number
    dogsPublic: number
    dogsReproductive: number
    dogsImported: number
    dogsUnclaimed: number
    kennelsTotal: number
    kennelsUnclaimed: number
    kennelsWithLogo: number
    kennelsWithDomain: number
    kennelsWithPublishedWeb: number
    breedsTotal: number
    littersTotal: number
  }
  operations: {
    supportStats: {
      total: number
      pending: number
      reviewing: number
      approved: number
      rejected: number
      typeSupport: number
      typeClaimDog: number
      typeClaimKennel: number
      urgent: number
    }
    avgResolutionHours: number
  }
  engagement: {
    genosConvs: number
    genosUserMsgs: number
    genosAssistantMsgs: number
    genosEscalated: number
    genosTotalTokens: number
    pageViews30: number
    pvByDay: { day: string; count: number }[]
    notifications30: number
    notificationsUnread: number
    vetRecordsTotal: number
    emailbotThreads: number
    dau: number
    wau: number
    mau: number
  }
  tops: {
    topBreeds: { name: string; value: number }[]
    topCountries: { name: string; value: number }[]
    topKennels: { name: string; value: number }[]
  }
}

const COLORS = ['#fb923c', '#3b82f6', '#34d399', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#ef4444', '#6366f1', '#a3e635']
const fmt = (n: number) => n.toLocaleString('es-ES')
const fmtEur = (n: number) => `${n.toLocaleString('es-ES')}€`
const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0)

function deltaPct(curr: number, prev: number): { value: number; up: boolean } {
  if (prev === 0) return { value: curr > 0 ? 100 : 0, up: curr > 0 }
  const d = Math.round(((curr - prev) / prev) * 100)
  return { value: Math.abs(d), up: d >= 0 }
}

export default function AdminStatsClient({
  hero, growth, funnel, distributions, catalog, operations, engagement, tops,
}: Props) {
  const usersDelta = deltaPct(hero.usersLast30, hero.usersPrev30)
  const claimedPct = pct(hero.kennelsClaimed, hero.kennelsTotal)

  return (
    <div className="space-y-10">
      <div>
        <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted">Plataforma</p>
        <h1 className="mt-1.5 text-[32px] sm:text-[40px] font-semibold leading-[1.1] tracking-[-0.04em] text-ink">
          Estadísticas
        </h1>
        <p className="mt-2 text-[14px] text-body">Métricas en tiempo real. Período por defecto: últimos 30 días.</p>
      </div>

      {/* ═════ HERO KPIs ═════ */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <HeroCard
          icon={Users} label="Usuarios totales"
          value={hero.usersTotal}
          sub={`+${hero.usersLast30} en 30d`}
          delta={usersDelta}
          color="#fb923c"
        />
        <HeroCard
          icon={Dog} label="Perros"
          value={hero.dogsTotal}
          sub={`+${hero.dogsLast30} en 30d`}
          color="#3b82f6"
        />
        <HeroCard
          icon={Store} label="Criaderos"
          value={hero.kennelsTotal}
          sub={`${claimedPct}% reclamados (${fmt(hero.kennelsClaimed)})`}
          color="#34d399"
        />
        <HeroCard
          icon={Euro} label="MRR estimado"
          value={hero.mrrEur}
          formatter={fmtEur}
          sub={`${hero.paidUsersCount} planes de pago`}
          color="#8b5cf6"
        />
      </section>

      {/* ═════ CRECIMIENTO MENSUAL ═════ */}
      <section>
        <SectionHeader title="Crecimiento" subtitle="Últimos 12 meses · creados por mes + acumulado" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GrowthChart title="Usuarios" data={growth.usersByMonth} color="#fb923c" />
          <GrowthChart title="Perros" data={growth.dogsByMonth} color="#3b82f6" />
          <GrowthChart title="Criaderos" data={growth.kennelsByMonth} color="#34d399" />
          <GrowthChart title="Reservas" data={growth.reservationsByMonth} color="#8b5cf6" />
        </div>
      </section>

      {/* ═════ FUNNEL ═════ */}
      <section>
        <SectionHeader title="Conversion funnel" subtitle="Cada etapa con su % sobre el total de signups" />
        <div className="rounded-xl border border-hairline bg-canvas p-5 space-y-2">
          {funnel.map((s, i) => (
            <FunnelRow key={s.stage} stage={s.stage} value={s.value} pct={s.pct} step={i + 1} />
          ))}
        </div>
      </section>

      {/* ═════ DISTRIBUCIONES ═════ */}
      <section>
        <SectionHeader title="Distribuciones" subtitle="Composición de la base de usuarios y catálogo" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <PieCard title="Usuarios por rol (DB)" data={distributions.role} />
          <PieCard title="Intent de onboarding" data={distributions.intent} />
          <PieCard title="Planes" data={distributions.plan} />
          <PieCard title="Perros por sexo" data={distributions.sex} />
          <PieCard title="Camadas por estado" data={distributions.litterStatus} />
        </div>
      </section>

      {/* ═════ CATÁLOGO ═════ */}
      <section>
        <SectionHeader title="Catálogo" subtitle="Calidad y completitud de los datos" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <RatioCard icon={ImageIcon} label="Perros con foto" num={catalog.dogsWithPhoto} den={catalog.dogsTotal} color="#3b82f6" />
          <RatioCard icon={GitBranch} label="Perros con padres" num={catalog.dogsWithParents} den={catalog.dogsTotal} color="#8b5cf6" />
          <RatioCard icon={Eye} label="Perros públicos" num={catalog.dogsPublic} den={catalog.dogsTotal} color="#06b6d4" />
          <RatioCard icon={Tag} label="En venta" num={catalog.dogsForSale} den={catalog.dogsTotal} color="#ec4899" />
          <RatioCard icon={Sparkles} label="Reproductores" num={catalog.dogsReproductive} den={catalog.dogsTotal} color="#fb923c" />
          <RatioCard icon={Dog} label="Importados" num={catalog.dogsImported} den={catalog.dogsTotal} color="#9ca3af" />
          <RatioCard icon={ShieldCheck} label="Perros sin owner" num={catalog.dogsUnclaimed} den={catalog.dogsTotal} color="#f59e0b" />
          <RatioCard icon={ShieldCheck} label="Kennels sin owner" num={catalog.kennelsUnclaimed} den={catalog.kennelsTotal} color="#f59e0b" />
          <RatioCard icon={ImageIcon} label="Kennels con logo" num={catalog.kennelsWithLogo} den={catalog.kennelsTotal} color="#34d399" />
          <RatioCard icon={Globe} label="Kennels con web" num={catalog.kennelsWithPublishedWeb} den={catalog.kennelsTotal} color="#3b82f6" />
          <RatioCard icon={Wifi} label="Kennels con dominio" num={catalog.kennelsWithDomain} den={catalog.kennelsTotal} color="#8b5cf6" />
          <RatioCard icon={Baby} label="Camadas totales" num={catalog.littersTotal} den={catalog.littersTotal} color="#8b5cf6" hideRatio />
        </div>
      </section>

      {/* ═════ OPERACIONES ═════ */}
      <section>
        <SectionHeader title="Operaciones · soporte y claims" subtitle="Estado de la bandeja de admin_requests" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <OpsCard icon={AlertCircle} label="Pendientes" value={operations.supportStats.pending} color="#f59e0b" />
          <OpsCard icon={Clock} label="En revisión" value={operations.supportStats.reviewing} color="#3b82f6" />
          <OpsCard icon={CheckCircle2} label="Aprobadas" value={operations.supportStats.approved} color="#34d399" />
          <OpsCard icon={AlertCircle} label="Urgentes abiertas" value={operations.supportStats.urgent} color="#ef4444" />
        </div>
        <div className="rounded-xl border border-hairline bg-canvas p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatRow label="Tickets soporte" value={operations.supportStats.typeSupport} icon={MessageSquare} />
            <StatRow label="Claims de perro" value={operations.supportStats.typeClaimDog} icon={Dog} />
            <StatRow label="Claims de criadero" value={operations.supportStats.typeClaimKennel} icon={Store} />
            <StatRow label="Aprobadas" value={operations.supportStats.approved} icon={CheckCircle2} />
            <StatRow label="Rechazadas" value={operations.supportStats.rejected} icon={AlertCircle} />
            <StatRow label="Tiempo medio resolución" value={`${operations.avgResolutionHours}h`} icon={Clock} />
          </div>
        </div>
      </section>

      {/* ═════ ENGAGEMENT ═════ */}
      <section>
        <SectionHeader title="Engagement & uso" subtitle="Actividad real de la plataforma" />

        {/* Actividad activa (DAU/WAU/MAU) */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <OpsCard icon={Activity} label="Activos hoy" value={engagement.dau} color="#34d399" />
          <OpsCard icon={Activity} label="Activos 7d" value={engagement.wau} color="#3b82f6" />
          <OpsCard icon={Activity} label="Activos 30d" value={engagement.mau} color="#8b5cf6" />
        </div>

        {/* Page views último mes */}
        <div className="rounded-xl border border-hairline bg-canvas p-5 mb-4">
          <h3 className="text-[14px] font-semibold tracking-[-0.02em] text-ink mb-3">
            Page views — últimos 30 días ({fmt(engagement.pageViews30)} total)
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={engagement.pvByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 10 }} interval={4} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={2} name="Views" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Genos + features */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <OpsCard icon={Sparkles} label="Conversaciones Genos" value={engagement.genosConvs} color="#fb923c" sub={`${engagement.genosUserMsgs} msgs user`} />
          <OpsCard icon={MessageSquare} label="Escaladas a humano" value={engagement.genosEscalated} color="#ef4444" />
          <OpsCard icon={Bell} label="Notifs 30d" value={engagement.notifications30} color="#3b82f6" sub={`${engagement.notificationsUnread} sin leer`} />
          <OpsCard icon={Stethoscope} label="Vet records" value={engagement.vetRecordsTotal} color="#06b6d4" />
          <OpsCard icon={Mail} label="Emailbot threads" value={engagement.emailbotThreads} color="#8b5cf6" />
          <OpsCard icon={Sparkles} label="Tokens Genos" value={engagement.genosTotalTokens} color="#9ca3af" formatter={fmt} />
        </div>
      </section>

      {/* ═════ TOPS ═════ */}
      <section>
        <SectionHeader title="Tops" subtitle="Razas, países y criaderos con más datos" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <HorizontalBarCard title="Top 10 razas" icon={Dog} data={tops.topBreeds} />
          <HorizontalBarCard title="Top 10 países" icon={MapPin} data={tops.topCountries} />
          <HorizontalBarCard title="Top 10 criaderos (por nº de perros)" icon={Store} data={tops.topKennels} />
        </div>
      </section>
    </div>
  )
}

// ─── Subcomponentes ─────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-[20px] sm:text-[22px] font-semibold tracking-[-0.04em] text-ink">{title}</h2>
      {subtitle && <p className="text-[12px] text-muted mt-0.5">{subtitle}</p>}
    </div>
  )
}

function HeroCard({
  icon: Icon, label, value, sub, color, delta, formatter,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any
  label: string
  value: number
  sub?: string
  color: string
  delta?: { value: number; up: boolean }
  formatter?: (n: number) => string
}) {
  return (
    <div className="rounded-xl border border-hairline bg-canvas p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" style={{ color }} />
          <span className="text-[12px] font-medium text-muted">{label}</span>
        </div>
        {delta && (
          <span className={`text-[11px] font-bold tabular-nums inline-flex items-center gap-0.5 ${
            delta.up ? 'text-emerald-700' : 'text-red-700'
          }`}>
            {delta.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {delta.value}%
          </span>
        )}
      </div>
      <p className="mt-3 text-[28px] font-semibold tabular-nums tracking-[-0.04em] text-ink leading-none">
        {formatter ? formatter(value) : fmt(value)}
      </p>
      {sub && <p className="text-[11px] text-muted mt-1.5">{sub}</p>}
    </div>
  )
}

function GrowthChart({ title, data, color }: {
  title: string
  data: { month: string; count: number; cumulative: number }[]
  color: string
}) {
  const last = data[data.length - 1]?.count || 0
  const prev = data[data.length - 2]?.count || 0
  const delta = deltaPct(last, prev)
  return (
    <div className="rounded-xl border border-hairline bg-canvas p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[14px] font-semibold tracking-[-0.02em] text-ink">{title}</h3>
        <span className={`text-[11px] font-bold tabular-nums inline-flex items-center gap-0.5 ${delta.up ? 'text-emerald-700' : 'text-red-700'}`}>
          {delta.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {delta.value}% este mes
        </span>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 10 }} />
          <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
          <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }} />
          <Line type="monotone" dataKey="count" stroke={color} strokeWidth={2} dot={{ r: 3 }} name="Nuevos" />
          <Line type="monotone" dataKey="cumulative" stroke="#9ca3af" strokeWidth={1} strokeDasharray="3 3" dot={false} name="Acumulado" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function PieCard({ title, data }: {
  title: string
  data: { name: string; value: number; color: string }[]
}) {
  const total = data.reduce((a, b) => a + b.value, 0)
  return (
    <div className="rounded-xl border border-hairline bg-canvas p-5">
      <h3 className="text-[14px] font-semibold tracking-[-0.02em] text-ink mb-2">{title}</h3>
      {total === 0 ? (
        <div className="h-[180px] flex items-center justify-center text-xs text-muted">Sin datos</div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" labelLine={false}>
              {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Pie>
            <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      )}
      <ul className="mt-2 space-y-1">
        {data.map((d) => (
          <li key={d.name} className="flex items-center justify-between text-[12px]">
            <span className="flex items-center gap-1.5 text-body">
              <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
              {d.name}
            </span>
            <span className="tabular-nums font-medium text-ink">
              {fmt(d.value)} <span className="text-muted">({total > 0 ? Math.round((d.value / total) * 100) : 0}%)</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function FunnelRow({ stage, value, pct, step }: {
  stage: string; value: number; pct: number; step: number
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-semibold text-ink">
          <span className="text-muted font-normal mr-2">{step}.</span>{stage}
        </span>
        <span className="text-sm font-bold tabular-nums text-ink">
          {fmt(value)} <span className="text-muted font-normal">· {pct}%</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-surface-card overflow-hidden">
        <div className="h-full bg-ink transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function RatioCard({
  icon: Icon, label, num, den, color, hideRatio,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any
  label: string
  num: number
  den: number
  color: string
  hideRatio?: boolean
}) {
  const p = den > 0 ? Math.round((num / den) * 100) : 0
  return (
    <div className="rounded-xl border border-hairline bg-canvas p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-3.5 w-3.5" style={{ color }} />
        <span className="text-[11px] font-medium text-muted truncate">{label}</span>
      </div>
      <p className="text-[20px] font-semibold tabular-nums text-ink leading-none">{fmt(num)}</p>
      {!hideRatio && (
        <div className="mt-2">
          <div className="h-1 rounded-full bg-surface-card overflow-hidden">
            <div className="h-full transition-all" style={{ width: `${p}%`, background: color }} />
          </div>
          <p className="text-[10px] text-muted mt-1 tabular-nums">{p}% de {fmt(den)}</p>
        </div>
      )}
    </div>
  )
}

function OpsCard({
  icon: Icon, label, value, color, sub, formatter,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any
  label: string
  value: number
  color: string
  sub?: string
  formatter?: (n: number) => string
}) {
  return (
    <div className="rounded-xl border border-hairline bg-canvas p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-3.5 w-3.5" style={{ color }} />
        <span className="text-[11px] font-medium text-muted truncate">{label}</span>
      </div>
      <p className="text-[22px] font-semibold tabular-nums text-ink leading-none">
        {formatter ? formatter(value) : fmt(value)}
      </p>
      {sub && <p className="text-[10px] text-muted mt-1.5">{sub}</p>}
    </div>
  )
}

function StatRow({ label, value, icon: Icon }: {
  label: string
  value: string | number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-[12px] text-body inline-flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5 text-muted" />
        {label}
      </span>
      <span className="text-sm font-bold tabular-nums text-ink">
        {typeof value === 'number' ? fmt(value) : value}
      </span>
    </div>
  )
}

function HorizontalBarCard({ title, icon: Icon, data }: {
  title: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any
  data: { name: string; value: number }[]
}) {
  return (
    <div className="rounded-xl border border-hairline bg-canvas p-5">
      <h3 className="text-[14px] font-semibold tracking-[-0.02em] text-ink mb-3 inline-flex items-center gap-1.5">
        <Icon className="w-4 h-4 text-muted" />
        {title}
      </h3>
      {data.length === 0 ? (
        <div className="h-[280px] flex items-center justify-center text-xs text-muted">Sin datos</div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 10 }} />
            <YAxis dataKey="name" type="category" tick={{ fill: '#6b7280', fontSize: 10 }} width={130} />
            <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
