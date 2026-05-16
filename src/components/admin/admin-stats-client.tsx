'use client'

import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Users, Dog, Store, Baby, Eye, Tag } from 'lucide-react'

interface Props {
  usersByMonth: any[]
  dogsByMonth: any[]
  kennelsByMonth: any[]
  roleDistribution: any[]
  sexDistribution: any[]
  topBreeds: any[]
  topCountries: any[]
  litterStatus: any[]
  totals: {
    users: number; dogs: number; kennels: number; litters: number
    dogsPublic: number; dogsForSale: number
  }
}

const COLORS = ['#fb923c', '#3b82f6', '#34d399', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#ef4444', '#6366f1', '#a3e635']

export default function AdminStatsClient({
  usersByMonth, dogsByMonth, kennelsByMonth, roleDistribution, sexDistribution,
  topBreeds, topCountries, litterStatus, totals,
}: Props) {
  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted">Plataforma</p>
        <h1 className="mt-1.5 text-[32px] sm:text-[40px] font-semibold leading-[1.1] tracking-[-0.04em] text-ink">
          Estadísticas
        </h1>
        <p className="mt-2 text-[14px] text-body">Métricas y análisis de la plataforma.</p>
      </div>

      {/* KPI cards */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {[
          { icon: Users, label: 'Usuarios', value: totals.users, color: '#fb923c' },
          { icon: Dog, label: 'Perros', value: totals.dogs, color: '#3b82f6' },
          { icon: Store, label: 'Criaderos', value: totals.kennels, color: '#34d399' },
          { icon: Baby, label: 'Camadas', value: totals.litters, color: '#8b5cf6' },
          { icon: Eye, label: 'Perros públicos', value: totals.dogsPublic, color: '#06b6d4' },
          { icon: Tag, label: 'En venta', value: totals.dogsForSale, color: '#ec4899' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-hairline bg-canvas p-5">
            <div className="flex items-center gap-2">
              <s.icon className="h-4 w-4" style={{ color: s.color }} />
              <span className="text-[12px] font-medium text-muted">{s.label}</span>
            </div>
            <p className="mt-3 text-[28px] font-semibold tabular-nums tracking-[-0.04em] text-ink leading-none">
              {typeof s.value === 'number' ? s.value.toLocaleString('es-ES') : s.value}
            </p>
          </div>
        ))}
      </section>

      {/* Row 1: Growth charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Registro de usuarios">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={usersByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 10 }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" fill="#fb923c" radius={[4, 4, 0, 0]} name="Usuarios" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Perros registrados">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dogsByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 10 }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Perros" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 2: Distributions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard title="Usuarios por rol">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={roleDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                {roleDistribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Perros por sexo">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={sexDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                {sexDistribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Camadas por estado">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={litterStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                {litterStatus.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 3: Top breeds + Countries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Top 10 razas">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topBreeds} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 10 }} />
              <YAxis dataKey="name" type="category" tick={{ fill: '#6b7280', fontSize: 10 }} width={120} />
              <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="value" name="Perros" radius={[0, 4, 4, 0]}>
                {topBreeds.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Usuarios por país">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topCountries} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 10 }} />
              <YAxis dataKey="name" type="category" tick={{ fill: '#6b7280', fontSize: 10 }} width={80} />
              <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="value" name="Usuarios" radius={[0, 4, 4, 0]}>
                {topCountries.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-hairline bg-canvas p-5">
      <h3 className="text-[16px] font-semibold tracking-[-0.02em] text-ink mb-4">{title}</h3>
      {children}
    </div>
  )
}
