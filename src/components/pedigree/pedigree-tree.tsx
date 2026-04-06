'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ZoomIn, ZoomOut, Dna, Search, ArrowLeftRight, GitBranch } from 'lucide-react'
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

export default function PedigreeTree({ data, rootId }: Props) {
  const [maxGen, setMaxGen] = useState(4)
  const [zoom, setZoom] = useState(100)
  const [showCoi, setShowCoi] = useState(false)

  const nodeMap = useMemo(() => {
    const map = new Map<string, PedigreeNode>()
    data.forEach((n) => map.set(n.id, n))
    return map
  }, [data])

  const root = nodeMap.get(rootId)
  if (!root) return null

  const coi = useMemo(() => calculateCOI(rootId, data, 10), [rootId, data])
  const coiLevel = getCOILevel(coi)
  const coiText = getCOIInterpretation(coi)

  const coiColors = {
    green: { bg: 'bg-green-500/15', text: 'text-green-400', border: 'border-green-500/30' },
    orange: { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30' },
    red: { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30' },
  }
  const coiStyle = coiColors[coiLevel]

  return (
    <div className="relative">
      {/* Top controls */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {(root.father_id && root.mother_id) && (
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${coiStyle.bg} ${coiStyle.border}`}>
            <Dna className={`w-4 h-4 ${coiStyle.text}`} />
            <span className={`text-sm font-bold ${coiStyle.text}`}>COI: {coi}%</span>
          </div>
        )}
        <div className="flex-1" />
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-white/40">Generaciones:</span>
          <div className="flex bg-white/5 rounded-lg border border-white/10 overflow-hidden">
            {[3, 4, 5].map(g => (
              <button key={g} onClick={() => setMaxGen(g)}
                className={`px-2.5 py-1 text-xs font-medium transition ${maxGen === g ? 'bg-[#D74709] text-white' : 'text-white/40 hover:text-white/70'}`}>
                {g}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setZoom(z => Math.max(50, z - 10))} className="p-1.5 text-white/30 hover:text-white/60 transition"><ZoomOut className="w-4 h-4" /></button>
          <span className="text-xs text-white/40 w-8 text-center">{zoom}%</span>
          <button onClick={() => setZoom(z => Math.min(130, z + 10))} className="p-1.5 text-white/30 hover:text-white/60 transition"><ZoomIn className="w-4 h-4" /></button>
        </div>
      </div>

      {/* COI detail panel */}
      {showCoi && coi > 0 && (
        <div className={`text-xs ${coiStyle.text} mb-4 ${coiStyle.bg} border ${coiStyle.border} rounded-lg p-3`}>
          <p className="font-semibold mb-1">COI: {coi}%</p>
          {coiText}
        </div>
      )}

      {/* Tree — no box, free-flowing */}
      <div className="overflow-x-auto pb-16" style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}>
        <div className="flex items-center min-w-max py-4">
          <TreeNode node={root} nodeMap={nodeMap} gen={0} maxGen={maxGen} isRoot />
        </div>
      </div>

      {/* 4 Floating buttons — fixed bottom-left of viewport */}
      <div className="fixed bottom-[30px] z-30 flex items-center gap-2" style={{ left: 'calc(var(--sidebar-width, 256px) + 30px)' }}>
        <button onClick={() => setZoom(z => z === 100 ? 70 : 100)}
          className="w-11 h-11 rounded-full bg-gray-900 border border-white/10 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition shadow-lg" title="Zoom">
          <Search className="w-4.5 h-4.5" />
        </button>
        <button onClick={() => setMaxGen(g => g >= 5 ? 3 : g + 1)}
          className="w-11 h-11 rounded-full bg-gray-900 border border-white/10 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition shadow-lg font-bold text-xs" title="Generaciones">
          x{maxGen}
        </button>
        <button className="w-11 h-11 rounded-full bg-gray-900 border border-white/10 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition shadow-lg" title="Cambiar direccion">
          <ArrowLeftRight className="w-4.5 h-4.5" />
        </button>
        <button onClick={() => setShowCoi(!showCoi)}
          className={`w-11 h-11 rounded-full border flex items-center justify-center transition shadow-lg ${showCoi ? 'bg-[#D74709] border-[#D74709] text-white' : 'bg-gray-900 border-white/10 text-white/50 hover:text-white hover:bg-white/10'}`} title="Endogamia">
          <GitBranch className="w-4.5 h-4.5" />
        </button>
      </div>
    </div>
  )
}

function TreeNode({ node, nodeMap, gen, maxGen, isRoot }: { node: PedigreeNode; nodeMap: Map<string, PedigreeNode>; gen: number; maxGen: number; isRoot?: boolean }) {
  if (gen >= maxGen) return null

  const father = node.father_id ? nodeMap.get(node.father_id) : null
  const mother = node.mother_id ? nodeMap.get(node.mother_id) : null
  const hasParents = (father || mother) && gen < maxGen - 1

  const isMale = node.sex === 'male'
  const sexColor = isMale ? '#017DFA' : '#e84393'
  const borderStyle = isRoot ? 'border-[#D74709]' : isMale ? 'border-blue-400/50' : 'border-pink-400/50'
  const bgStyle = isRoot ? 'bg-[#D74709]/5' : 'bg-white/[0.04]'

  return (
    <div className="flex items-center">
      {/* Card */}
      <Link
        href={`/dogs/${node.id}`}
        className={`flex items-center gap-3 ${bgStyle} border ${borderStyle} rounded-xl p-3 hover:bg-white/[0.08] transition flex-shrink-0 min-w-[200px] max-w-[240px]`}
      >
        <div className="w-11 h-11 rounded-full border-2 overflow-hidden flex-shrink-0 bg-white/5" style={{ borderColor: sexColor }}>
          {node.photo_url ? (
            <img src={node.photo_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <img src="/icon.svg" alt="" className="w-5 h-5 opacity-20" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-white leading-tight truncate">{node.name}</p>
          {node.breed_name && <p className="text-[11px] text-white/40 truncate">{node.breed_name}</p>}
          {gen <= 1 && node.registration && <p className="text-[10px] text-white/25 font-mono truncate">{node.registration}</p>}
        </div>
      </Link>

      {/* Connector + Parents */}
      {hasParents && (
        <div className="flex flex-col justify-center ml-8 pl-6 relative" style={{ gap: '8px' }}>
          {/* Horizontal connector from card to split */}
          <div className="absolute left-0 top-1/2 w-6 h-px bg-white/15" />
          {/* Vertical line connecting father and mother */}
          <div className="absolute left-6 top-[25%] bottom-[25%] w-px bg-white/15" />

          {/* Father */}
          <div className="relative pl-5">
            <div className="absolute left-0 top-1/2 w-5 h-px bg-white/15" />
            {father ? (
              <TreeNode node={father} nodeMap={nodeMap} gen={gen + 1} maxGen={maxGen} />
            ) : (
              <EmptyNode sex="male" />
            )}
          </div>

          {/* Mother */}
          <div className="relative pl-5">
            <div className="absolute left-0 top-1/2 w-5 h-px bg-white/15" />
            {mother ? (
              <TreeNode node={mother} nodeMap={nodeMap} gen={gen + 1} maxGen={maxGen} />
            ) : (
              <EmptyNode sex="female" />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function EmptyNode({ sex }: { sex: string }) {
  const borderColor = sex === 'female' ? 'border-pink-400/30' : 'border-blue-400/30'
  return (
    <div className={`w-11 h-11 rounded-full border-2 border-dashed ${borderColor} flex items-center justify-center text-white/20 text-xs`}>
      ?
    </div>
  )
}
