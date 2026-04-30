'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { Search, ArrowLeftRight, Plus, GitBranch } from 'lucide-react'

interface PN {
  id: string; name: string; sex: string; registration: string | null
  father_id: string | null; mother_id: string | null; generation: number
  photo_url: string | null; breed_name: string | null; color_name: string | null
}

interface Props {
  data: PN[]
  rootId: string
  onClickDog: (dogId: string) => void
  onClickEmpty: (parentDogId: string, role: 'father' | 'mother') => void
}

const CW = 200, CH = 64, PH = 56
const L = 'var(--pedigree-line, rgba(255,255,255,0.12))'

export default function AdminPedigreeTree({ data, rootId, onClickDog, onClickEmpty }: Props) {
  const [maxGen, setMaxGen] = useState(4)
  const [zoom, setZoom] = useState(100)
  const [genMenu, setGenMenu] = useState(false)
  const [zoomMenu, setZoomMenu] = useState(false)
  const [vert, setVert] = useState(false)

  const nm = useMemo(() => { const m = new Map<string, PN>(); data.forEach(n => m.set(n.id, n)); return m }, [data])
  const root = nm.get(rootId)
  if (!root) return null

  const close = () => { setGenMenu(false); setZoomMenu(false) }

  return (
    <div className="relative h-full" onClick={close}>
      <div className="h-full overflow-auto" style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}>
        <div className="min-w-max min-h-full flex items-center py-6 px-4 pb-24">
          <HN n={root} nm={nm} g={0} mx={maxGen} isRoot onClickDog={onClickDog} onClickEmpty={onClickEmpty} />
        </div>
      </div>

      {/* Controls — bottom left of this container */}
      <div className="absolute bottom-4 left-4 z-30 flex items-center gap-2">
        <div className="relative">
          <button onClick={e => { e.stopPropagation(); setZoomMenu(!zoomMenu); setGenMenu(false) }}
            className="w-11 h-11 rounded-full bg-ink-800 border border-hair flex items-center justify-center text-fg-dim shadow-lg hover:border-hair-strong transition">
            <Search className="w-4 h-4" />
          </button>
          {zoomMenu && (
            <div className="absolute bottom-14 left-0 bg-ink-800 border border-hair rounded-lg shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
              {[150, 130, 110, 100, 90, 80, 70, 60, 50].map(z => (
                <button key={z} onClick={() => { setZoom(z); setZoomMenu(false) }}
                  className={`block w-full px-4 py-1.5 text-xs text-center transition ${zoom === z ? 'bg-[#D74709] text-white' : 'text-fg-dim hover:bg-chip'}`}>{z}%</button>
              ))}
            </div>
          )}
        </div>
        <div className="relative">
          <button onClick={e => { e.stopPropagation(); setGenMenu(!genMenu); setZoomMenu(false) }}
            className="w-11 h-11 rounded-full bg-ink-800 border border-hair flex items-center justify-center text-fg-dim shadow-lg hover:border-hair-strong font-bold text-xs transition">x{maxGen}</button>
          {genMenu && (
            <div className="absolute bottom-14 left-0 bg-ink-800 border border-hair rounded-lg shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
              {[10, 9, 8, 7, 6, 5, 4, 3].map(g => (
                <button key={g} onClick={() => { setMaxGen(g); setGenMenu(false) }}
                  className={`block w-full px-4 py-1.5 text-xs text-center transition ${maxGen === g ? 'bg-[#D74709] text-white' : 'text-fg-dim hover:bg-chip'}`}>x{g}</button>
              ))}
            </div>
          )}
        </div>
        <button onClick={() => setVert(!vert)} className={`w-11 h-11 rounded-full border flex items-center justify-center shadow-lg transition ${vert ? 'bg-[#D74709] border-[#D74709] text-white' : 'bg-ink-800 border-hair text-fg-dim hover:border-hair-strong'}`}>
          <ArrowLeftRight className="w-4 h-4" />
        </button>
        <button onClick={e => { e.stopPropagation(); }} className="w-11 h-11 rounded-full bg-ink-800 border border-hair flex items-center justify-center text-fg-dim shadow-lg hover:border-hair-strong transition">
          <GitBranch className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

function Card({ n, isRoot, onClickDog }: { n: PN; isRoot?: boolean; onClickDog: (id: string) => void }) {
  const sc = n.sex === 'male' ? '#017DFA' : '#e84393'
  return (
    <button onClick={() => onClickDog(n.id)}
      className={`flex items-stretch bg-ink-800 border ${isRoot ? 'border-[#D74709]' : 'border-hair'} rounded-xl overflow-hidden hover:bg-chip hover:border-hair-strong transition relative text-left`}
      style={{ width: CW, height: CH, flexShrink: 0 }}>
      <div className="flex-shrink-0 bg-chip relative" style={{ width: PH }}>
        {n.photo_url ? <img src={n.photo_url} alt="" className="w-full h-full object-cover" /> :
          <div className="w-full h-full flex items-center justify-center"><img src="/icon.svg" alt="" className="w-5 h-5 opacity-20" /></div>}
        <div className="absolute top-0 right-0 bottom-0 w-[3px]" style={{ backgroundColor: sc }} />
      </div>
      <div className="flex-1 min-w-0 px-2.5 py-1.5 flex flex-col justify-center overflow-hidden">
        <p className="text-[12px] font-bold text-white leading-tight whitespace-nowrap"
          style={{ maskImage: 'linear-gradient(to right,black 80%,transparent)', WebkitMaskImage: 'linear-gradient(to right,black 80%,transparent)' }}>{n.name}</p>
        {n.breed_name && <p className="text-[10px] text-fg-mute truncate mt-0.5">{n.breed_name}</p>}
      </div>
    </button>
  )
}

function EmptySlot({ parentDogId, role, onClickEmpty }: { parentDogId: string; role: 'father' | 'mother'; onClickEmpty: (parentId: string, role: 'father' | 'mother') => void }) {
  const isFather = role === 'father'
  const bc = isFather ? 'border-blue-400/30 hover:border-blue-400/60' : 'border-pink-400/30 hover:border-pink-400/60'
  const tc = isFather ? 'text-blue-400' : 'text-pink-400'
  const bg = isFather ? 'hover:bg-blue-500/5' : 'hover:bg-pink-500/5'
  return (
    <button onClick={() => onClickEmpty(parentDogId, role)}
      className={`border-2 border-dashed ${bc} ${bg} rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer`}
      style={{ width: CW, height: CH, flexShrink: 0 }}>
      <Plus className={`w-4 h-4 ${tc}`} />
      <span className={`text-xs font-medium ${tc}`}>{isFather ? 'Padre' : 'Madre'}</span>
    </button>
  )
}

function HN({ n, nm, g, mx, isRoot, onClickDog, onClickEmpty }: {
  n: PN; nm: Map<string, PN>; g: number; mx: number; isRoot?: boolean
  onClickDog: (id: string) => void; onClickEmpty: (parentId: string, role: 'father' | 'mother') => void
}) {
  if (g >= mx) return <Card n={n} isRoot={isRoot} onClickDog={onClickDog} />
  const f = n.father_id ? nm.get(n.father_id) : null
  const m = n.mother_id ? nm.get(n.mother_id) : null

  if (!(f || m || !n.father_id || !n.mother_id) && g >= mx - 1) return <Card n={n} isRoot={isRoot} onClickDog={onClickDog} />

  const wrapRef = useRef<HTMLDivElement>(null)
  const fRef = useRef<HTMLDivElement>(null)
  const mRef = useRef<HTMLDivElement>(null)
  const [lines, setLines] = useState<{ x1: number; y1: number; x2: number; y2: number }[]>([])
  const hGap = 50

  useEffect(() => {
    if (!wrapRef.current || !fRef.current || !mRef.current) return
    const wr = wrapRef.current.getBoundingClientRect()
    const fr = fRef.current.getBoundingClientRect()
    const mr = mRef.current.getBoundingClientRect()
    const fMidY = fr.top - wr.top + fr.height / 2
    const mMidY = mr.top - wr.top + mr.height / 2
    const cardMidY = (fMidY + mMidY) / 2
    setLines([
      { x1: CW, y1: cardMidY, x2: CW + hGap, y2: cardMidY },
      { x1: CW + hGap, y1: fMidY, x2: CW + hGap, y2: mMidY },
      { x1: CW + hGap, y1: fMidY, x2: CW + hGap + 20, y2: fMidY },
      { x1: CW + hGap, y1: mMidY, x2: CW + hGap + 20, y2: mMidY },
    ])
  })

  return (
    <div ref={wrapRef} className="relative flex items-center">
      <div className="absolute" style={{ left: 0, top: '50%', transform: 'translateY(-50%)' }}>
        <Card n={n} isRoot={isRoot} onClickDog={onClickDog} />
      </div>
      <svg className="absolute inset-0 pointer-events-none" style={{ overflow: 'visible' }}>
        {lines.map((l, i) => <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={L} strokeWidth={1} />)}
      </svg>
      <div style={{ marginLeft: CW + hGap + 20, display: 'flex', flexDirection: 'column', gap: 30 }}>
        <div ref={fRef}>
          {f ? <HN n={f} nm={nm} g={g + 1} mx={mx} onClickDog={onClickDog} onClickEmpty={onClickEmpty} /> :
            <EmptySlot parentDogId={n.id} role="father" onClickEmpty={onClickEmpty} />}
        </div>
        <div ref={mRef}>
          {m ? <HN n={m} nm={nm} g={g + 1} mx={mx} onClickDog={onClickDog} onClickEmpty={onClickEmpty} /> :
            <EmptySlot parentDogId={n.id} role="mother" onClickEmpty={onClickEmpty} />}
        </div>
      </div>
    </div>
  )
}
