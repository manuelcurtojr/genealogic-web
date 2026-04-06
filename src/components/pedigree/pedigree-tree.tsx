'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ZoomIn, ZoomOut, Search, ArrowLeftRight, GitBranch, X, ChevronLeft, ChevronRight, Dna, CheckCircle } from 'lucide-react'
import { calculateCOI, getCOILevel, getCOIInterpretation } from './coi-calculator'

interface PedigreeNode {
  id: string
  name: string
  sex: string
  registration: string | null
  father_id: string | null
  mother_id: string | null
  generation: number
  photo_url: string | null
  breed_name: string | null
  color_name: string | null
}

interface Props {
  data: PedigreeNode[]
  rootId: string
}

// Count how many times each dog appears in the tree (for inbreeding highlighting)
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

  const nodeMap = useMemo(() => {
    const map = new Map<string, PedigreeNode>()
    data.forEach(n => map.set(n.id, n))
    return map
  }, [data])

  const root = nodeMap.get(rootId)
  if (!root) return null

  const coi = useMemo(() => calculateCOI(rootId, data, 10), [rootId, data])
  const coiLevel = getCOILevel(coi)
  const coiText = getCOIInterpretation(coi)

  // Count repeated ancestors
  const repeatCounts = useMemo(() => {
    const counts = new Map<string, number>()
    countOccurrences(root.father_id, nodeMap, maxGen, 1, counts)
    countOccurrences(root.mother_id, nodeMap, maxGen, 1, counts)
    return counts
  }, [root, nodeMap, maxGen])

  const coiColors: Record<string, { bg: string; text: string; bar: string }> = {
    green: { bg: 'bg-green-500/15', text: 'text-green-400', bar: 'from-green-500' },
    orange: { bg: 'bg-orange-500/15', text: 'text-orange-400', bar: 'from-orange-500' },
    red: { bg: 'bg-red-500/15', text: 'text-red-400', bar: 'from-red-500' },
  }

  const toggleInbreeding = () => {
    const next = !showInbreeding
    setShowInbreeding(next)
    if (next) setCoiPanelOpen(true)
    else setCoiPanelOpen(false)
  }

  return (
    <div className="relative">
      {/* Tree — free flowing */}
      <div className="overflow-x-auto pb-20" style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}>
        <div className="flex items-center min-w-max py-4">
          <TreeNode node={root} nodeMap={nodeMap} gen={0} maxGen={maxGen} isRoot showInbreeding={showInbreeding} repeatCounts={repeatCounts} />
        </div>
      </div>

      {/* COI Side Panel — slides from right */}
      <div className={`fixed top-[56px] right-0 bottom-0 w-[340px] z-[55] bg-gray-900 border-l border-white/10 shadow-2xl transition-transform duration-300 flex flex-col ${coiPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Collapse tab on the left edge */}
        <button
          onClick={() => setCoiPanelOpen(!coiPanelOpen)}
          className="absolute -left-8 top-1/2 -translate-y-1/2 w-8 h-16 bg-gray-900 border border-r-0 border-white/10 rounded-l-lg flex items-center justify-center text-white/40 hover:text-white transition"
        >
          {coiPanelOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Dna className="w-5 h-5 text-[#D74709]" />
            <h3 className="text-base font-semibold">Salud Genetica</h3>
          </div>
          <button onClick={() => setCoiPanelOpen(false)} className="text-white/40 hover:text-white transition">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* COI percentage */}
          <div className="text-center">
            <p className={`text-5xl font-bold ${coiColors[coiLevel].text}`}>{coi}%</p>
            <p className="text-sm text-white/50 mt-1">Coeficiente de Consanguinidad (COI)</p>
          </div>

          {/* Color bar */}
          <div>
            <div className="h-4 rounded-full overflow-hidden flex">
              <div className="bg-green-500 flex-1" />
              <div className="bg-yellow-500 flex-1" />
              <div className="bg-orange-500 flex-1" />
              <div className="bg-red-500 flex-1" />
            </div>
            {/* Indicator */}
            <div className="relative h-3 -mt-0.5">
              <div className="absolute w-3 h-3 bg-white rounded-full border-2 border-gray-900 -translate-x-1.5 shadow"
                style={{ left: `${Math.min((coi / 25) * 100, 100)}%` }} />
            </div>
            <div className="flex justify-between text-[10px] text-white/30 mt-1">
              <span>0%</span><span>6.25%</span><span>12.5%</span><span>25%+</span>
            </div>
          </div>

          {/* Interpretation */}
          <div className={`${coiColors[coiLevel].bg} rounded-lg p-3 flex items-start gap-2`}>
            <CheckCircle className={`w-4 h-4 ${coiColors[coiLevel].text} mt-0.5 flex-shrink-0`} />
            <p className={`text-sm ${coiColors[coiLevel].text}`}>{coiText}</p>
          </div>

          <p className="text-xs text-white/30 text-center">Calculado con 10 generaciones</p>
        </div>
      </div>

      {/* 4 Floating buttons — fixed bottom-left */}
      <div className="fixed bottom-[30px] z-30 flex items-center gap-2" style={{ left: 'calc(var(--sidebar-width, 256px) + 30px)' }}>
        <button onClick={() => setZoom(z => z <= 50 ? 150 : z - 25)}
          className="w-11 h-11 rounded-full bg-gray-900 border border-white/10 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition shadow-lg" title="Zoom">
          <Search className="w-4 h-4" />
        </button>

        {/* Generation button with popup */}
        <div className="relative">
          <button onClick={() => setGenMenuOpen(!genMenuOpen)}
            className="w-11 h-11 rounded-full bg-gray-900 border border-white/10 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition shadow-lg font-bold text-xs" title="Generaciones">
            x{maxGen}
          </button>
          {genMenuOpen && (
            <div className="absolute bottom-14 left-0 bg-gray-800 border border-white/10 rounded-lg shadow-xl overflow-hidden">
              {[3,4,5,6,7,8,9,10].map(g => (
                <button key={g} onClick={() => { setMaxGen(g); setGenMenuOpen(false) }}
                  className={`block w-full px-4 py-2 text-sm text-center transition ${maxGen === g ? 'bg-[#D74709] text-white' : 'text-white/60 hover:bg-white/10'}`}>
                  x{g}
                </button>
              ))}
            </div>
          )}
        </div>

        <button className="w-11 h-11 rounded-full bg-gray-900 border border-white/10 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition shadow-lg" title="Cambiar direccion">
          <ArrowLeftRight className="w-4 h-4" />
        </button>
        <button onClick={toggleInbreeding}
          className={`w-11 h-11 rounded-full border flex items-center justify-center transition shadow-lg ${showInbreeding ? 'bg-[#D74709] border-[#D74709] text-white' : 'bg-gray-900 border-white/10 text-white/50 hover:text-white hover:bg-white/10'}`} title="Endogamia">
          <GitBranch className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

const CARD_W = 'w-[200px]'

function TreeNode({ node, nodeMap, gen, maxGen, isRoot, showInbreeding, repeatCounts }: {
  node: PedigreeNode; nodeMap: Map<string, PedigreeNode>; gen: number; maxGen: number; isRoot?: boolean
  showInbreeding: boolean; repeatCounts: Map<string, number>
}) {
  if (gen >= maxGen) return null

  const father = node.father_id ? nodeMap.get(node.father_id) : null
  const mother = node.mother_id ? nodeMap.get(node.mother_id) : null
  const hasParents = (father || mother) && gen < maxGen - 1

  const isMale = node.sex === 'male'
  const sexColor = isMale ? '#017DFA' : '#e84393'
  const borderCls = isRoot ? 'border-[#D74709]' : isMale ? 'border-blue-400/50' : 'border-pink-400/50'
  const bgCls = isRoot ? 'bg-[#D74709]/5' : 'bg-white/[0.04]'

  const repeats = repeatCounts.get(node.id) || 0
  const repeatColor = repeats >= 2 ? (REPEAT_COLORS[Math.min(repeats, REPEAT_COLORS.length - 1)] || '#e74c3c') : ''

  return (
    <div className="flex items-center">
      {/* Card — fixed width */}
      <Link href={`/dogs/${node.id}`}
        className={`${CARD_W} flex items-center gap-2.5 ${bgCls} border ${borderCls} rounded-xl p-2.5 hover:bg-white/[0.08] transition flex-shrink-0 relative`}>
        <div className="w-10 h-10 rounded-full border-2 overflow-hidden flex-shrink-0 bg-white/5" style={{ borderColor: sexColor }}>
          {node.photo_url ? (
            <img src={node.photo_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center"><img src="/icon.svg" alt="" className="w-4 h-4 opacity-20" /></div>
          )}
        </div>
        <div className="min-w-0 flex-1 overflow-hidden">
          <p className="text-[13px] font-bold text-white leading-tight whitespace-nowrap overflow-hidden" style={{ maskImage: 'linear-gradient(to right, black 80%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to right, black 80%, transparent 100%)' }}>
            {node.name}
          </p>
          {node.breed_name && <p className="text-[11px] text-white/40 truncate">{node.breed_name}</p>}
        </div>

        {/* Inbreeding repeat badge */}
        {showInbreeding && repeats >= 2 && (
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: repeatColor }}>
            {repeats}x
          </span>
        )}
      </Link>

      {/* Connector + Parents */}
      {hasParents && (
        <div className="flex flex-col justify-center relative ml-8" style={{ gap: '10px' }}>
          {/* Horizontal line from card */}
          <div className="absolute -left-8 top-1/2 w-8 h-px bg-white/15" />

          {/* Father */}
          <div className="relative pl-6">
            <div className="absolute left-0 top-1/2 bottom-0 w-px bg-white/15" style={{ top: '50%', height: '0' }} />
            <div className="absolute left-0 top-1/2 w-6 h-px bg-white/15" />
            {/* Vertical connector */}
            <div className="absolute left-0 top-1/2 h-[calc(50%+5px)] w-px bg-white/15" style={{ top: '50%' }} />
            {father ? (
              <TreeNode node={father} nodeMap={nodeMap} gen={gen + 1} maxGen={maxGen} showInbreeding={showInbreeding} repeatCounts={repeatCounts} />
            ) : <EmptyNode sex="male" />}
          </div>

          {/* Mother */}
          <div className="relative pl-6">
            <div className="absolute left-0 bottom-1/2 h-[calc(50%+5px)] w-px bg-white/15" />
            <div className="absolute left-0 top-1/2 w-6 h-px bg-white/15" />
            {mother ? (
              <TreeNode node={mother} nodeMap={nodeMap} gen={gen + 1} maxGen={maxGen} showInbreeding={showInbreeding} repeatCounts={repeatCounts} />
            ) : <EmptyNode sex="female" />}
          </div>
        </div>
      )}
    </div>
  )
}

function EmptyNode({ sex }: { sex: string }) {
  const borderColor = sex === 'female' ? 'border-pink-400/30' : 'border-blue-400/30'
  return (
    <div className={`w-10 h-10 rounded-full border-2 border-dashed ${borderColor} flex items-center justify-center text-white/20 text-xs`}>?</div>
  )
}
