'use client'

import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Users, Dog, Store, Baby, HandCoins, Coins, Eye, Tag, TrendingUp, TrendingDown } from 'lucide-react'

interface Props {
  usersByMonth: any[]
  dogsByMonth: any[]
  kennelsByMonth: any[]
  roleDistribution: any[]
  sexDistribution: any[]
  topBreeds: any[]
  topCountries: any[]
  litterStatus: any[]
  genesMonthly: any[]
  dealsMonthly: any[]
  totals: {
    users: number; dogs: number; kennels: number; litters: number; deals: number
    totalDealValue: number; dogsPublic: number; dogsForSale: number; genesIn: number; genesOut: number
  }
}

const COLORS = ['#D74709', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#EF4444', '#6366F1', '#84CC16']

export default function AdminStatsClient({
  usersByMonth, dogsByMonth, kennelsByMonth, roleDistribution, sexDistribution,
  topBreeds, topCountries, litterStatus, genesMonthly, dealsMonthly, totals,
}: Props) {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Estadísticas</h1>
      <p className="text-white/40 text-sm mb-6">Métricas y análisis de la plataforma</p>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
        {[
          { icon: Users, label: 'Usuarios', value: totals.users, color: '#D74709' },
          { icon: Dog, label: 'Perros', value: totals.dogs, color: '#3B82F6' },
          { icon: Store, label: 'Criaderos', value: totals.kennels, color: '#10B981' },
          { icon: Baby, label: 'Camadas', value: totals.litters, color: '#8B5CF6' },
          { icon: HandCoins, label: 'Negocios', value: totals.deals, color: '#F59E0B' },
          { icon: Eye, label: 'Perros públicos', value: totals.dogsPublic, color: '#14B8A6' },
          { icon: Tag, label: 'En venta', value: totals.dogsForSale, color: '#EC4899' },
          { icon: TrendingUp, label: 'Genes entrada', value: totals.genesIn, color: '#10B981' },
          { icon: TrendingDown, label: 'Genes gasto', value: totals.genesOut, color: '#EF4444' },
          { icon: Coins, label: 'Valor negocios', value: `${totals.totalDealValue.toLocaleString('es-ES')} €`, color: '#F59E0B' },
        ].map(s => (
          <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: s.color + '15' }}>
              <s.icon className="w-5 h-5" style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-lg font-bold">{typeof s.value === 'number' ? s.value.toLocaleString('es-ES') : s.value}</p>
              <p className="text-[10px] text-white/30">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Row 1: Growth charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <ChartCard title="Registro de usuarios">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={usersByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" fill="#D74709" radius={[4, 4, 0, 0]} name="Usuarios" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Perros registrados">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dogsByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Perros" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 2: Distributions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <ChartCard title="Usuarios por rol">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={roleDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                {roleDistribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Perros por sexo">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={sexDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                {sexDistribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Camadas por estado">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={litterStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                {litterStatus.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 3: Top breeds + Countries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <ChartCard title="Top 10 razas">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topBreeds} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} />
              <YAxis dataKey="name" type="category" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} width={120} />
              <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="value" name="Perros" radius={[0, 4, 4, 0]}>
                {topBreeds.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Usuarios por país">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topCountries} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} />
              <YAxis dataKey="name" type="category" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} width={80} />
              <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="value" name="Usuarios" radius={[0, 4, 4, 0]}>
                {topCountries.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 4: Genes + Deals economy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <ChartCard title="Economía de genes (mensual)">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={genesMonthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="entrada" fill="#10B981" name="Entrada" radius={[4, 4, 0, 0]} />
              <Bar dataKey="gasto" fill="#EF4444" name="Gasto" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Negocios (mensual)">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={dealsMonthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} />
              <YAxis yAxisId="left" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line yAxisId="left" type="monotone" dataKey="valor" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} name="Valor (€)" />
              <Line yAxisId="right" type="monotone" dataKey="cantidad" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 3 }} name="Cantidad" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
      <h3 className="text-sm font-semibold mb-4">{title}</h3>
      {children}
    </div>
  )
}
