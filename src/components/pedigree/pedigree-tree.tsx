'use client'

import Link from 'next/link'

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
  const nodeMap = new Map<string, PedigreeNode>()
  data.forEach((n) => nodeMap.set(n.id, n))

  const root = nodeMap.get(rootId)
  if (!root) return null

  return (
    <div className="flex items-center min-w-max">
      <TreeNode node={root} nodeMap={nodeMap} gen={0} />
    </div>
  )
}

function TreeNode({ node, nodeMap, gen }: { node: PedigreeNode; nodeMap: Map<string, PedigreeNode>; gen: number }) {
  const father = node.father_id ? nodeMap.get(node.father_id) : null
  const mother = node.mother_id ? nodeMap.get(node.mother_id) : null
  const hasParents = father || mother

  const sexBorder = node.sex === 'female' ? 'border-pink-400/60' : 'border-blue-400/60'
  const photoBorder = node.sex === 'female' ? 'border-pink-400' : 'border-blue-400'

  const cardSize = gen <= 1 ? 'min-w-[180px] max-w-[200px] p-2.5' :
                   gen <= 3 ? 'min-w-[150px] max-w-[170px] p-2' :
                   'min-w-[120px] max-w-[140px] p-1.5'
  const photoSize = gen <= 1 ? 'w-10 h-10' : gen <= 3 ? 'w-8 h-8' : 'w-6 h-6'
  const nameSize = gen <= 1 ? 'text-[12px]' : gen <= 3 ? 'text-[11px]' : 'text-[10px]'

  return (
    <div className="flex items-center">
      {/* Card */}
      <Link
        href={`/dogs/${node.id}`}
        className={`flex items-center gap-2 bg-white/[0.06] border ${sexBorder} rounded-lg ${cardSize} hover:border-[#D74709] hover:bg-white/[0.09] transition flex-shrink-0`}
      >
        <div className={`${photoSize} rounded-full border-2 ${photoBorder} overflow-hidden flex-shrink-0 bg-white/5`}>
          {node.photo_url ? (
            <img src={node.photo_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/20 text-[10px]">
              {node.sex === 'female' ? '♀' : '♂'}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className={`${nameSize} font-semibold text-white leading-tight truncate`}>{node.name}</p>
          {gen <= 2 && node.registration && (
            <p className="text-[9px] text-white/30 font-mono truncate">{node.registration}</p>
          )}
        </div>
      </Link>

      {/* Parents */}
      {hasParents && (
        <div className="flex flex-col justify-center ml-6 pl-5 relative" style={{ gap: '4px' }}>
          {/* Horizontal stub */}
          <div className="absolute left-0 top-1/2 w-5 h-0.5 bg-white/15" />

          {/* Father */}
          <div className="relative pl-4">
            <div className="absolute left-0 top-0 bottom-1/2 w-0.5 bg-white/15 rounded-tl-lg" />
            <div className="absolute left-0 top-1/2 w-4 h-0.5 bg-white/15" />
            {father ? (
              <TreeNode node={father} nodeMap={nodeMap} gen={gen + 1} />
            ) : (
              <EmptyNode sex="male" size={photoSize} />
            )}
          </div>

          {/* Mother */}
          <div className="relative pl-4">
            <div className="absolute left-0 top-1/2 bottom-0 w-0.5 bg-white/15 rounded-bl-lg" />
            <div className="absolute left-0 top-1/2 w-4 h-0.5 bg-white/15" />
            {mother ? (
              <TreeNode node={mother} nodeMap={nodeMap} gen={gen + 1} />
            ) : (
              <EmptyNode sex="female" size={photoSize} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function EmptyNode({ sex, size }: { sex: string; size: string }) {
  const borderColor = sex === 'female' ? 'border-pink-400/30' : 'border-blue-400/30'
  return (
    <div className={`${size} rounded-full border-2 border-dashed ${borderColor} flex items-center justify-center text-white/20 text-xs`}>
      ?
    </div>
  )
}
