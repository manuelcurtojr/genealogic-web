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

function countOccurrences(nodeId: string | null, nodeMap: Map<string, PedigreeNode>, maxGen: number, gen: number, counts: Map<string, number>) {
  if (!nodeId || gen > maxGen) return
  const node = nodeMap.get(nodeId)
  if (!node) return
  counts.set(nodeId, (counts.get(nodeId) || 0) + 1)
  countOccurrences(node.father_id, nodeMap, maxGen, gen + 1, counts)
  countOccurrences(node.mother_id, nodeMap, maxGen, gen + 1, counts)
}

const REPEAT_COLORS = ['', '', '#3498db', '#27ae60', '#f39c12', '#e74c3c', '#9b59b6', '#e84393']

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

  const repeatCounts = useMemo(() => {
    const c = new Map<string, number>()
    countOccurrences(root.father_id, nodeMap, maxGen, 1, c)
    countOccurrences(root.mother_id, nodeMap, maxGen, 1, c)
    return c
  }, [root, nodeMap, maxGen])

  const coiC: Record<string, { bg: string; text: string }> = {
    green: { bg: 'bg-green-500/15', text: 'text-green-400' },
    orange: { bg: 'bg-orange-500/15', text: 'text-orange-400' },
    red: { bg: 'bg-red-500/15', text: 'text-red-400' },
  }

  const toggleInbreeding = () => { setShowInbreeding(s => !s); setCoiPanelOpen(p => !p) }

  return (
    <div className="relative">
      {/* Tree */}
      <div className="overflow-auto pb-20" style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}>
        <div className={`min-w-max py-4 ${vertical ? '' : 'flex items-center'}`}>
          {vertical
            ? <TreeNodeV node={root} nodeMap={nodeMap} gen={0} maxGen={maxGen} isRoot showInbreeding={showInbreeding} repeatCounts={repeatCounts} />
            : <TreeNodeH node={root} nodeMap={nodeMap} gen={0} maxGen={maxGen} isRoot showInbreeding={showInbreeding} repeatCounts={repeatCounts} />
          }
        </div>
      </div>

      {/* COI Side Panel */}
      <div className={`fixed top-[56px] right-0 bottom-0 w-[320px] z-[55] bg-gray-900 border-l border-white/10 shadow-2xl transition-transform duration-300 flex flex-col ${coiPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <button onClick={() => setCoiPanelOpen(!coiPanelOpen)}
          className="absolute -left-7 top-1/2 -translate-y-1/2 w-7 h-14 bg-gray-900 border border-r-0 border-white/10 rounded-l-lg flex items-center justify-center text-white/40 hover:text-white transition">
          {coiPanelOpen ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
          <div className="flex items-center gap-2"><Dna className="w-4 h-4 text-[#D74709]" /><h3 className="text-sm font-semibold">Salud Genetica</h3></div>
          <button onClick={() => setCoiPanelOpen(false)} className="text-white/40 hover:text-white"><ChevronRight className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="text-center">
            <p className={`text-4xl font-bold ${coiC[coiLevel].text}`}>{coi}%</p>
            <p className="text-xs text-white/40 mt-1">Coeficiente de Consanguinidad (COI)</p>
          </div>
          <div>
            <div className="h-3 rounded-full overflow-hidden flex">
              <div className="bg-green-500 flex-1" /><div className="bg-yellow-500 flex-1" /><div className="bg-orange-500 flex-1" /><div className="bg-red-500 flex-1" />
            </div>
            <div className="relative h-3 -mt-0.5">
              <div className="absolute w-2.5 h-2.5 bg-white rounded-full border-2 border-gray-900 -translate-x-1 shadow" style={{ left: `${Math.min((coi / 25) * 100, 100)}%` }} />
            </div>
            <div className="flex justify-between text-[9px] text-white/25 mt-1"><span>0%</span><span>6.25%</span><span>12.5%</span><span>25%+</span></div>
          </div>
          <div className={`${coiC[coiLevel].bg} rounded-lg p-3 flex items-start gap-2`}>
            <CheckCircle className={`w-4 h-4 ${coiC[coiLevel].text} mt-0.5 flex-shrink-0`} />
            <p className={`text-xs ${coiC[coiLevel].text}`}>{coiText}</p>
          </div>
          <p className="text-[10px] text-white/20 text-center">Calculado con 10 generaciones</p>
        </div>
      </div>

      {/* 4 Floating buttons */}
      <div className="fixed bottom-[30px] z-30 flex items-center gap-2" style={{ left: 'calc(var(--sidebar-width, 256px) + 30px)' }}>
        {/* Zoom */}
        <div className="relative">
          <button onClick={() => { setZoomMenuOpen(!zoomMenuOpen); setGenMenuOpen(false) }}
            className="w-11 h-11 rounded-full bg-gray-900 border border-white/10 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition shadow-lg">
            <Search className="w-4 h-4" />
          </button>
          {zoomMenuOpen && (
            <div className="absolute bottom-14 left-0 bg-gray-800 border border-white/10 rounded-lg shadow-xl overflow-hidden">
              {[50,60,70,80,90,100,110,120,130,140,150].reverse().map(z => (
                <button key={z} onClick={() => { setZoom(z); setZoomMenuOpen(false) }}
                  className={`block w-full px-4 py-1.5 text-xs text-center transition ${zoom === z ? 'bg-[#D74709] text-white' : 'text-white/60 hover:bg-white/10'}`}>
                  {z}%
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Generations */}
        <div className="relative">
          <button onClick={() => { setGenMenuOpen(!genMenuOpen); setZoomMenuOpen(false) }}
            className="w-11 h-11 rounded-full bg-gray-900 border border-white/10 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition shadow-lg font-bold text-xs">
            x{maxGen}
          </button>
          {genMenuOpen && (
            <div className="absolute bottom-14 left-0 bg-gray-800 border border-white/10 rounded-lg shadow-xl overflow-hidden">
              {[10,9,8,7,6,5,4,3].map(g => (
                <button key={g} onClick={() => { setMaxGen(g); setGenMenuOpen(false) }}
                  className={`block w-full px-4 py-1.5 text-xs text-center transition ${maxGen === g ? 'bg-[#D74709] text-white' : 'text-white/60 hover:bg-white/10'}`}>
                  x{g}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Direction toggle */}
        <button onClick={() => setVertical(!vertical)}
          className={`w-11 h-11 rounded-full border flex items-center justify-center transition shadow-lg ${vertical ? 'bg-[#D74709] border-[#D74709] text-white' : 'bg-gray-900 border-white/10 text-white/50 hover:text-white hover:bg-white/10'}`}>
          <ArrowLeftRight className="w-4 h-4" />
        </button>

        {/* Inbreeding */}
        <button onClick={toggleInbreeding}
          className={`w-11 h-11 rounded-full border flex items-center justify-center transition shadow-lg ${showInbreeding ? 'bg-[#D74709] border-[#D74709] text-white' : 'bg-gray-900 border-white/10 text-white/50 hover:text-white hover:bg-white/10'}`}>
          <GitBranch className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

/* ---- HORIZONTAL TREE ---- */
const CW = 'w-[190px]'

function TreeNodeH({ node, nodeMap, gen, maxGen, isRoot, showInbreeding, repeatCounts }: {
  node: PedigreeNode; nodeMap: Map<string, PedigreeNode>; gen: number; maxGen: number; isRoot?: boolean
  showInbreeding: boolean; repeatCounts: Map<string, number>
}) {
  if (gen >= maxGen) return null
  const father = node.father_id ? nodeMap.get(node.father_id) : null
  const mother = node.mother_id ? nodeMap.get(node.mother_id) : null
  const hasParents = (father || mother) && gen < maxGen - 1
  const isMale = node.sex === 'male'
  const sexColor = isMale ? '#017DFA' : '#e84393'
  const repeats = repeatCounts.get(node.id) || 0
  const repeatColor = repeats >= 2 ? (REPEAT_COLORS[Math.min(repeats, REPEAT_COLORS.length - 1)] || '#e74c3c') : ''

  return (
    <div className="flex items-center">
      <Link href={`/dogs/${node.id}`}
        className={`${CW} flex items-center gap-2 bg-white/[0.04] border ${isRoot ? 'border-[#D74709]' : 'border-white/10'} rounded-xl p-2.5 hover:bg-white/[0.07] transition flex-shrink-0 relative`}>
        <div className="w-9 h-9 rounded-full border-2 overflow-hidden flex-shrink-0 bg-white/5" style={{ borderColor: sexColor }}>
          {node.photo_url
            ? <img src={node.photo_url} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center"><img src="/icon.svg" alt="" className="w-4 h-4 opacity-20" /></div>}
        </div>
        <div className="min-w-0 flex-1 overflow-hidden">
          <p className="text-[12px] font-bold text-white leading-tight whitespace-nowrap" style={{ maskImage: 'linear-gradient(to right, black 75%, transparent)', WebkitMaskImage: 'linear-gradient(to right, black 75%, transparent)' }}>{node.name}</p>
          {node.breed_name && <p className="text-[10px] text-white/35 truncate">{node.breed_name}</p>}
        </div>
        {showInbreeding && repeats >= 2 && (
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: repeatColor }}>{repeats}x</span>
        )}
      </Link>

      {hasParents && (
        <div className="flex flex-col justify-center relative ml-6" style={{ gap: '6px' }}>
          <div className="absolute -left-6 top-1/2 w-6 h-px bg-white/12" />
          <div className="relative pl-5">
            <div className="absolute left-0 top-1/2 h-[calc(50%+3px)] w-px bg-white/12" style={{ top: '50%' }} />
            <div className="absolute left-0 top-1/2 w-5 h-px bg-white/12" />
            {father ? <TreeNodeH node={father} nodeMap={nodeMap} gen={gen + 1} maxGen={maxGen} showInbreeding={showInbreeding} repeatCounts={repeatCounts} /> : <Empty sex="male" />}
          </div>
          <div className="relative pl-5">
            <div className="absolute left-0 bottom-1/2 h-[calc(50%+3px)] w-px bg-white/12" />
            <div className="absolute left-0 top-1/2 w-5 h-px bg-white/12" />
            {mother ? <TreeNodeH node={mother} nodeMap={nodeMap} gen={gen + 1} maxGen={maxGen} showInbreeding={showInbreeding} repeatCounts={repeatCounts} /> : <Empty sex="female" />}
          </div>
        </div>
      )}
    </div>
  )
}

/* ---- VERTICAL TREE ---- */
function TreeNodeV({ node, nodeMap, gen, maxGen, isRoot, showInbreeding, repeatCounts }: {
  node: PedigreeNode; nodeMap: Map<string, PedigreeNode>; gen: number; maxGen: number; isRoot?: boolean
  showInbreeding: boolean; repeatCounts: Map<string, number>
}) {
  if (gen >= maxGen) return null
  const father = node.father_id ? nodeMap.get(node.father_id) : null
  const mother = node.mother_id ? nodeMap.get(node.mother_id) : null
  const hasParents = (father || mother) && gen < maxGen - 1
  const isMale = node.sex === 'male'
  const sexColor = isMale ? '#017DFA' : '#e84393'
  const repeats = repeatCounts.get(node.id) || 0
  const repeatColor = repeats >= 2 ? (REPEAT_COLORS[Math.min(repeats, REPEAT_COLORS.length - 1)] || '#e74c3c') : ''

  return (
    <div className="flex flex-col items-center">
      <Link href={`/dogs/${node.id}`}
        className={`w-[160px] flex flex-col items-center gap-1 bg-white/[0.04] border ${isRoot ? 'border-[#D74709]' : 'border-white/10'} rounded-xl p-3 hover:bg-white/[0.07] transition relative`}>
        <div className="w-10 h-10 rounded-full border-2 overflow-hidden bg-white/5" style={{ borderColor: sexColor }}>
          {node.photo_url
            ? <img src={node.photo_url} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center"><img src="/icon.svg" alt="" className="w-4 h-4 opacity-20" /></div>}
        </div>
        <p className="text-[11px] font-bold text-white text-center leading-tight truncate w-full">{node.name}</p>
        {node.breed_name && <p className="text-[9px] text-white/35 truncate w-full text-center">{node.breed_name}</p>}
        {showInbreeding && repeats >= 2 && (
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: repeatColor }}>{repeats}x</span>
        )}
      </Link>

      {hasParents && (
        <div className="flex justify-center gap-4 mt-6 relative">
          <div className="absolute -top-6 left-1/2 w-px h-6 bg-white/12" />
          <div className="absolute top-0 left-[25%] right-[25%] h-px bg-white/12" />
          <div className="relative pt-4">
            <div className="absolute left-1/2 -top-0 w-px h-4 bg-white/12" />
            {father ? <TreeNodeV node={father} nodeMap={nodeMap} gen={gen + 1} maxGen={maxGen} showInbreeding={showInbreeding} repeatCounts={repeatCounts} /> : <Empty sex="male" />}
          </div>
          <div className="relative pt-4">
            <div className="absolute left-1/2 -top-0 w-px h-4 bg-white/12" />
            {mother ? <TreeNodeV node={mother} nodeMap={nodeMap} gen={gen + 1} maxGen={maxGen} showInbreeding={showInbreeding} repeatCounts={repeatCounts} /> : <Empty sex="female" />}
          </div>
        </div>
      )}
    </div>
  )
}

function Empty({ sex }: { sex: string }) {
  const bc = sex === 'female' ? 'border-pink-400/30' : 'border-blue-400/30'
  return <div className={`w-9 h-9 rounded-full border-2 border-dashed ${bc} flex items-center justify-center text-white/20 text-xs`}>?</div>
}
