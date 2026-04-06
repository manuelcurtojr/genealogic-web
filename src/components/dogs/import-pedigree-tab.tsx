'use client'

import { useState } from 'react'
import { Loader2, Search, Globe, AlertTriangle, Check, ChevronRight, Dog } from 'lucide-react'

interface ImportDog {
  name: string; sex: string; registration: string | null; breed: string | null
  color: string | null; birth_date: string | null; health: string | null
  photo_url: string | null; father_name: string | null; mother_name: string | null
  generation?: number; breeder?: string | null; owner?: string | null
}

interface PedigreeData { main_dog: ImportDog; ancestors: ImportDog[] }

interface Props {
  userId: string
  kennelId?: string | null
  onImported?: () => void
}

export default function ImportPedigreeTab({ userId, kennelId, onImported }: Props) {
  const [url, setUrl] = useState('')
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState<PedigreeData | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [importing, setImporting] = useState(false)
  const [imported, setImported] = useState(false)

  async function handleScan() {
    if (!url.trim()) return
    setScanning(true)
    setError('')
    setData(null)

    try {
      const res = await fetch('/api/import-pedigree', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error)
      setData(result.data)
      setShowPreview(true)
    } catch (err: any) {
      setError(err.message || 'Error al escanear')
    }
    setScanning(false)
  }

  async function handleConfirm() {
    if (!data) return
    setImporting(true)
    setError('')

    try {
      const res = await fetch('/api/confirm-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mainDog: data.main_dog,
          ancestors: data.ancestors,
          userId,
          kennelId,
        }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error)
      setImported(true)
      setTimeout(() => { onImported?.() }, 1500)
    } catch (err: any) {
      setError(err.message || 'Error al importar')
    }
    setImporting(false)
  }

  // Full screen preview
  if (showPreview && data) {
    return (
      <div className="fixed inset-0 z-[100] bg-gray-950 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-gray-900 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold">Preview del pedigree</h2>
            <p className="text-xs text-white/40">{data.ancestors.length + 1} perros encontrados</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowPreview(false)} className="px-4 py-2 rounded-lg text-sm text-white/50 hover:text-white bg-white/5 hover:bg-white/10 transition">
              Volver
            </button>
            {imported ? (
              <div className="flex items-center gap-2 text-green-400 font-semibold text-sm">
                <Check className="w-4 h-4" /> Importado correctamente
              </div>
            ) : (
              <button onClick={handleConfirm} disabled={importing}
                className="bg-[#D74709] hover:bg-[#c03d07] text-white font-semibold px-6 py-2 rounded-lg transition disabled:opacity-50 flex items-center gap-2 text-sm">
                {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {importing ? 'Importando...' : 'Confirmar importacion'}
              </button>
            )}
          </div>
        </div>

        {error && <div className="mx-6 mt-3 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">{error}</div>}

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Main dog card */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-white/5 border border-[#D74709]/30 rounded-2xl p-5">
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-2xl ${data.main_dog.sex === 'Female' ? 'bg-pink-500/10 text-pink-400' : 'bg-blue-500/10 text-blue-400'}`}>
                  {data.main_dog.sex === 'Female' ? '♀' : '♂'}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{data.main_dog.name}</h3>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {data.main_dog.breed && <span className="text-xs bg-white/5 text-white/50 px-2 py-0.5 rounded">{data.main_dog.breed}</span>}
                    {data.main_dog.color && <span className="text-xs bg-white/5 text-white/50 px-2 py-0.5 rounded">{data.main_dog.color}</span>}
                    {data.main_dog.birth_date && <span className="text-xs bg-white/5 text-white/50 px-2 py-0.5 rounded">{data.main_dog.birth_date}</span>}
                    {data.main_dog.registration && <span className="text-xs bg-white/5 text-white/50 px-2 py-0.5 rounded">{data.main_dog.registration}</span>}
                    {data.main_dog.health && <span className="text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded">{data.main_dog.health}</span>}
                  </div>
                </div>
              </div>
              {(data.main_dog.breeder || data.main_dog.owner) && (
                <div className="flex gap-4 text-xs text-white/35 border-t border-white/5 pt-3">
                  {data.main_dog.breeder && <span>Criador: {data.main_dog.breeder}</span>}
                  {data.main_dog.owner && <span>Propietario: {data.main_dog.owner}</span>}
                </div>
              )}
            </div>
          </div>

          {/* Ancestors by generation */}
          {[1, 2, 3, 4, 5].map(gen => {
            const genDogs = data.ancestors.filter(a => a.generation === gen)
            if (genDogs.length === 0) return null
            const genLabel = gen === 1 ? 'Padres' : gen === 2 ? 'Abuelos' : gen === 3 ? 'Bisabuelos' : `Gen ${gen}`
            return (
              <div key={gen} className="max-w-4xl mx-auto mb-6">
                <h4 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-2">{genLabel} ({genDogs.length})</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {genDogs.map((dog, i) => (
                    <div key={i} className="bg-white/[0.03] border border-white/5 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs ${dog.sex === 'Female' ? 'text-pink-400' : 'text-blue-400'}`}>
                          {dog.sex === 'Female' ? '♀' : '♂'}
                        </span>
                        <p className="text-xs font-semibold truncate">{dog.name}</p>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {dog.breed && <span className="text-[9px] bg-white/5 text-white/30 px-1.5 py-0.5 rounded">{dog.breed}</span>}
                        {dog.birth_date && <span className="text-[9px] bg-white/5 text-white/30 px-1.5 py-0.5 rounded">{dog.birth_date}</span>}
                        {dog.health && <span className="text-[9px] bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded">{dog.health}</span>}
                      </div>
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

  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="text-[#D74709] mx-auto w-14 h-14 rounded-2xl bg-[#D74709]/10 flex items-center justify-center mb-3">
          <Globe className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold">Importar pedigree</h3>
        <p className="text-sm text-white/50 mt-1">Pega la URL de un pedigree online y lo escanearemos automaticamente con IA</p>
      </div>

      <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-orange-400">Compatible con la mayoria de webs: ingrus.net, pedigreedatabase.com, presadb.com y muchas mas.</p>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">{error}</div>}

      <div>
        <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1 block">URL del pedigree</label>
        <div className="flex gap-2">
          <input type="url" value={url} onChange={e => setUrl(e.target.value)}
            placeholder="https://ingrus.net/presa/..."
            onKeyDown={e => e.key === 'Enter' && handleScan()}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-[#D74709] focus:outline-none transition" />
          <button onClick={handleScan} disabled={scanning || !url.trim()}
            className="bg-[#D74709] hover:bg-[#c03d07] text-white font-semibold px-5 py-2.5 rounded-lg transition disabled:opacity-50 flex items-center gap-2 text-sm flex-shrink-0">
            {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {scanning ? 'Escaneando...' : 'Escanear'}
          </button>
        </div>
      </div>

      {scanning && (
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-[#D74709] mx-auto mb-3" />
          <p className="text-sm text-white/50">Escaneando pedigree con IA...</p>
          <p className="text-xs text-white/25 mt-1">Esto puede tardar hasta 30 segundos</p>
        </div>
      )}

      {imported && (
        <div className="text-center py-6">
          <div className="w-16 h-16 rounded-full bg-green-500/15 mx-auto flex items-center justify-center mb-3">
            <Check className="w-8 h-8 text-green-400" />
          </div>
          <p className="text-sm font-semibold text-green-400">Pedigree importado correctamente</p>
        </div>
      )}
    </div>
  )
}
