import { createClient } from '@/lib/supabase/server'
import { Coins, TrendingUp, TrendingDown, ArrowRightLeft } from 'lucide-react'

export default async function AdminGenesPage() {
  const supabase = await createClient()

  const { data: transactions } = await supabase
    .from('genes_transactions')
    .select('id, user_id, amount, type, description, created_at, user:profiles!genes_transactions_user_id_fkey(display_name, email)')
    .order('created_at', { ascending: false })
    .limit(100)

  const allTx = transactions || []
  const totalPurchased = allTx.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)
  const totalSpent = allTx.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Economía de genes</h1>
      <p className="text-white/40 text-sm mb-6">Transacciones y balances de la moneda virtual</p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-green-400" /></div>
          <div>
            <p className="text-xl font-bold">{totalPurchased.toLocaleString('es-ES')}</p>
            <p className="text-[10px] text-white/30">Genes añadidos</p>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center"><TrendingDown className="w-5 h-5 text-red-400" /></div>
          <div>
            <p className="text-xl font-bold">{totalSpent.toLocaleString('es-ES')}</p>
            <p className="text-[10px] text-white/30">Genes gastados</p>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center"><ArrowRightLeft className="w-5 h-5 text-blue-400" /></div>
          <div>
            <p className="text-xl font-bold">{allTx.length}</p>
            <p className="text-[10px] text-white/30">Transacciones</p>
          </div>
        </div>
      </div>

      {/* Transactions table */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left text-[10px] font-semibold text-white/40 uppercase tracking-wider px-4 py-3">Usuario</th>
              <th className="text-left text-[10px] font-semibold text-white/40 uppercase tracking-wider px-4 py-3">Cantidad</th>
              <th className="text-left text-[10px] font-semibold text-white/40 uppercase tracking-wider px-4 py-3">Tipo</th>
              <th className="text-left text-[10px] font-semibold text-white/40 uppercase tracking-wider px-4 py-3">Descripción</th>
              <th className="text-left text-[10px] font-semibold text-white/40 uppercase tracking-wider px-4 py-3">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {allTx.map(t => {
              const user = t.user as any
              const isPositive = t.amount > 0
              return (
                <tr key={t.id} className="border-b border-white/5 hover:bg-white/[0.02] transition">
                  <td className="px-4 py-3">
                    <p className="text-xs font-medium">{user?.display_name || '—'}</p>
                    <p className="text-[10px] text-white/30">{user?.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                      {isPositive ? '+' : ''}{t.amount}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-white/40">{t.type}</td>
                  <td className="px-4 py-3 text-xs text-white/50 max-w-[300px] truncate">{t.description || '—'}</td>
                  <td className="px-4 py-3 text-[10px] text-white/30">
                    {new Date(t.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {allTx.length === 0 && <p className="text-center py-8 text-white/30 text-sm">Sin transacciones</p>}
      </div>
    </div>
  )
}
