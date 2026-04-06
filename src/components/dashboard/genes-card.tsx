'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Dna, ArrowDownCircle, ArrowUpCircle, ShoppingCart, History, X, Loader2 } from 'lucide-react'

interface Transaction {
  id: string
  type: 'ingreso' | 'gasto'
  amount: number
  description: string
  created_at: string
}

interface Props {
  balance: number
  userId: string
}

const PACKAGES = [
  { amount: 20, price: '1,99', popular: false },
  { amount: 100, price: '7,99', popular: true },
  { amount: 500, price: '29,99', popular: false },
  { amount: 1000, price: '49,99', popular: false },
]

export default function GenesCard({ balance, userId }: Props) {
  const [showHistory, setShowHistory] = useState(false)
  const [showBuy, setShowBuy] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loadingTx, setLoadingTx] = useState(false)

  async function openHistory() {
    setShowHistory(true)
    setLoadingTx(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('genes_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)
    setTransactions(data || [])
    setLoadingTx(false)
  }

  return (
    <>
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <Dna className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <p className="text-sm font-semibold">{balance?.toLocaleString() || 0} Genes</p>
            <p className="text-xs text-white/40">Tu saldo de genes</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/50 bg-white/5 hover:bg-white/10 transition"
          >
            <History className="w-3.5 h-3.5" /> Historial
          </button>
          <button
            onClick={() => setShowBuy(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#D74709] bg-[#D74709]/10 hover:bg-[#D74709]/20 transition"
          >
            <ShoppingCart className="w-3.5 h-3.5" /> Comprar
          </button>
        </div>
      </div>

      {/* History Panel */}
      {showHistory && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px]" onClick={() => setShowHistory(false)} />
          <div className="fixed top-0 right-0 h-full w-full max-w-md z-[70] bg-gray-900 border-l border-white/10 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Dna className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-semibold">Historial de Genes</h3>
              </div>
              <button onClick={() => setShowHistory(false)} className="text-white/30 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Balance header */}
            <div className="px-5 py-4 border-b border-white/5 text-center">
              <p className="text-3xl font-bold text-purple-400">{balance?.toLocaleString() || 0}</p>
              <p className="text-xs text-white/40 mt-1">Genes disponibles</p>
            </div>

            {/* Transactions */}
            <div className="flex-1 overflow-y-auto">
              {loadingTx ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-5 h-5 animate-spin text-white/20" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm text-white/30">No hay transacciones</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {transactions.map(tx => (
                    <div key={tx.id} className="px-5 py-3 flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        tx.type === 'ingreso' ? 'bg-green-500/10' : 'bg-red-500/10'
                      }`}>
                        {tx.type === 'ingreso' ? (
                          <ArrowDownCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <ArrowUpCircle className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{tx.description}</p>
                        <p className="text-[11px] text-white/30">
                          {new Date(tx.created_at).toLocaleDateString('es-ES', {
                            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <span className={`text-sm font-bold flex-shrink-0 ${
                        tx.type === 'ingreso' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {tx.type === 'ingreso' ? '+' : ''}{tx.amount}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Buy Panel */}
      {showBuy && (
        <>
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm" onClick={() => setShowBuy(false)} />
          <div className="fixed z-[101] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] max-w-[90vw] bg-gray-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
              <h3 className="text-sm font-semibold">Comprar Genes</h3>
              <button onClick={() => setShowBuy(false)} className="text-white/30 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-xs text-white/40 text-center mb-4">
                Los genes son la moneda de Genealogic. Usalos para importar pedigrees, verificar perros y mas.
              </p>
              {PACKAGES.map(pkg => (
                <button
                  key={pkg.amount}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition ${
                    pkg.popular
                      ? 'border-[#D74709] bg-[#D74709]/5 hover:bg-[#D74709]/10'
                      : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/15 flex items-center justify-center">
                      <Dna className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold">{pkg.amount} Genes</p>
                      {pkg.popular && <span className="text-[10px] text-[#D74709] font-semibold">MAS POPULAR</span>}
                    </div>
                  </div>
                  <span className="text-sm font-bold">{pkg.price} &euro;</span>
                </button>
              ))}
              <p className="text-[11px] text-white/20 text-center pt-2">
                Proximamente: pago con Stripe
              </p>
            </div>
          </div>
        </>
      )}
    </>
  )
}
