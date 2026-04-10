'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Search, Globe, AlertTriangle, Check, X, Link2, ArrowLeftRight, Undo2 } from 'lucide-react'

interface ImportDog {
  name: string; sex: string; registration: string | null; breed: string | null
  color: string | null; birth_date: string | null; health: string | null
  photo_url: string | null; father_name: string | null; mother_name: string | null
  generation?: number; breeder?: string | null; owner?: string | null
}

interface PedigreeData { main_dog: ImportDog; ancestors: ImportDog[] }

interface Props { userId: string; kennelId?: string | null; onImported?: () => void }

const CW = 190, CH = 58
const L = 'var(--pedigree-line, rgba(255,255,255,0.12))'

export default function ImportPedigreeTab({ userId, kennelId, onImported }: Props) {
  const [url, setUrl] = useState('')
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState<PedigreeData | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [importing, setImporting] = useState(false)
  const [imported, setImported] = useState(false)
  const [importResult, setImportResult] = useState<any>(null)
  const [editedMain, setEditedMain] = useState<ImportDog | null>(null)
  const [editedAncestors, setEditedAncestors] = useState<ImportDog[]>([])
  const [swaps, setSwaps] = useState<Record<string, { id: string; name: string; breed?: string; photo?: string }>>({})
  const [swapTarget, setSwapTarget] = useState<string | null>(null)
  const [swapSearch, setSwapSearch] = useState('')
  const [swapResults, setSwapResults] = useState<any[]>([])
  const [swapSearching, setSwapSearching] = useState(false)
  const [importPhotos, setImportPhotos] = useState(true)
  const [importAncestors, setImportAncestors] = useState(true)
  const [maxGen, setMaxGen] = useState(5)
  const [zoom, setZoom] = useState(100)
  const [genMenu, setGenMenu] = useState(false)
  const [zoomMenu, setZoomMenu] = useState(false)

  const [uploadingImage, setUploadingImage] = useState(false)

  async function handleScan() {
    if (!url.trim()) return
    setScanning(true); setError(''); setData(null); setSwaps({})
    try {
      // Strategy 1: Fetch HTML from the USER'S BROWSER (bypasses datacenter IP blocks)
      let clientHtml: string | null = null
      try {
        const proxyUrl = `/api/proxy-fetch?url=${encodeURIComponent(url.trim())}`
        const proxyRes = await fetch(proxyUrl, { signal: AbortSignal.timeout(15000) })
        if (proxyRes.ok) {
          const html = await proxyRes.text()
          if (html.length > 3000 && !html.includes('403 Forbidden')) clientHtml = html
        }
      } catch {}

      // Strategy 2: Send HTML or URL to the AI extraction API
      const res = await fetch('/api/import-pedigree', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientHtml ? { htmlContent: clientHtml, sourceUrl: url.trim() } : { url: url.trim() }),
      })
      let result
      try {
        result = await res.json()
      } catch {
        throw new Error(res.status === 504 ? 'Timeout del servidor. La petición tardó demasiado.' : `Error del servidor (${res.status}). Intenta de nuevo o sube un screenshot.`)
      }
      if (!res.ok) throw new Error(result.error || 'Error al escanear')
      if (!result.data?.main_dog?.name) {
        setError('No se pudo extraer datos de esta web. Prueba a subir un screenshot manual del pedigrí.')
        setScanning(false); return
      }
      setData(result.data)
      setEditedMain(result.data.main_dog)
      setEditedAncestors(result.data.ancestors || [])
      setShowPreview(true)
    } catch (err: any) { setError(err.message || 'Error al escanear') }
    setScanning(false)
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImage(true); setError(''); setData(null); setSwaps({})
    try {
      const reader = new FileReader()
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => { const result = reader.result as string; resolve(result.split(',')[1]) }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      const res = await fetch('/api/import-pedigree', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageBase64: base64 }) })
      let result
      try { result = await res.json() } catch { throw new Error('Error del servidor. Intenta de nuevo.') }
      if (!res.ok) throw new Error(result.error || 'Error al analizar')
      if (!result.data?.main_dog?.name) { setError('No se pudo extraer datos de la imagen.'); setUploadingImage(false); return }
      setData(result.data)
      setEditedMain(result.data.main_dog)
      setEditedAncestors(result.data.ancestors || [])
      setShowPreview(true)
    } catch (err: any) { setError(err.message || 'Error al analizar la imagen') }
    setUploadingImage(false)
  }

  async function searchSwap(query: string) {
    if (query.length < 2) { setSwapResults([]); return }
    setSwapSearching(true)
    const supabase = createClient()
    const { data } = await supabase.from('dogs').select('id, name, sex, thumbnail_url, breed:breeds(name)').ilike('name', `%${query}%`).limit(15)
    setSwapResults(data || [])
    setSwapSearching(false)
  }

  function applySwap(dogName: string, existing: any) {
    setSwaps(prev => ({ ...prev, [dogName]: { id: existing.id, name: existing.name, breed: (existing.breed as any)?.name, photo: existing.thumbnail_url } }))
    setSwapTarget(null); setSwapSearch(''); setSwapResults([])
  }

  function removeSwap(dogName: string) {
    setSwaps(prev => { const next = { ...prev }; delete next[dogName]; return next })
  }

  async function handleConfirm() {
    if (!editedMain) return
    setImporting(true); setError('')
    try {
      const res = await fetch('/api/confirm-import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mainDog: editedMain, ancestors: importAncestors ? editedAncestors : [], userId, kennelId, swaps, importPhotos }) })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error)
      setImportResult(result)
      setImported(true)
    } catch (err: any) { setError(err.message || 'Error al importar') }
    setImporting(false)
  }

  async function handleUndo() {
    if (!importResult?.importId) return
    try {
      const res = await fetch('/api/confirm-import', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ importId: importResult.importId, userId }) })
      if (res.ok) { setImported(false); setImportResult(null); setShowPreview(false); setData(null) }
    } catch {}
  }

  const byName = useMemo(() => {
    if (!editedMain) return new Map<string, ImportDog>()
    const m = new Map<string, ImportDog>()
    m.set(editedMain.name, editedMain)
    editedAncestors.forEach(a => m.set(a.name, a))
    return m
  }, [editedMain, editedAncestors])

  const totalDogs = editedAncestors.length + 1
  const swappedCount = Object.keys(swaps).length

  // ===== PREVIEW =====
  if (showPreview && editedMain) {
    return (
      <div className="fixed inset-0 z-[100] bg-gray-950 flex flex-col">
        <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-gray-900 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold">{editedMain.name}</h2>
            <p className="text-xs text-white/40">{totalDogs} perros · {totalDogs - swappedCount} nuevos · {swappedCount} existentes</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs text-white/50 cursor-pointer">
              <input type="checkbox" checked={importPhotos} onChange={e => setImportPhotos(e.target.checked)} className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 text-[#D74709] focus:ring-0" />Fotos
            </label>
            <label className="flex items-center gap-1.5 text-xs text-white/50 cursor-pointer">
              <input type="checkbox" checked={importAncestors} onChange={e => setImportAncestors(e.target.checked)} className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 text-[#D74709] focus:ring-0" />Ancestros
            </label>
            <button onClick={() => { setShowPreview(false); setSwaps({}) }} className="px-4 py-2 rounded-lg text-sm text-white/50 hover:text-white bg-white/5 hover:bg-white/10 transition">Volver</button>
            {imported ? (
              <div className="flex items-center gap-2">
                <span className="text-green-400 font-semibold text-sm flex items-center gap-1"><Check className="w-4 h-4" /> Importado</span>
                {importResult?.mainDogId && <a href={`/dogs/${importResult.mainDogId}`} className="text-xs text-[#D74709] hover:underline">Ver perro</a>}
                <button onClick={handleUndo} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"><Undo2 className="w-3 h-3" /> Deshacer</button>
                <button onClick={() => { setImported(false); setImportResult(null); setShowPreview(false); setData(null); setUrl('') }} className="text-xs text-white/40 hover:text-white">Importar otro</button>
              </div>
            ) : (
              <button onClick={handleConfirm} disabled={importing} className="bg-[#D74709] hover:bg-[#c03d07] text-white font-semibold px-6 py-2 rounded-lg transition disabled:opacity-50 flex items-center gap-2 text-sm">
                {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {importing ? 'Importando...' : 'Importar pedigrí'}
              </button>
            )}
          </div>
        </div>
        {error && <div className="mx-6 mt-3 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">{error}</div>}
        <div className="flex-1 overflow-auto relative" onClick={() => { setGenMenu(false); setZoomMenu(false) }}>
          <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}>
            <div className="min-w-max min-h-max py-6 px-4 pb-24">
              <TN name={editedMain.name} byName={byName} swaps={swaps} g={0} mx={maxGen} isRoot onSwap={n => { setSwapTarget(n); setSwapSearch(''); setSwapResults([]) }} onRemoveSwap={removeSwap} />
            </div>
          </div>
          <div className="absolute bottom-4 left-4 z-30 flex items-center gap-2">
            <div className="relative">
              <button onClick={e => { e.stopPropagation(); setZoomMenu(!zoomMenu); setGenMenu(false) }} className="w-11 h-11 rounded-full bg-gray-900 border border-white/10 flex items-center justify-center text-white/60 shadow-lg hover:border-white/30 transition"><Search className="w-4 h-4" /></button>
              {zoomMenu && <div className="absolute bottom-14 left-0 bg-gray-800 border border-white/10 rounded-lg shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>{[150,130,110,100,90,80,70,60,50].map(z=><button key={z} onClick={()=>{setZoom(z);setZoomMenu(false)}} className={`block w-full px-4 py-1.5 text-xs text-center transition ${zoom===z?'bg-[#D74709] text-white':'text-white/60 hover:bg-white/10'}`}>{z}%</button>)}</div>}
            </div>
            <div className="relative">
              <button onClick={e => { e.stopPropagation(); setGenMenu(!genMenu); setZoomMenu(false) }} className="w-11 h-11 rounded-full bg-gray-900 border border-white/10 flex items-center justify-center text-white/60 shadow-lg hover:border-white/30 font-bold text-xs transition">x{maxGen}</button>
              {genMenu && <div className="absolute bottom-14 left-0 bg-gray-800 border border-white/10 rounded-lg shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>{[10,8,6,5,4,3].map(g=><button key={g} onClick={()=>{setMaxGen(g);setGenMenu(false)}} className={`block w-full px-4 py-1.5 text-xs text-center transition ${maxGen===g?'bg-[#D74709] text-white':'text-white/60 hover:bg-white/10'}`}>x{g}</button>)}</div>}
            </div>
          </div>
        </div>
        {/* Swap modal */}
        {swapTarget && (<>
          <div className="fixed inset-0 z-[110] bg-black/60" onClick={() => setSwapTarget(null)} />
          <div className="fixed z-[111] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] max-w-[90vw] bg-gray-900 border border-white/10 rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
              <div><h3 className="text-sm font-semibold">Cambiar perro</h3><p className="text-[10px] text-white/30">{swapTarget}</p></div>
              <button onClick={() => setSwapTarget(null)} className="text-white/30 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-3">
              {swaps[swapTarget] && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-white/5 flex-shrink-0">{swaps[swapTarget].photo ? <img src={swaps[swapTarget].photo} alt="" className="w-full h-full object-cover" /> : null}</div>
                  <div className="flex-1"><p className="text-xs font-semibold text-green-400">{swaps[swapTarget].name}</p><p className="text-[10px] text-white/30">{swaps[swapTarget].breed || 'Existente'}</p></div>
                  <button onClick={() => removeSwap(swapTarget)} className="text-xs text-red-400 hover:text-red-300">Quitar</button>
                </div>
              )}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input type="text" value={swapSearch} onChange={e => { setSwapSearch(e.target.value); searchSwap(e.target.value) }} placeholder="Buscar perro existente..." autoFocus className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#D74709] focus:outline-none" />
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {swapSearching && <div className="text-center py-3"><Loader2 className="w-4 h-4 animate-spin text-white/30 mx-auto" /></div>}
                {swapResults.map(d => (
                  <button key={d.id} onClick={() => applySwap(swapTarget, d)} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-white/60 hover:bg-white/5 transition text-left">
                    <div className="w-7 h-7 rounded-full overflow-hidden bg-white/5 border flex-shrink-0" style={{ borderColor: d.sex === 'male' ? '#017DFA' : '#e84393' }}>{d.thumbnail_url ? <img src={d.thumbnail_url} alt="" className="w-full h-full object-cover" /> : null}</div>
                    <span className="truncate flex-1 font-medium">{d.name}</span>
                    <span className="text-[10px] text-white/20">{(d.breed as any)?.name}</span>
                  </button>
                ))}
              </div>
              <div className="flex gap-2 pt-2 border-t border-white/10">
                <button onClick={() => setSwapTarget(null)} className="flex-1 px-3 py-2 rounded-lg text-xs text-white/50 bg-white/5 hover:bg-white/10 transition">Mantener original</button>
                {swaps[swapTarget] && <button onClick={() => setSwapTarget(null)} className="flex-1 px-3 py-2 rounded-lg text-xs text-white font-medium bg-[#D74709] hover:bg-[#c03d07] transition">Usar seleccionado</button>}
              </div>
            </div>
          </div>
        </>)}
      </div>
    )
  }

  // ===== SCAN SCREEN =====
  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="text-[#D74709] mx-auto w-14 h-14 rounded-2xl bg-[#D74709]/10 flex items-center justify-center mb-3"><Globe className="w-7 h-7" /></div>
        <h3 className="text-lg font-bold">Importar pedigrí</h3>
        <p className="text-sm text-white/50 mt-1">Pega la URL de un pedigrí online y lo escanearemos automáticamente con IA</p>
      </div>
      <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-orange-400">Compatible con la mayoría de webs: ingrus.net, pedigreedatabase.com, presadb.com y muchas más.</p>
      </div>
      {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">{error}</div>}
      <div>
        <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1 block">URL del pedigrí</label>
        <div className="flex gap-2">
          <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://presadb.com/dogocanario/nombre-del-perro" onKeyDown={e => e.key === 'Enter' && handleScan()} className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-[#D74709] focus:outline-none transition" />
          <button onClick={handleScan} disabled={scanning || !url.trim()} className="bg-[#D74709] hover:bg-[#c03d07] text-white font-semibold px-5 py-2.5 rounded-lg transition disabled:opacity-50 flex items-center gap-2 text-sm flex-shrink-0">
            {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {scanning ? 'Escaneando...' : 'Escanear'}
          </button>
        </div>
      </div>
      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 border-t border-white/10" />
        <span className="text-xs text-white/20">o</span>
        <div className="flex-1 border-t border-white/10" />
      </div>

      {/* Image upload */}
      <div>
        <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1 block">Subir screenshot del pedigrí</label>
        <label className={`flex items-center justify-center gap-2 border-2 border-dashed border-white/10 rounded-lg py-4 cursor-pointer hover:border-white/20 hover:bg-white/[0.02] transition ${uploadingImage ? 'opacity-50 pointer-events-none' : ''}`}>
          {uploadingImage ? (
            <><Loader2 className="w-4 h-4 animate-spin text-[#D74709]" /><span className="text-sm text-white/50">Analizando imagen con IA...</span></>
          ) : (
            <><Globe className="w-4 h-4 text-white/30" /><span className="text-sm text-white/40">Arrastra o haz clic para subir una imagen</span></>
          )}
          <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
        </label>
        <p className="text-[10px] text-white/20 mt-1">Si la web bloquea el escaneo automático, haz un screenshot del pedigrí y súbelo aquí</p>
      </div>

      {(scanning || uploadingImage) && (
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-[#D74709] mx-auto mb-3" />
          <p className="text-sm text-white/50">{uploadingImage ? 'Analizando imagen con IA...' : 'Escaneando pedigrí con IA...'}</p>
          <p className="text-xs text-white/25 mt-1">Esto puede tardar hasta 30 segundos</p>
        </div>
      )}
    </div>
  )
}

// ===== TREE NODE =====
function TN({ name, byName, swaps, g, mx, isRoot, onSwap, onRemoveSwap }: {
  name: string; byName: Map<string, ImportDog>; swaps: Record<string, any>; g: number; mx: number; isRoot?: boolean
  onSwap: (n: string) => void; onRemoveSwap: (n: string) => void
}) {
  const dog = byName.get(name)
  if (!dog) return <div className="w-8 h-8 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center text-white/15 text-xs">?</div>
  if (g >= mx) return <Card dog={dog} swaps={swaps} isRoot={isRoot} onSwap={onSwap} onRemoveSwap={onRemoveSwap} />
  const hasFather = !!dog.father_name && byName.has(dog.father_name)
  const hasMother = !!dog.mother_name && byName.has(dog.mother_name)
  if (!hasFather && !hasMother) return <Card dog={dog} swaps={swaps} isRoot={isRoot} onSwap={onSwap} onRemoveSwap={onRemoveSwap} />

  const wrapRef = useRef<HTMLDivElement>(null)
  const fRef = useRef<HTMLDivElement>(null)
  const mRef = useRef<HTMLDivElement>(null)
  const [lines, setLines] = useState<{ x1: number; y1: number; x2: number; y2: number }[]>([])

  useEffect(() => {
    if (!wrapRef.current || !fRef.current || !mRef.current) return
    const wr = wrapRef.current.getBoundingClientRect()
    const fr = fRef.current.getBoundingClientRect()
    const mr = mRef.current.getBoundingClientRect()
    const fMidY = fr.top - wr.top + fr.height / 2
    const mMidY = mr.top - wr.top + mr.height / 2
    const cardMidY = (fMidY + mMidY) / 2
    setLines([
      { x1: CW, y1: cardMidY, x2: CW + 45, y2: cardMidY },
      { x1: CW + 45, y1: fMidY, x2: CW + 45, y2: mMidY },
      { x1: CW + 45, y1: fMidY, x2: CW + 60, y2: fMidY },
      { x1: CW + 45, y1: mMidY, x2: CW + 60, y2: mMidY },
    ])
  })

  return (
    <div ref={wrapRef} className="relative flex items-center">
      <div className="absolute" style={{ left: 0, top: '50%', transform: 'translateY(-50%)' }}>
        <Card dog={dog} swaps={swaps} isRoot={isRoot} onSwap={onSwap} onRemoveSwap={onRemoveSwap} />
      </div>
      <svg className="absolute inset-0 pointer-events-none" style={{ overflow: 'visible' }}>
        {lines.map((l, i) => <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={L} strokeWidth={1} />)}
      </svg>
      <div style={{ marginLeft: CW + 60, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div ref={fRef}>{hasFather ? <TN name={dog.father_name!} byName={byName} swaps={swaps} g={g + 1} mx={mx} onSwap={onSwap} onRemoveSwap={onRemoveSwap} /> : <div className="w-8 h-8 rounded-full border-2 border-dashed border-blue-400/20 flex items-center justify-center text-blue-400/30 text-xs">♂</div>}</div>
        <div ref={mRef}>{hasMother ? <TN name={dog.mother_name!} byName={byName} swaps={swaps} g={g + 1} mx={mx} onSwap={onSwap} onRemoveSwap={onRemoveSwap} /> : <div className="w-8 h-8 rounded-full border-2 border-dashed border-pink-400/20 flex items-center justify-center text-pink-400/30 text-xs">♀</div>}</div>
      </div>
    </div>
  )
}

function Card({ dog, swaps, isRoot, onSwap, onRemoveSwap }: { dog: ImportDog; swaps: Record<string, any>; isRoot?: boolean; onSwap: (n: string) => void; onRemoveSwap: (n: string) => void }) {
  const swap = swaps[dog.name]
  const sc = dog.sex === 'Female' ? '#e84393' : '#017DFA'
  const isSwapped = !!swap
  return (
    <div className={`relative group rounded-xl overflow-hidden transition ${isSwapped ? 'border-2 border-green-500/40 bg-green-500/5' : isRoot ? 'border-2 border-[#D74709] bg-white/[0.04]' : 'border border-white/10 bg-white/[0.04]'}`} style={{ width: CW, minHeight: CH, flexShrink: 0 }}>
      <div className="flex items-stretch" style={{ minHeight: CH }}>
        <div className="flex-shrink-0 bg-white/5 relative" style={{ width: 48 }}>
          {isSwapped && swap.photo ? <img src={swap.photo} alt="" className="w-full h-full object-cover" /> : dog.photo_url ? <img src={dog.photo_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white/10 text-sm">{dog.sex === 'Female' ? '♀' : '♂'}</div>}
          <div className="absolute top-0 right-0 bottom-0 w-[3px]" style={{ backgroundColor: sc }} />
        </div>
        <div className="flex-1 min-w-0 px-2 py-1.5 flex flex-col justify-center">
          <p className="text-[11px] font-bold text-white leading-tight truncate">{isSwapped ? swap.name : dog.name}</p>
          {isSwapped ? (
            <span className="text-[9px] font-bold text-green-400 flex items-center gap-0.5 mt-0.5"><Link2 className="w-2.5 h-2.5" /> Existente</span>
          ) : (
            <div className="flex flex-wrap gap-0.5 mt-0.5">
              {dog.breed && <span className="text-[8px] bg-white/5 text-white/30 px-1 py-0.5 rounded">{dog.breed}</span>}
              {dog.birth_date && <span className="text-[8px] bg-white/5 text-white/30 px-1 py-0.5 rounded">{dog.birth_date}</span>}
              {dog.health && <span className="text-[8px] bg-green-500/10 text-green-400 px-1 py-0.5 rounded">{dog.health}</span>}
            </div>
          )}
        </div>
      </div>
      <button onClick={() => isSwapped ? onRemoveSwap(dog.name) : onSwap(dog.name)}
        className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-black/40 flex items-center justify-center transition">
        <span className="text-[10px] font-bold text-white flex items-center gap-1">
          {isSwapped ? <><X className="w-3 h-3" /> Quitar</> : <><ArrowLeftRight className="w-3 h-3" /> Cambiar</>}
        </span>
      </button>
    </div>
  )
}
