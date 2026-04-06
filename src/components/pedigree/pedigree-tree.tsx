'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, ArrowLeftRight, GitBranch, ChevronLeft, ChevronRight, Dna, CheckCircle } from 'lucide-react'
import { calculateCOI, getCOILevel, getCOIInterpretation } from './coi-calculator'

interface PedigreeNode {
  id: string; name: string; sex: string; registration: string | null
  father_id: string | null; mother_id: string | null; generation: number
  photo_url: string | null; breed_name: string | null; color_name: string | null
}
interface Props { data: PedigreeNode[]; rootId: string }

function countOccurrences(nId: string | null, nm: Map<string, PedigreeNode>, mx: number, g: number, c: Map<string, number>) {
  if (!nId || g > mx) return; const n = nm.get(nId); if (!n) return
  c.set(nId, (c.get(nId) || 0) + 1)
  countOccurrences(n.father_id, nm, mx, g + 1, c); countOccurrences(n.mother_id, nm, mx, g + 1, c)
}
const RC = ['', '', '#3498db', '#27ae60', '#f39c12', '#e74c3c', '#9b59b6', '#e84393']

export default function PedigreeTree({ data, rootId }: Props) {
  const [maxGen, setMaxGen] = useState(4)
  const [zoom, setZoom] = useState(100)
  const [showInbreeding, setShowInbreeding] = useState(false)
  const [coiPanelOpen, setCoiPanelOpen] = useState(false)
  const [genMenuOpen, setGenMenuOpen] = useState(false)
  const [zoomMenuOpen, setZoomMenuOpen] = useState(false)
  const [vertical, setVertical] = useState(false)

  const nodeMap = useMemo(() => { const m = new Map<string, PedigreeNode>(); data.forEach(n => m.set(n.id, n)); return m }, [data])
  const root = nodeMap.get(rootId)
  if (!root) return null

  const coi = useMemo(() => calculateCOI(rootId, data, 10), [rootId, data])
  const coiLevel = getCOILevel(coi)
  const coiText = getCOIInterpretation(coi)
  const repeatCounts = useMemo(() => { const c = new Map<string, number>(); countOccurrences(root.father_id, nodeMap, maxGen, 1, c); countOccurrences(root.mother_id, nodeMap, maxGen, 1, c); return c }, [root, nodeMap, maxGen])
  const coiC: Record<string, { bg: string; text: string }> = { green: { bg: 'bg-green-500/15', text: 'text-green-400' }, orange: { bg: 'bg-orange-500/15', text: 'text-orange-400' }, red: { bg: 'bg-red-500/15', text: 'text-red-400' } }
  const toggleInbreeding = () => { setShowInbreeding(s => !s); setCoiPanelOpen(p => !p) }
  const closeMenus = () => { setGenMenuOpen(false); setZoomMenuOpen(false) }

  return (
    <div className="relative" onClick={closeMenus}>
      <div className="overflow-auto pb-20" style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}>
        <div className={`min-w-max py-4 ${vertical ? 'flex flex-col items-center' : 'flex items-center'}`}>
          {vertical
            ? <VNode node={root} nodeMap={nodeMap} gen={0} maxGen={maxGen} isRoot si={showInbreeding} rc={repeatCounts} />
            : <HNode node={root} nodeMap={nodeMap} gen={0} maxGen={maxGen} isRoot si={showInbreeding} rc={repeatCounts} />}
        </div>
      </div>

      {/* COI Panel */}
      <div className={`fixed top-[56px] right-0 bottom-0 w-[300px] z-[55] bg-gray-900 border-l border-white/10 shadow-2xl transition-transform duration-300 flex flex-col ${coiPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <button onClick={() => setCoiPanelOpen(!coiPanelOpen)} className="absolute -left-7 top-1/2 -translate-y-1/2 w-7 h-14 bg-gray-900 border border-r-0 border-white/10 rounded-l-lg flex items-center justify-center text-white/40 hover:text-white transition">
          {coiPanelOpen ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2"><Dna className="w-4 h-4 text-[#D74709]" /><h3 className="text-sm font-semibold">Salud Genetica</h3></div>
          <button onClick={() => setCoiPanelOpen(false)} className="text-white/40 hover:text-white"><ChevronRight className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="text-center"><p className={`text-4xl font-bold ${coiC[coiLevel].text}`}>{coi}%</p><p className="text-xs text-white/40 mt-1">Coeficiente de Consanguinidad</p></div>
          <div><div className="h-3 rounded-full overflow-hidden flex"><div className="bg-green-500 flex-1" /><div className="bg-yellow-500 flex-1" /><div className="bg-orange-500 flex-1" /><div className="bg-red-500 flex-1" /></div><div className="relative h-3 -mt-0.5"><div className="absolute w-2.5 h-2.5 bg-white rounded-full border-2 border-gray-900 -translate-x-1 shadow" style={{ left: `${Math.min((coi / 25) * 100, 100)}%` }} /></div><div className="flex justify-between text-[9px] text-white/25 mt-1"><span>0%</span><span>6.25%</span><span>12.5%</span><span>25%+</span></div></div>
          <div className={`${coiC[coiLevel].bg} rounded-lg p-3 flex items-start gap-2`}><CheckCircle className={`w-4 h-4 ${coiC[coiLevel].text} mt-0.5 flex-shrink-0`} /><p className={`text-xs ${coiC[coiLevel].text}`}>{coiText}</p></div>
          <p className="text-[10px] text-white/20 text-center">Calculado con 10 generaciones</p>
        </div>
      </div>

      {/* 4 Floating buttons */}
      <div className="fixed bottom-[30px] z-30 flex items-center gap-2" style={{ left: 'calc(var(--sidebar-width, 256px) + 30px)' }}>
        <div className="relative">
          <button onClick={e => { e.stopPropagation(); setZoomMenuOpen(!zoomMenuOpen); setGenMenuOpen(false) }}
            className="w-11 h-11 rounded-full bg-gray-900 border border-white/10 flex items-center justify-center text-white/60 transition shadow-lg hover:border-white/30">
            <Search className="w-4 h-4" />
          </button>
          {zoomMenuOpen && <div className="absolute bottom-14 left-0 bg-gray-800 border border-white/10 rounded-lg shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            {[150,140,130,120,110,100,90,80,70,60,50].map(z => <button key={z} onClick={() => { setZoom(z); setZoomMenuOpen(false) }} className={`block w-full px-4 py-1.5 text-xs text-center transition ${zoom === z ? 'bg-[#D74709] text-white' : 'text-white/60 hover:bg-white/10'}`}>{z}%</button>)}
          </div>}
        </div>
        <div className="relative">
          <button onClick={e => { e.stopPropagation(); setGenMenuOpen(!genMenuOpen); setZoomMenuOpen(false) }}
            className="w-11 h-11 rounded-full bg-gray-900 border border-white/10 flex items-center justify-center text-white/60 transition shadow-lg hover:border-white/30 font-bold text-xs">
            x{maxGen}
          </button>
          {genMenuOpen && <div className="absolute bottom-14 left-0 bg-gray-800 border border-white/10 rounded-lg shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            {[10,9,8,7,6,5,4,3].map(g => <button key={g} onClick={() => { setMaxGen(g); setGenMenuOpen(false) }} className={`block w-full px-4 py-1.5 text-xs text-center transition ${maxGen === g ? 'bg-[#D74709] text-white' : 'text-white/60 hover:bg-white/10'}`}>x{g}</button>)}
          </div>}
        </div>
        <button onClick={() => setVertical(!vertical)}
          className={`w-11 h-11 rounded-full border flex items-center justify-center transition shadow-lg ${vertical ? 'bg-[#D74709] border-[#D74709] text-white' : 'bg-gray-900 border-white/10 text-white/60 hover:border-white/30'}`}>
          <ArrowLeftRight className="w-4 h-4" />
        </button>
        <button onClick={toggleInbreeding}
          className={`w-11 h-11 rounded-full border flex items-center justify-center transition shadow-lg ${showInbreeding ? 'bg-[#D74709] border-[#D74709] text-white' : 'bg-gray-900 border-white/10 text-white/60 hover:border-white/30'}`}>
          <GitBranch className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

/* Card: photo left, info right, sex color only on photo right border */
const CARD_W = 200
const CARD_H = 64

function Card({ node, isRoot, si, rc }: { node: PedigreeNode; isRoot?: boolean; si: boolean; rc: Map<string, number> }) {
  const isMale = node.sex === 'male'
  const sexColor = isMale ? '#017DFA' : '#e84393'
  const reps = rc.get(node.id) || 0
  const repColor = reps >= 2 ? (RC[Math.min(reps, RC.length - 1)] || '#e74c3c') : ''

  return (
    <Link href={`/dogs/${node.id}`}
      className={`flex items-stretch bg-white/[0.04] border ${isRoot ? 'border-[#D74709]' : 'border-white/10'} rounded-xl overflow-hidden hover:bg-white/[0.07] transition relative`}
      style={{ width: CARD_W, height: CARD_H }}>
      {/* Photo left with sex color right border */}
      <div className="w-[56px] flex-shrink-0 bg-white/5 relative">
        {node.photo_url
          ? <img src={node.photo_url} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center"><img src="/icon.svg" alt="" className="w-5 h-5 opacity-20" /></div>}
        <div className="absolute top-0 right-0 bottom-0 w-[3px]" style={{ backgroundColor: sexColor }} />
      </div>
      {/* Info right */}
      <div className="flex-1 min-w-0 px-2.5 py-1.5 flex flex-col justify-center overflow-hidden">
        <p className="text-[12px] font-bold text-white leading-tight whitespace-nowrap" style={{ maskImage: 'linear-gradient(to right, black 80%, transparent)', WebkitMaskImage: 'linear-gradient(to right, black 80%, transparent)' }}>{node.name}</p>
        {node.breed_name && <p className="text-[10px] text-white/35 truncate mt-0.5">{node.breed_name}</p>}
      </div>
      {si && reps >= 2 && (
        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: repColor }}>{reps}x</span>
      )}
    </Link>
  )
}

/* ---- HORIZONTAL ---- */
function HNode({ node, nodeMap, gen, maxGen, isRoot, si, rc }: {
  node: PedigreeNode; nodeMap: Map<string, PedigreeNode>; gen: number; maxGen: number; isRoot?: boolean; si: boolean; rc: Map<string, number>
}) {
  if (gen >= maxGen) return null
  const f = node.father_id ? nodeMap.get(node.father_id) : null
  const m = node.mother_id ? nodeMap.get(node.mother_id) : null
  const hasP = (f || m) && gen < maxGen - 1
  const GAP = 50

  return (
    <div className="flex items-center">
      <Card node={node} isRoot={isRoot} si={si} rc={rc} />
      {hasP && (
        <div className="flex flex-col justify-center relative" style={{ marginLeft: GAP, gap: 8 }}>
          {/* Horizontal connector */}
          <div className="absolute bg-white/12" style={{ left: -GAP, top: '50%', width: GAP, height: 1 }} />
          {/* Vertical connector between children */}
          <div className="absolute bg-white/12" style={{ left: 0, top: '25%', height: '50%', width: 1 }} />

          {/* Father */}
          <div className="relative" style={{ paddingLeft: 20 }}>
            <div className="absolute bg-white/12" style={{ left: 0, top: '50%', width: 20, height: 1 }} />
            {f ? <HNode node={f} nodeMap={nodeMap} gen={gen + 1} maxGen={maxGen} si={si} rc={rc} /> : <EmptyCircle sex="male" />}
          </div>
          {/* Mother */}
          <div className="relative" style={{ paddingLeft: 20 }}>
            <div className="absolute bg-white/12" style={{ left: 0, top: '50%', width: 20, height: 1 }} />
            {m ? <HNode node={m} nodeMap={nodeMap} gen={gen + 1} maxGen={maxGen} si={si} rc={rc} /> : <EmptyCircle sex="female" />}
          </div>
        </div>
      )}
    </div>
  )
}

/* ---- VERTICAL ---- */
function VNode({ node, nodeMap, gen, maxGen, isRoot, si, rc }: {
  node: PedigreeNode; nodeMap: Map<string, PedigreeNode>; gen: number; maxGen: number; isRoot?: boolean; si: boolean; rc: Map<string, number>
}) {
  if (gen >= maxGen) return null
  const f = node.father_id ? nodeMap.get(node.father_id) : null
  const m = node.mother_id ? nodeMap.get(node.mother_id) : null
  const hasP = (f || m) && gen < maxGen - 1

  return (
    <div className="flex flex-col items-center">
      <Card node={node} isRoot={isRoot} si={si} rc={rc} />
      {hasP && (
        <div className="relative mt-10">
          {/* Vertical line down from card */}
          <div className="absolute left-1/2 -top-10 w-px h-10 bg-white/12" />
          {/* Horizontal line connecting both children */}
          <div className="absolute top-0 left-1/4 right-1/4 h-px bg-white/12" />

          <div className="flex gap-8">
            <div className="relative flex flex-col items-center pt-6">
              <div className="absolute left-1/2 -top-0 w-px h-6 bg-white/12" />
              {f ? <VNode node={f} nodeMap={nodeMap} gen={gen + 1} maxGen={maxGen} si={si} rc={rc} /> : <EmptyCircle sex="male" />}
            </div>
            <div className="relative flex flex-col items-center pt-6">
              <div className="absolute left-1/2 -top-0 w-px h-6 bg-white/12" />
              {m ? <VNode node={m} nodeMap={nodeMap} gen={gen + 1} maxGen={maxGen} si={si} rc={rc} /> : <EmptyCircle sex="female" />}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function EmptyCircle({ sex }: { sex: string }) {
  const bc = sex === 'female' ? 'border-pink-400/30' : 'border-blue-400/30'
  return <div className={`w-9 h-9 rounded-full border-2 border-dashed ${bc} flex items-center justify-center text-white/20 text-xs`}>?</div>
}
